-- Rolled-back fixtures: no synthetic tutors, payments or reviews survive this test.
begin;
do $$
declare teacher uuid:=gen_random_uuid(); student uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid(); reviewer uuid:=gen_random_uuid(); tid uuid:=gen_random_uuid(); bid uuid:=gen_random_uuid(); slot timestamptz; b jsonb; application jsonb; reference text;
begin
 insert into auth.users(id,aud,role,email_confirmed_at,raw_user_meta_data) values(teacher,'authenticated','authenticated',now(),'{"account_kind":"teacher","nextstep_profile_pending":{"display_name":"Tutor fixture"}}');
 insert into auth.users(id,aud,role,email_confirmed_at) values(student,'authenticated','authenticated',now()),(stranger,'authenticated','authenticated',now()),(reviewer,'authenticated','authenticated',now());
 insert into public.profiles(id,display_name,grade_level,county,interests,favorite_subjects) values(student,'Student fixture','XI','Bihor','{}','{}'),(stranger,'Stranger fixture','XI','Bihor','{}','{}');
 perform set_config('request.jwt.claim.sub',teacher::text,true);
 set local role authenticated;
 application:=jsonb_build_object('display_name','Tutor fixture','biography','Profesor cu experiență în pregătirea elevilor pentru examene.','experience','Zece ani de experiență','qualifications','Studii universitare','levels',jsonb_build_array('XI','XII'),'subjects',jsonb_build_array(jsonb_build_object('subject','Matematică','price_minor',10000),jsonb_build_object('subject','Fizică','price_minor',9000)),'availability',jsonb_build_array(jsonb_build_object('weekday',extract(dow from (now() at time zone 'Europe/Bucharest')+interval '2 days'),'start_minute',0,'end_minute',1440)),'commission_accepted',true,'status','approved');
 reference:=public.start_teacher_application()->>'application_reference';
 begin perform public.tutoring_save_application(application,false); raise exception 'Legacy teacher application bypass succeeded'; exception when insufficient_privilege then null; end;
 reset role;
 -- The executive prepares only reviewed synthetic public facts; fixtures never persist.
 insert into public.tutor_profiles(id,user_id,display_name,biography,experience,qualifications,levels,commission_accepted,status)
 values(tid,teacher,application->>'display_name',application->>'biography',application->>'experience',application->>'qualifications',array['XI','XII'],true,'draft');
 insert into public.tutor_subjects(tutor_id,subject,price_minor) values(tid,'Matematică',10000),(tid,'Fizică',9000);
 insert into public.tutor_availability(tutor_id,weekday,start_minute,end_minute)
 values(tid,extract(dow from (now() at time zone 'Europe/Bucharest')+interval '2 days')::integer,0,1440);
 insert into account_private.executive_reviewers(user_id) values(reviewer);
 set local role authenticated;
 if public.tutoring_my_application()->>'status'<>'draft' then raise exception 'Client forged approval'; end if;
 if exists(select 1 from jsonb_array_elements(public.tutoring_discover()) t where t->>'id'=tid::text) then raise exception 'Draft publicly visible'; end if;
 begin update public.tutor_profiles set status='approved' where id=tid; raise exception 'Direct approval succeeded'; exception when insufficient_privilege then null; end;
 if has_function_privilege('authenticated','public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid)','execute') or has_function_privilege('authenticated','public.tutoring_settle(text,uuid,text,boolean,integer,text,text)','execute') or has_table_privilege('authenticated','tutoring_private.connect_accounts','select') then raise exception 'Privileged payment access leaked'; end if;
 reset role;
 perform account_private.review_teacher_application(reference,'submitted','synthetic-marketplace-response',reviewer);
 perform account_private.review_teacher_application(reference,'approved','synthetic-marketplace-response',reviewer);
 insert into tutoring_private.connect_accounts(tutor_id,stripe_account_id,status) values(tid,'acct_test_rolled_back','active');
 slot:=((now() at time zone 'Europe/Bucharest')::date+2+time '12:00') at time zone 'Europe/Bucharest';
 perform set_config('request.jwt.claim.sub',student::text,true);
 set local role authenticated;
 if public.tutoring_my_application() is not null then raise exception 'Another application leaked'; end if;
 if not exists(select 1 from public.tutoring_slots(tid) s where s.starts_at=slot) then raise exception 'Recurring slot missing'; end if;
 if not exists(select 1 from jsonb_array_elements(public.tutoring_discover('Tutor fixture','Fizică')) t where t->>'id'=tid::text) then raise exception 'Multi-subject search failed'; end if;
 begin perform public.tutoring_review(bid,5,'Forged'); raise exception 'Random review succeeded'; exception when raise_exception then if sqlerrm='Random review succeeded' then raise; end if; end;
 reset role;
 b:=public.tutoring_reserve(student,tid,'Matematică',slot,bid);
 if (b->>'amount_minor')::integer<>10000 or (b->>'platform_fee_minor')::integer<>2000 or (b->>'teacher_share_minor')::integer<>8000 then raise exception 'Wrong authoritative split'; end if;
 if public.tutoring_reserve(student,tid,'Matematică',slot,bid)->>'id'<>bid::text then raise exception 'Retry not idempotent'; end if;
 begin perform public.tutoring_reserve(stranger,tid,'Matematică',slot,gen_random_uuid()); raise exception 'Double booking succeeded'; exception when exclusion_violation then null; end;
 update public.tutor_subjects set price_minor=12000 where tutor_id=tid and subject='Matematică';
 if (select amount_minor from public.tutoring_bookings where id=bid)<>10000 then raise exception 'Snapshot price changed'; end if;
 perform public.tutoring_payment_link(bid,'cs_test_rolled_back');
 begin perform public.tutoring_settle('evt_wrong',bid,'cs_test_rolled_back',true,1,'ron','pi_rolled_back'); raise exception 'Wrong amount accepted'; exception when raise_exception then if sqlerrm='Wrong amount accepted' then raise; end if; end;
 perform public.tutoring_settle('evt_paid',bid,'cs_test_rolled_back',true,10000,'ron','pi_rolled_back');
 perform public.tutoring_settle('evt_paid',bid,'cs_test_rolled_back',true,10000,'ron','pi_rolled_back');
 perform public.tutoring_settle('evt_expired_late',bid,'cs_test_rolled_back',false,10000,'ron');
 if (select payment_status from public.tutoring_bookings where id=bid)<>'paid' or (select status from public.tutoring_bookings where id=bid)<>'scheduled' then raise exception 'Late event regressed payment'; end if;
 perform set_config('request.jwt.claim.sub',stranger::text,true);
 set local role authenticated;
 if exists(select 1 from jsonb_array_elements(public.tutoring_lessons(false)) row where row->>'id'=bid::text) then raise exception 'Private booking leaked'; end if;
 begin perform public.tutoring_complete(bid); raise exception 'Stranger completed lesson'; exception when raise_exception then if sqlerrm='Stranger completed lesson' then raise; end if; end;
 reset role;
 perform set_config('request.jwt.claim.sub',student::text,true);
 set local role authenticated;
 if not exists(select 1 from jsonb_array_elements(public.tutoring_lessons(false)) row where row->>'id'=bid::text) then raise exception 'Student cannot see booking'; end if;
 begin perform public.tutoring_review(bid,5,'Too early'); raise exception 'Uncompleted lesson reviewed'; exception when raise_exception then if sqlerrm='Uncompleted lesson reviewed' then raise; end if; end;
 reset role;
 update public.tutoring_bookings set starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' where id=bid;
 perform set_config('request.jwt.claim.sub',teacher::text,true);
 set local role authenticated;
 perform public.tutoring_complete(bid);
 reset role;
 perform set_config('request.jwt.claim.sub',student::text,true);
 set local role authenticated;
 perform public.tutoring_review(bid,5,'Explicații clare.');
 begin perform public.tutoring_review(bid,4,'Duplicate'); raise exception 'Duplicate review accepted'; exception when unique_violation then null; end;
 reset role;
 perform public.tutoring_refund('evt_refund', 'pi_rolled_back',10000);
 perform public.tutoring_settle('evt_paid_delayed',bid,'cs_test_rolled_back',true,10000,'ron','pi_rolled_back');
 if (select payment_status from public.tutoring_bookings where id=bid)<>'refunded' then raise exception 'Refund regressed'; end if;
 -- Existing account deletion must not fail because of new foreign keys.
 delete from auth.users where id=student;
 if exists(select 1 from public.tutoring_bookings where id=bid) then raise exception 'Private data survived deletion'; end if;
end $$;
rollback;
select 'PASS: approval, isolation, booking overlap, price snapshots, 20/80 split, webhook idempotency, reviews, refunds, deletion; fixtures rolled back' result;

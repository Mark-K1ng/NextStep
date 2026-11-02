-- Lightweight marketplace. No learning-material storage or Google credentials.
create extension if not exists btree_gist with schema extensions;
create schema if not exists tutoring_private;
revoke all on schema tutoring_private from public, anon, authenticated;

create table public.tutoring_subjects (name text primary key);
insert into public.tutoring_subjects(name) values
 ('Matematică'),('Informatică'),('Biologie'),('Istorie'),('Limbi străine'),('Fizică'),('Chimie'),('Arte'),('Sport'),('Limba română');
create table public.tutor_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade,
 display_name text not null check(length(display_name) between 2 and 100),
 biography text not null default '' check(length(biography)<=3000),
 experience text not null default '' check(length(experience)<=2000),
 qualifications text not null default '' check(length(qualifications)<=2000),
 levels text[] not null default '{}' check(levels <@ array['V','VI','VII','VIII','IX','X','XI','XII','student']::text[]),
 status text not null default 'draft' check(status in ('draft','submitted','under_review','approved','rejected','suspended')),
 commission_accepted boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.tutor_subjects (
 tutor_id uuid references public.tutor_profiles(id) on delete cascade, subject text references public.tutoring_subjects(name),
 price_minor integer not null check(price_minor between 1000 and 500000), primary key(tutor_id,subject)
);
create index tutor_subjects_subject_idx on public.tutor_subjects(subject,tutor_id);
create index tutor_profiles_approved_idx on public.tutor_profiles(display_name,id) where status='approved';
create table public.tutor_availability (
 id uuid primary key default gen_random_uuid(), tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
 weekday integer not null check(weekday between 0 and 6), start_minute integer not null check(start_minute between 0 and 1380 and start_minute%60=0),
 end_minute integer not null check(end_minute between 60 and 1440 and end_minute%60=0 and end_minute>start_minute),
 exclude using gist(tutor_id with =, weekday with =, int4range(start_minute,end_minute,'[)') with &&)
);
create table tutoring_private.settings (singleton boolean primary key default true check(singleton), platform_fee_bps integer not null check(platform_fee_bps between 0 and 10000));
insert into tutoring_private.settings values(true,2000);
create table tutoring_private.connect_accounts (
 tutor_id uuid primary key references public.tutor_profiles(id) on delete cascade,
 stripe_account_id text unique not null, status text not null default 'onboarding' check(status in ('not_started','onboarding','pending','active','restricted'))
);
create table public.external_classrooms (
 id uuid primary key default gen_random_uuid(), tutor_id uuid not null references public.tutor_profiles(id), student_id uuid not null references public.profiles(id),
 external_provider text not null default 'google_classroom' check(external_provider='google_classroom'), external_classroom_id text,
 external_classroom_url text check(external_classroom_url ~ '^https://classroom\.google\.com/'),
 status text not null default 'not_created' check(status in ('not_created','pending','active','unavailable')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(tutor_id,student_id)
);
create table public.tutoring_bookings (
 id uuid primary key, student_id uuid not null references public.profiles(id), tutor_id uuid not null references public.tutor_profiles(id),
 subject text not null references public.tutoring_subjects(name), starts_at timestamptz not null, ends_at timestamptz not null,
 amount_minor integer not null check(amount_minor>0), platform_fee_minor integer not null check(platform_fee_minor>=0),
 teacher_share_minor integer not null check(teacher_share_minor>=0), currency text not null default 'ron' check(currency='ron'),
 status text not null default 'pending_payment' check(status in ('pending_payment','scheduled','completed','cancelled','no_show','refunded')),
 payment_status text not null default 'unpaid' check(payment_status in ('unpaid','pending','requires_action','paid','failed','refunded','partially_refunded','cancelled')),
 classroom_id uuid references public.external_classrooms(id), created_at timestamptz not null default now(),
 check(ends_at=starts_at+interval '1 hour'), check(platform_fee_minor+teacher_share_minor=amount_minor),
 exclude using gist(tutor_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(status in ('pending_payment','scheduled','completed','no_show')),
 exclude using gist(student_id with =, tstzrange(starts_at,ends_at,'[)') with &&) where(status in ('pending_payment','scheduled','completed','no_show'))
);
create index tutoring_bookings_student_time_idx on public.tutoring_bookings(student_id,starts_at desc);
create index tutoring_bookings_tutor_time_idx on public.tutoring_bookings(tutor_id,starts_at desc);
create table tutoring_private.payments (
 booking_id uuid primary key references public.tutoring_bookings(id), checkout_id text unique, payment_intent_id text unique
);
create table tutoring_private.webhook_events (id text primary key, created_at timestamptz not null default now());
create table public.tutor_reviews (
 id uuid primary key default gen_random_uuid(), booking_id uuid not null unique references public.tutoring_bookings(id),
 tutor_id uuid not null references public.tutor_profiles(id), student_id uuid not null references public.profiles(id),
 rating integer not null check(rating between 1 and 5), comment text not null check(length(comment)<=1500), created_at timestamptz not null default now()
);
create index tutor_reviews_tutor_idx on public.tutor_reviews(tutor_id,created_at desc);

-- All writes go through narrowly scoped RPCs. Private provider identifiers never enter public tables.
alter table public.tutoring_subjects enable row level security;
alter table public.tutor_profiles enable row level security;
alter table public.tutor_subjects enable row level security;
alter table public.tutor_availability enable row level security;
alter table public.tutoring_bookings enable row level security;
alter table public.external_classrooms enable row level security;
alter table public.tutor_reviews enable row level security;
alter table tutoring_private.settings enable row level security;
alter table tutoring_private.connect_accounts enable row level security;
alter table tutoring_private.payments enable row level security;
alter table tutoring_private.webhook_events enable row level security;
revoke all on public.tutoring_subjects, public.tutor_profiles, public.tutor_subjects, public.tutor_availability, public.tutoring_bookings, public.external_classrooms, public.tutor_reviews from anon, authenticated;
grant select on public.tutoring_subjects to authenticated;
create policy subjects_read on public.tutoring_subjects for select to authenticated using(true);
-- Underlying tables intentionally have no general client policy; safe projections below are the API.

create function public.tutoring_discover(p_search text default '',p_subject text default '',p_offset integer default 0,p_limit integer default 21,p_id uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(row_data),'[]'::jsonb) from (
 select jsonb_build_object('id',t.id,'display_name',t.display_name,'biography',t.biography,'experience',t.experience,'qualifications',t.qualifications,'levels',t.levels,
 'subjects',(select coalesce(jsonb_agg(jsonb_build_object('subject',s.subject,'price_minor',s.price_minor) order by s.subject),'[]') from public.tutor_subjects s where s.tutor_id=t.id),
 'availability',(select coalesce(jsonb_agg(jsonb_build_object('weekday',a.weekday,'start_minute',a.start_minute,'end_minute',a.end_minute) order by a.weekday,a.start_minute),'[]') from public.tutor_availability a where a.tutor_id=t.id),
 'rating',(select round(avg(r.rating),1) from public.tutor_reviews r where r.tutor_id=t.id),
 'review_count',(select count(*) from public.tutor_reviews r where r.tutor_id=t.id),
 'completed_lessons',(select count(*) from public.tutoring_bookings b where b.tutor_id=t.id and b.status='completed'),
 'can_book',exists(select 1 from tutoring_private.connect_accounts c where c.tutor_id=t.id and c.status='active')) row_data
 from public.tutor_profiles t where auth.uid() is not null and t.status='approved' and (p_id is null or t.id=p_id)
 and (coalesce(p_search,'')='' or position(lower(left(p_search,100)) in lower(t.display_name))>0)
 and (coalesce(p_subject,'')='' or exists(select 1 from public.tutor_subjects s where s.tutor_id=t.id and s.subject=p_subject))
 order by t.display_name,t.id limit least(greatest(p_limit,1),21) offset least(greatest(p_offset,0),10000)
 ) q;
$$;
create function public.tutoring_my_application() returns jsonb language sql stable security definer set search_path='' as $$
 select to_jsonb(t)-'user_id' || jsonb_build_object(
 'subjects',(select coalesce(jsonb_agg(jsonb_build_object('subject',s.subject,'price_minor',s.price_minor)),'[]') from public.tutor_subjects s where s.tutor_id=t.id),
 'availability',(select coalesce(jsonb_agg(jsonb_build_object('weekday',a.weekday,'start_minute',a.start_minute,'end_minute',a.end_minute)),'[]') from public.tutor_availability a where a.tutor_id=t.id),
 'connect_status',coalesce((select c.status from tutoring_private.connect_accounts c where c.tutor_id=t.id),'not_started'))
 from public.tutor_profiles t where t.user_id=auth.uid();
$$;
create function public.tutoring_save_application(p_data jsonb,p_submit boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare tid uuid; current_status text; item jsonb;
begin
 if auth.uid() is null then raise exception 'Unauthorized'; end if;
 -- Serialize create/update and child replacements for the same account.
 perform 1 from public.profiles where id=auth.uid() for update;
 select id,status into tid,current_status from public.tutor_profiles where user_id=auth.uid() for update;
 if current_status in ('submitted','under_review','suspended') then raise exception 'Application locked'; end if;
 if jsonb_array_length(p_data->'subjects') not between 1 and 10 or jsonb_array_length(p_data->'availability')>21 then raise exception 'Invalid configuration'; end if;
 if p_submit and (length(trim(p_data->>'biography'))<40 or length(trim(p_data->>'experience'))<5 or length(trim(p_data->>'qualifications'))<5 or jsonb_array_length(p_data->'levels')=0 or jsonb_array_length(p_data->'availability')=0 or (p_data->>'commission_accepted')::boolean is distinct from true) then raise exception 'Incomplete application'; end if;
 -- Editing an approved public profile requires review again; never self-approve.
 insert into public.tutor_profiles(user_id,display_name,biography,experience,qualifications,levels,commission_accepted,status)
 values(auth.uid(),p_data->>'display_name',p_data->>'biography',p_data->>'experience',p_data->>'qualifications',array(select jsonb_array_elements_text(p_data->'levels')),(p_data->>'commission_accepted')::boolean,case when p_submit then 'submitted' else 'draft' end)
 on conflict(user_id) do update set display_name=excluded.display_name,biography=excluded.biography,experience=excluded.experience,qualifications=excluded.qualifications,levels=excluded.levels,commission_accepted=excluded.commission_accepted,status=excluded.status,updated_at=now() returning id into tid;
 delete from public.tutor_subjects where tutor_id=tid;
 for item in select * from jsonb_array_elements(p_data->'subjects') loop
 insert into public.tutor_subjects values(tid,item->>'subject',(item->>'price_minor')::integer);
 end loop;
 delete from public.tutor_availability where tutor_id=tid;
 for item in select * from jsonb_array_elements(p_data->'availability') loop
 insert into public.tutor_availability(tutor_id,weekday,start_minute,end_minute) values(tid,(item->>'weekday')::integer,(item->>'start_minute')::integer,(item->>'end_minute')::integer);
 end loop;
 return tid;
end; $$;

create function public.tutoring_slots(p_tutor uuid) returns table(starts_at timestamptz) language sql stable security definer set search_path='' as $$
 select distinct slot from public.tutor_availability a
 join public.tutor_profiles t on t.id=a.tutor_id and t.status='approved'
 cross join generate_series((now() at time zone 'Europe/Bucharest')::date, (now() at time zone 'Europe/Bucharest')::date+13,interval '1 day') d
 cross join lateral generate_series(a.start_minute,a.end_minute-60,60) minute
 cross join lateral (select (d::date+make_interval(mins=>minute)) at time zone 'Europe/Bucharest' slot) q
 where auth.uid() is not null and a.tutor_id=p_tutor and extract(dow from d)=a.weekday and slot>now()+interval '1 hour'
 and not exists(select 1 from public.tutoring_bookings b where b.tutor_id=p_tutor and b.status in ('pending_payment','scheduled','completed','no_show') and tstzrange(b.starts_at,b.ends_at,'[)') && tstzrange(slot,slot+interval '1 hour','[)'))
 order by slot limit 120;
$$;

-- Service-only atomic reservation: authoritative prices, availability and overlap constraints.
create function public.tutoring_reserve(p_student uuid,p_tutor uuid,p_subject text,p_start timestamptz,p_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare t public.tutor_profiles; b public.tutoring_bookings; amount integer; fee integer; local_start timestamp;
begin
 select * into t from public.tutor_profiles where id=p_tutor for update;
 select * into b from public.tutoring_bookings where id=p_id;
 if found then
 if b.student_id<>p_student or b.tutor_id<>p_tutor or b.subject<>p_subject or b.starts_at<>p_start or b.status<>'pending_payment' then raise exception 'Invalid retry'; end if;
 return to_jsonb(b);
 end if;
 if t.id is null or t.status<>'approved' or t.user_id=p_student or not exists(select 1 from tutoring_private.connect_accounts where tutor_id=p_tutor and status='active') then raise exception 'Tutor unavailable'; end if;
 if p_start<now()+interval '1 hour' or p_start>now()+interval '14 days' then raise exception 'Invalid time'; end if;
 local_start:=p_start at time zone 'Europe/Bucharest';
 if extract(minute from local_start)<>0 or extract(second from local_start)<>0 or not exists(select 1 from public.tutor_availability a where a.tutor_id=p_tutor and a.weekday=extract(dow from local_start) and a.start_minute<=extract(hour from local_start)*60 and a.end_minute>=extract(hour from local_start)*60+60) then raise exception 'Outside availability'; end if;
 select price_minor into amount from public.tutor_subjects where tutor_id=p_tutor and subject=p_subject;
 if amount is null then raise exception 'Subject unavailable'; end if;
 select (amount::bigint*platform_fee_bps/10000)::integer into fee from tutoring_private.settings where singleton;
 insert into public.tutoring_bookings(id,student_id,tutor_id,subject,starts_at,ends_at,amount_minor,platform_fee_minor,teacher_share_minor)
 values(p_id,p_student,p_tutor,p_subject,p_start,p_start+interval '1 hour',amount,fee,amount-fee) returning * into b;
 insert into tutoring_private.payments(booking_id) values(p_id);
 return to_jsonb(b);
end; $$;

create function public.tutoring_lessons(p_teacher boolean default false,p_offset integer default 0) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (
 select b.id,b.tutor_id,t.display_name tutor_name,p.display_name student_name,b.subject,b.starts_at,b.ends_at,b.amount_minor,b.platform_fee_minor,b.teacher_share_minor,b.status,b.payment_status,
 case when b.payment_status in ('paid','partially_refunded') and c.status='active' then c.external_classroom_url end classroom_url,c.status classroom_status,
 exists(select 1 from public.tutor_reviews r where r.booking_id=b.id) reviewed
 from public.tutoring_bookings b join public.tutor_profiles t on t.id=b.tutor_id join public.profiles p on p.id=b.student_id
 left join public.external_classrooms c on c.id=b.classroom_id
 where (not p_teacher and b.student_id=auth.uid()) or (p_teacher and t.user_id=auth.uid())
 order by b.starts_at desc,b.id limit 21 offset least(greatest(p_offset,0),10000)
 ) q;
$$;
create function public.tutoring_reviews(p_tutor uuid,p_offset integer default 0) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (
 select r.id,r.rating,r.comment,r.created_at from public.tutor_reviews r join public.tutor_profiles t on t.id=r.tutor_id
 where auth.uid() is not null and t.status='approved' and r.tutor_id=p_tutor order by r.created_at desc,r.id limit 20 offset least(greatest(p_offset,0),10000)
 ) q;
$$;
create function public.tutoring_review(p_booking uuid,p_rating integer,p_comment text) returns void language plpgsql security definer set search_path='' as $$
declare b public.tutoring_bookings;
begin
 select * into b from public.tutoring_bookings where id=p_booking and student_id=auth.uid() and status='completed' and payment_status in ('paid','partially_refunded') and ends_at<now();
 if not found then raise exception 'Completed lesson required'; end if;
 insert into public.tutor_reviews(booking_id,tutor_id,student_id,rating,comment) values(b.id,b.tutor_id,auth.uid(),p_rating,trim(p_comment));
end; $$;

-- Backend-only provider accessors. No account IDs returned by client RPCs.
create function public.tutoring_connect(p_tutor uuid,p_account text default null,p_status text default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_account is not null then
 insert into tutoring_private.connect_accounts(tutor_id,stripe_account_id,status) values(p_tutor,p_account,coalesce(p_status,'onboarding'))
 on conflict(tutor_id) do update set status=case when p_status is null then tutoring_private.connect_accounts.status else p_status end;
 end if;
 return (select to_jsonb(c) from tutoring_private.connect_accounts c where tutor_id=p_tutor);
end; $$;
create function public.tutoring_payment_link(p_booking uuid,p_checkout text default null,p_intent text default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_checkout is not null then
 update tutoring_private.payments set checkout_id=p_checkout,payment_intent_id=coalesce(p_intent,payment_intent_id) where booking_id=p_booking and (checkout_id is null or checkout_id=p_checkout);
 end if;
 return (select to_jsonb(p) from tutoring_private.payments p where booking_id=p_booking);
end; $$;
create function public.tutoring_settle(p_event text,p_booking uuid,p_checkout text,p_paid boolean,p_amount integer,p_currency text,p_intent text default null) returns void language plpgsql security definer set search_path='' as $$
declare b public.tutoring_bookings; cid uuid;
begin
 select * into b from public.tutoring_bookings where id=p_booking for update;
 if b.id is null or b.amount_minor<>p_amount or p_currency<>'ron' or not exists(select 1 from tutoring_private.payments where booking_id=p_booking and checkout_id=p_checkout) then raise exception 'Payment mismatch'; end if;
 insert into tutoring_private.webhook_events(id) values(p_event) on conflict do nothing;
 if not found then return; end if;
 if p_paid then
 if b.payment_status in ('refunded','partially_refunded') then return; end if;
 insert into public.external_classrooms(tutor_id,student_id) values(b.tutor_id,b.student_id) on conflict(tutor_id,student_id) do update set updated_at=now() returning id into cid;
 update public.tutoring_bookings set payment_status='paid',status=case when status='pending_payment' then 'scheduled' else status end,classroom_id=cid where id=b.id;
 update tutoring_private.payments set payment_intent_id=p_intent where booking_id=b.id;
 elsif b.payment_status not in ('paid','refunded','partially_refunded') then
 update public.tutoring_bookings set payment_status='cancelled',status='cancelled' where id=b.id;
 end if;
end; $$;

-- Explicit function grants: PUBLIC execute defaults must never expose service operations.
revoke all on all functions in schema tutoring_private from public,anon,authenticated;
revoke all on function public.tutoring_discover(text,text,integer,integer,uuid),public.tutoring_my_application(),public.tutoring_save_application(jsonb,boolean),public.tutoring_slots(uuid),public.tutoring_lessons(boolean,integer),public.tutoring_reviews(uuid,integer),public.tutoring_review(uuid,integer,text) from public,anon;
grant execute on function public.tutoring_discover(text,text,integer,integer,uuid),public.tutoring_my_application(),public.tutoring_save_application(jsonb,boolean),public.tutoring_slots(uuid),public.tutoring_lessons(boolean,integer),public.tutoring_reviews(uuid,integer),public.tutoring_review(uuid,integer,text) to authenticated;
revoke all on function public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid),public.tutoring_connect(uuid,text,text),public.tutoring_payment_link(uuid,text,text),public.tutoring_settle(text,uuid,text,boolean,integer,text,text) from public,anon,authenticated;
grant execute on function public.tutoring_reserve(uuid,uuid,text,timestamptz,uuid),public.tutoring_connect(uuid,text,text),public.tutoring_payment_link(uuid,text,text),public.tutoring_settle(text,uuid,text,boolean,integer,text,text) to service_role;
grant all on public.tutor_profiles,public.tutor_subjects,public.tutor_availability,public.tutoring_bookings,public.tutor_reviews,public.external_classrooms,public.tutoring_subjects to service_role;

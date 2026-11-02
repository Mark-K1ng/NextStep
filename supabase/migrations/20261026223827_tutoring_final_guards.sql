alter table tutoring_private.payments add column refunded_minor integer not null default 0 check(refunded_minor>=0);
create or replace function public.tutoring_refund(p_event text,p_intent text,p_amount_refunded integer) returns void language plpgsql security definer set search_path='' as $$
declare b public.tutoring_bookings; refunded integer;
begin
 select booking.* into b from public.tutoring_bookings booking join tutoring_private.payments p on p.booking_id=booking.id where p.payment_intent_id=p_intent for update of booking;
 if b.id is null then return; end if;
 if p_amount_refunded<0 or p_amount_refunded>b.amount_minor then raise exception 'Invalid refund'; end if;
 insert into tutoring_private.webhook_events(id) values(p_event) on conflict do nothing;
 if not found then return; end if;
 update tutoring_private.payments set refunded_minor=greatest(refunded_minor,p_amount_refunded) where booking_id=b.id returning refunded_minor into refunded;
 update public.tutoring_bookings set payment_status=case when refunded=amount_minor then 'refunded' when refunded>0 then 'partially_refunded' else payment_status end,
 status=case when refunded=amount_minor then 'refunded' else status end where id=b.id;
end; $$;

create or replace function public.tutoring_payment_link(p_booking uuid,p_checkout text default null,p_intent text default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if p_checkout is not null then
 update tutoring_private.payments set checkout_id=p_checkout,payment_intent_id=coalesce(p_intent,payment_intent_id) where booking_id=p_booking and (checkout_id is null or checkout_id=p_checkout);
 update public.tutoring_bookings set payment_status='pending' where id=p_booking and status='pending_payment' and payment_status='unpaid';
 end if;
 return (select to_jsonb(p) from tutoring_private.payments p where booking_id=p_booking);
end; $$;

create or replace function tutoring_private.tutoring_lessons(p_teacher boolean default false,p_offset integer default 0) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(q)),'[]') from (
 select b.id,b.tutor_id,t.display_name tutor_name,p.display_name student_name,b.subject,b.starts_at,b.ends_at,b.amount_minor,b.platform_fee_minor,b.teacher_share_minor,b.status,b.payment_status,
 case when b.payment_status in ('paid','partially_refunded') and c.status='active' then c.external_classroom_url end classroom_url,c.status classroom_status,
 exists(select 1 from public.tutor_reviews r where r.booking_id=b.id) reviewed
 from public.tutoring_bookings b join public.tutor_profiles t on t.id=b.tutor_id join public.profiles p on p.id=b.student_id
 left join public.external_classrooms c on c.id=b.classroom_id
 where (not p_teacher and b.student_id=auth.uid()) or (p_teacher and t.user_id=auth.uid())
 order by case when b.ends_at>now() and b.status in ('scheduled','pending_payment') then 0 else 1 end,
 case when b.ends_at>now() and b.status in ('scheduled','pending_payment') then b.starts_at end asc,
 b.starts_at desc,b.id limit 21 offset least(greatest(p_offset,0),10000)
 ) q;
$$;

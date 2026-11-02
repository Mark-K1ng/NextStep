-- Payment/refund events and lifecycle maintenance remain service-only.
create function public.tutoring_refund(p_event text,p_intent text,p_amount_refunded integer) returns void language plpgsql security definer set search_path='' as $$
declare b public.tutoring_bookings;
begin
 select booking.* into b from public.tutoring_bookings booking join tutoring_private.payments p on p.booking_id=booking.id where p.payment_intent_id=p_intent for update of booking;
 if b.id is null then return; end if;
 if p_amount_refunded<0 or p_amount_refunded>b.amount_minor then raise exception 'Invalid refund'; end if;
 insert into tutoring_private.webhook_events(id) values(p_event) on conflict do nothing;
 if not found then return; end if;
 update public.tutoring_bookings set payment_status=case when p_amount_refunded=amount_minor then 'refunded' when p_amount_refunded>0 then 'partially_refunded' else payment_status end,
 status=case when p_amount_refunded=amount_minor then 'refunded' else status end where id=b.id;
end; $$;
revoke all on function public.tutoring_refund(text,text,integer) from public,anon,authenticated;
grant execute on function public.tutoring_refund(text,text,integer) to service_role;

-- A teacher can confirm delivery only after the paid lesson ends. This cannot change payment state.
create function public.tutoring_complete(p_booking uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 update public.tutoring_bookings b set status='completed' where b.id=p_booking and b.status='scheduled' and b.payment_status in ('paid','partially_refunded') and b.ends_at<now()
 and exists(select 1 from public.tutor_profiles t where t.id=b.tutor_id and t.user_id=auth.uid() and t.status='approved');
 if not found then raise exception 'Lesson cannot be completed'; end if;
end; $$;
revoke all on function public.tutoring_complete(uuid) from public,anon;
grant execute on function public.tutoring_complete(uuid) to authenticated;

-- Account deletion keeps working for the lightweight marketplace data. Stripe records remain at Stripe.
alter table public.tutoring_bookings drop constraint tutoring_bookings_student_id_fkey, drop constraint tutoring_bookings_tutor_id_fkey;
alter table public.tutoring_bookings add foreign key(student_id) references public.profiles(id) on delete cascade, add foreign key(tutor_id) references public.tutor_profiles(id) on delete cascade;
alter table public.external_classrooms drop constraint external_classrooms_student_id_fkey, drop constraint external_classrooms_tutor_id_fkey;
alter table public.external_classrooms add foreign key(student_id) references public.profiles(id) on delete cascade, add foreign key(tutor_id) references public.tutor_profiles(id) on delete cascade;
alter table public.tutoring_bookings drop constraint tutoring_bookings_classroom_id_fkey;
alter table public.tutoring_bookings add foreign key(classroom_id) references public.external_classrooms(id) on delete set null;
alter table public.tutor_reviews drop constraint tutor_reviews_booking_id_fkey, drop constraint tutor_reviews_student_id_fkey, drop constraint tutor_reviews_tutor_id_fkey;
alter table public.tutor_reviews add foreign key(booking_id) references public.tutoring_bookings(id) on delete cascade, add foreign key(student_id) references public.profiles(id) on delete cascade, add foreign key(tutor_id) references public.tutor_profiles(id) on delete cascade;
alter table tutoring_private.payments drop constraint payments_booking_id_fkey;
alter table tutoring_private.payments add foreign key(booking_id) references public.tutoring_bookings(id) on delete cascade;

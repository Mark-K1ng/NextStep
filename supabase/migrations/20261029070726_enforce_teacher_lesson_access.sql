-- Keep private lesson/classroom access tied to live authoritative approval.
-- Enforce inside the implementation, including calls through existing wrappers.
create or replace function tutoring_private.tutoring_lessons(p_teacher boolean default false,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare access jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  access:=account_private.account_access(auth.uid());
  if p_teacher is null or (p_teacher and not (access->>'can_teach')::boolean)
    or (not p_teacher and access->>'account_kind'<>'student') then
    raise exception 'Account cannot access this lesson perspective' using errcode='42501';
  end if;
  return (select coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) from (
    select b.id,b.tutor_id,t.display_name tutor_name,p.display_name student_name,b.subject,b.starts_at,b.ends_at,
      b.amount_minor,b.platform_fee_minor,b.teacher_share_minor,b.status,b.payment_status,
      case when b.payment_status in ('paid','partially_refunded') and c.status='active' then c.external_classroom_url end classroom_url,
      c.status classroom_status,exists(select 1 from public.tutor_reviews r where r.booking_id=b.id) reviewed
    from public.tutoring_bookings b join public.tutor_profiles t on t.id=b.tutor_id
      join public.profiles p on p.id=b.student_id left join public.external_classrooms c on c.id=b.classroom_id
    where (not p_teacher and b.student_id=auth.uid()) or (p_teacher and t.user_id=auth.uid())
    order by case when b.ends_at>now() and b.status in ('scheduled','pending_payment') then 0 else 1 end,
      case when b.ends_at>now() and b.status in ('scheduled','pending_payment') then b.starts_at end asc,
      b.starts_at desc,b.id limit 21 offset least(greatest(p_offset,0),10000)
  ) q);
end $$;

alter table public.coupons
add column if not exists course_id uuid references public.courses(id) on delete cascade;

create index if not exists coupons_course_id_idx
on public.coupons(course_id);

create table if not exists public.coupon_student_targets (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (coupon_id, student_id)
);

create index if not exists coupon_student_targets_student_id_idx
on public.coupon_student_targets(student_id);

alter table public.coupon_student_targets enable row level security;

drop policy if exists "Coupon target students readable by coupon teachers and admins"
on public.coupon_student_targets;
create policy "Coupon target students readable by coupon teachers and admins"
on public.coupon_student_targets for select
using (
  public.is_admin()
  or student_id = public.current_student_id()
  or exists (
    select 1
    from public.coupons c
    where c.id = coupon_student_targets.coupon_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Teacher owners and admins can manage coupon target students"
on public.coupon_student_targets;
create policy "Teacher owners and admins can manage coupon target students"
on public.coupon_student_targets for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.coupons c
    where c.id = coupon_student_targets.coupon_id
      and c.teacher_id = public.current_teacher_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.coupons c
    where c.id = coupon_student_targets.coupon_id
      and c.teacher_id = public.current_teacher_id()
  )
);

create or replace function public.increment_coupon_used_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = new.coupon_id;

  return new;
end;
$$;

drop trigger if exists increment_coupon_used_count_after_redemption
on public.coupon_redemptions;
create trigger increment_coupon_used_count_after_redemption
after insert on public.coupon_redemptions
for each row execute function public.increment_coupon_used_count();

drop policy if exists "Active coupons are readable and teachers admins read own inactive coupons"
on public.coupons;
create policy "Active coupons are readable and teachers admins read own inactive coupons"
on public.coupons for select
using (
  (
    is_active = true
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or used_count < usage_limit)
    and (
      target_student_id is null
      or target_student_id = public.current_student_id()
      or exists (
        select 1
        from public.coupon_student_targets cst
        where cst.coupon_id = coupons.id
          and cst.student_id = public.current_student_id()
      )
    )
  )
  or teacher_id = public.current_teacher_id()
  or public.is_admin()
);

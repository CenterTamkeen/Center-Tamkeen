alter table public.coupons
add column if not exists target_student_id uuid references public.students(id) on delete set null;

create index if not exists coupons_target_student_id_idx
on public.coupons(target_student_id);

create table if not exists public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  redeemed_at timestamptz not null default now(),
  unique (coupon_id, order_id)
);

create index if not exists coupon_redemptions_coupon_id_idx
on public.coupon_redemptions(coupon_id);

create index if not exists coupon_redemptions_student_id_idx
on public.coupon_redemptions(student_id);

alter table public.coupon_redemptions enable row level security;

drop policy if exists "Coupon redemptions are readable by coupon teachers students and admins"
on public.coupon_redemptions;
create policy "Coupon redemptions are readable by coupon teachers students and admins"
on public.coupon_redemptions for select
using (
  student_id = public.current_student_id()
  or public.is_admin()
  or exists (
    select 1
    from public.coupons c
    where c.id = coupon_redemptions.coupon_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Students and admins can create coupon redemptions"
on public.coupon_redemptions;
create policy "Students and admins can create coupon redemptions"
on public.coupon_redemptions for insert
with check (
  public.is_admin()
  or (
    student_id = public.current_student_id()
    and exists (
      select 1
      from public.coupons c
      where c.id = coupon_redemptions.coupon_id
        and c.is_active = true
        and (c.expires_at is null or c.expires_at > now())
        and (c.usage_limit is null or c.used_count < c.usage_limit)
        and (c.target_student_id is null or c.target_student_id = student_id)
    )
  )
);

drop policy if exists "Only admins can update coupon redemptions"
on public.coupon_redemptions;
create policy "Only admins can update coupon redemptions"
on public.coupon_redemptions for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Only admins can delete coupon redemptions"
on public.coupon_redemptions;
create policy "Only admins can delete coupon redemptions"
on public.coupon_redemptions for delete
using (public.is_admin());

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
    )
  )
  or teacher_id = public.current_teacher_id()
  or public.is_admin()
);

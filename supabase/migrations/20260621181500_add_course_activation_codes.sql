create table if not exists public.activation_codes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  code text not null unique check (code ~ '^[0-9]{6}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by_student_id uuid references public.students(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activation_codes_used_student_required check (
    (used_at is null and used_by_student_id is null)
    or (used_at is not null and used_by_student_id is not null)
  )
);

create index if not exists activation_codes_course_code_idx
on public.activation_codes(course_id, code);

create index if not exists activation_codes_course_created_at_idx
on public.activation_codes(course_id, created_at desc);

create index if not exists activation_codes_available_idx
on public.activation_codes(course_id, expires_at)
where used_at is null;

drop trigger if exists set_activation_codes_updated_at on public.activation_codes;
create trigger set_activation_codes_updated_at
before update on public.activation_codes
for each row execute function public.update_updated_at_column();

alter table public.activation_codes enable row level security;

drop policy if exists "Admins can read activation codes" on public.activation_codes;
create policy "Admins can read activation codes"
on public.activation_codes for select
using (public.is_admin());

drop policy if exists "Admins can create activation codes" on public.activation_codes;
create policy "Admins can create activation codes"
on public.activation_codes for insert
with check (public.is_admin());

drop policy if exists "Admins can update activation codes" on public.activation_codes;
create policy "Admins can update activation codes"
on public.activation_codes for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete unused activation codes" on public.activation_codes;
create policy "Admins can delete unused activation codes"
on public.activation_codes for delete
using (public.is_admin() and used_at is null);

create or replace function public.redeem_course_activation_code(
  course_uuid uuid,
  submitted_code text,
  student_uuid uuid
)
returns table (
  status text,
  message text,
  enrollment_id uuid,
  order_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text;
  code_row public.activation_codes%rowtype;
  course_row public.courses%rowtype;
  existing_enrollment_id uuid;
  created_order_id uuid;
  created_enrollment_id uuid;
begin
  if not (
    public.is_admin()
    or public.current_student_id() = student_uuid
    or auth.role() = 'service_role'
  ) then
    return query select
      'error'::text,
      'غير مصرح باستخدام هذا الكود.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  clean_code := regexp_replace(coalesce(submitted_code, ''), '[^0-9]', '', 'g');

  if clean_code !~ '^[0-9]{6}$' then
    return query select
      'error'::text,
      'كود التفعيل لازم يكون ٦ أرقام.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  select *
    into course_row
  from public.courses
  where id = course_uuid
    and is_published = true;

  if not found then
    return query select
      'error'::text,
      'الكورس غير موجود أو غير متاح حاليًا.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  select id
    into existing_enrollment_id
  from public.enrollments
  where student_id = student_uuid
    and course_id = course_uuid;

  if existing_enrollment_id is not null then
    return query select
      'error'::text,
      'أنت مشترك بالفعل في هذا الكورس.'::text,
      existing_enrollment_id,
      null::uuid;
    return;
  end if;

  select *
    into code_row
  from public.activation_codes
  where course_id = course_uuid
    and code = clean_code
  for update;

  if not found then
    return query select
      'error'::text,
      'الكود غير صحيح لهذا الكورس.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  if code_row.used_at is not null then
    return query select
      'error'::text,
      'الكود تم استخدامه قبل كده.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  if code_row.expires_at <= now() then
    return query select
      'error'::text,
      'صلاحية الكود انتهت.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  insert into public.orders (student_id, total_amount, status)
  values (student_uuid, course_row.price, 'pending')
  returning id into created_order_id;

  insert into public.order_items (order_id, course_id, price_at_purchase)
  values (created_order_id, course_uuid, course_row.price);

  update public.orders
  set status = 'completed',
      rejection_reason = null
  where id = created_order_id;

  update public.activation_codes
  set used_at = now(),
      used_by_student_id = student_uuid,
      order_id = created_order_id
  where id = code_row.id;

  select id
    into created_enrollment_id
  from public.enrollments
  where student_id = student_uuid
    and course_id = course_uuid;

  return query select
    'success'::text,
    'تم تفعيل الكورس بنجاح.'::text,
    created_enrollment_id,
    created_order_id;
end;
$$;

create or replace function public.notify_order_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_profile uuid;
  student_name text;
  item record;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    select s.profile_id, p.full_name
      into student_profile, student_name
    from public.students s
    left join public.profiles p on p.id = s.profile_id
    where s.id = new.student_id;

    for item in
      select
        c.id as course_id,
        c.title as course_title,
        t.profile_id as teacher_profile_id
      from public.order_items oi
      join public.courses c on c.id = oi.course_id
      join public.teachers t on t.id = c.teacher_id
      where oi.order_id = new.id
    loop
      if student_profile is not null then
        insert into public.notifications (
          recipient_profile_id,
          title,
          body,
          href,
          kind
        )
        values (
          student_profile,
          'تم تفعيل اشتراكك',
          'تم تفعيل كورس ' || item.course_title || ' داخل لوحة الطالب.',
          '/dashboard/student',
          'enrollment_activated'
        );
      end if;

      if item.teacher_profile_id is not null then
        insert into public.notifications (
          recipient_profile_id,
          title,
          body,
          href,
          kind
        )
        values (
          item.teacher_profile_id,
          'طالب جديد في كورسك',
          coalesce(student_name, 'طالب جديد') || ' اشترك في كورس ' || item.course_title || '.',
          '/dashboard/teacher/students',
          'new_enrollment'
        );
      end if;
    end loop;
  end if;

  return new;
end;
$$;

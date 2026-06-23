create table if not exists public.activation_code_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  submitted_code text not null check (submitted_code ~ '^[0-9]{0,6}$'),
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists activation_code_attempts_student_time_idx
on public.activation_code_attempts(student_id, attempted_at desc);

create index if not exists activation_code_attempts_course_time_idx
on public.activation_code_attempts(course_id, attempted_at desc);

alter table public.activation_code_attempts enable row level security;

drop policy if exists "Admins can read activation code attempts" on public.activation_code_attempts;
create policy "Admins can read activation code attempts"
on public.activation_code_attempts for select
using (public.is_admin());

create or replace function public.can_access_course(
  course_uuid uuid,
  student_uuid uuid default public.current_student_id()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    auth.role() = 'service_role'
    or public.is_admin()
    or student_uuid = public.current_student_id()
  )
  and exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    join public.teachers t on t.id = c.teacher_id
    where e.course_id = course_uuid
      and e.student_id = student_uuid
      and c.is_published = true
      and t.is_active = true
      and not exists (
        select 1
        from public.student_blocks sb
        where sb.student_id = student_uuid
          and (sb.teacher_id is null or sb.teacher_id = c.teacher_id)
      )
  );
$$;

create or replace function public.is_enrolled_in_course(course_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_access_course(course_uuid, public.current_student_id());
$$;

drop policy if exists "Lessons are readable by preview enrolled owner or admin" on public.lessons;
create policy "Lessons are readable by preview enrolled owner or admin"
on public.lessons for select
using (
  exists (
    select 1
    from public.courses c
    join public.teachers t on t.id = c.teacher_id
    where c.id = lessons.course_id
      and c.is_published = true
      and t.is_active = true
      and lessons.is_free_preview = true
  )
  or public.can_access_course(course_id)
  or public.owns_course(course_id)
  or public.is_admin()
);

drop policy if exists "Students can upsert own enrolled lesson progress" on public.lesson_progress;
create policy "Students can upsert own enrolled lesson progress"
on public.lesson_progress for insert
with check (
  public.can_access_course(lesson_progress.course_id, lesson_progress.student_id)
  and lesson_progress.student_id = public.current_student_id()
  and exists (
    select 1
    from public.lessons l
    where l.id = lesson_progress.lesson_id
      and l.course_id = lesson_progress.course_id
  )
);

drop policy if exists "Students can update own lesson progress and admins update all" on public.lesson_progress;
create policy "Students can update own lesson progress and admins update all"
on public.lesson_progress for update
using (
  public.is_admin()
  or lesson_progress.student_id = public.current_student_id()
)
with check (
  public.is_admin()
  or (
    lesson_progress.student_id = public.current_student_id()
    and public.can_access_course(lesson_progress.course_id, lesson_progress.student_id)
    and exists (
      select 1
      from public.lessons l
      where l.id = lesson_progress.lesson_id
        and l.course_id = lesson_progress.course_id
    )
  )
);

drop policy if exists "Enrolled students read lesson attachments" on public.lesson_attachments;
create policy "Enrolled students read lesson attachments"
on public.lesson_attachments for select
using (
  exists (
    select 1
    from public.lessons l
    where l.id = lesson_attachments.lesson_id
      and public.can_access_course(l.course_id)
  )
);

drop policy if exists "Enrolled students read completed lesson quiz questions" on public.lesson_quiz_questions;
create policy "Enrolled students read completed lesson quiz questions"
on public.lesson_quiz_questions for select
using (
  exists (
    select 1
    from public.lessons l
    join public.lesson_progress lp on lp.lesson_id = l.id
    where l.id = lesson_quiz_questions.lesson_id
      and lp.student_id = public.current_student_id()
      and lp.status = 'completed'
      and public.can_access_course(l.course_id, lp.student_id)
  )
);

create or replace function public.record_lesson_playback(
  student_uuid uuid,
  course_uuid uuid,
  lesson_uuid uuid,
  max_playbacks integer default 3
)
returns table (
  allowed boolean,
  playback_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
  effective_limit integer := greatest(1, coalesce(max_playbacks, 3));
begin
  if not (auth.role() = 'service_role' or public.is_admin()) then
    raise exception 'record_lesson_playback is service-only';
  end if;

  if not exists (
    select 1
    from public.lessons l
    where l.id = lesson_uuid
      and l.course_id = course_uuid
  ) then
    return query select false, 0;
    return;
  end if;

  if not public.can_access_course(course_uuid, student_uuid) then
    return query select false, 0;
    return;
  end if;

  insert into public.lesson_progress (
    student_id,
    course_id,
    lesson_id,
    status,
    watched_seconds,
    playback_count,
    last_playback_started_at,
    last_watched_at
  )
  values (
    student_uuid,
    course_uuid,
    lesson_uuid,
    'in_progress',
    0,
    1,
    now(),
    now()
  )
  on conflict (student_id, lesson_id)
  do update set
    playback_count = public.lesson_progress.playback_count + 1,
    last_playback_started_at = now(),
    last_watched_at = now()
  where public.lesson_progress.playback_count < effective_limit
  returning public.lesson_progress.playback_count into next_count;

  if next_count is null then
    select lp.playback_count
    into next_count
    from public.lesson_progress lp
    where lp.student_id = student_uuid
      and lp.lesson_id = lesson_uuid;

    return query select false, coalesce(next_count, 0);
    return;
  end if;

  return query select true, next_count;
end;
$$;

revoke execute on function public.record_lesson_playback(uuid, uuid, uuid, integer) from public, anon, authenticated;

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
  failed_attempts integer;
  generic_error constant text := 'الكود غير صالح أو لا يمكن استخدامه الآن.';
begin
  if not (
    public.is_admin()
    or public.current_student_id() = student_uuid
    or auth.role() = 'service_role'
  ) then
    return query select 'error'::text, generic_error, null::uuid, null::uuid;
    return;
  end if;

  clean_code := regexp_replace(coalesce(submitted_code, ''), '[^0-9]', '', 'g');

  select count(*)::integer
    into failed_attempts
  from public.activation_code_attempts
  where student_id = student_uuid
    and success = false
    and attempted_at > now() - interval '10 minutes';

  if failed_attempts >= 5 then
    return query select
      'rate_limited'::text,
      'محاولات كثيرة. جرّب مرة أخرى بعد دقائق.'::text,
      null::uuid,
      null::uuid;
    return;
  end if;

  if clean_code !~ '^[0-9]{6}$' then
    insert into public.activation_code_attempts (student_id, course_id, submitted_code, success)
    values (student_uuid, course_uuid, left(clean_code, 6), false);

    return query select 'error'::text, generic_error, null::uuid, null::uuid;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(student_uuid::text), hashtext(course_uuid::text));

  select *
    into course_row
  from public.courses
  where id = course_uuid
    and is_published = true;

  if not found then
    insert into public.activation_code_attempts (student_id, course_id, submitted_code, success)
    values (student_uuid, course_uuid, clean_code, false);

    return query select 'error'::text, generic_error, null::uuid, null::uuid;
    return;
  end if;

  select id
    into existing_enrollment_id
  from public.enrollments
  where student_id = student_uuid
    and course_id = course_uuid;

  if existing_enrollment_id is not null then
    insert into public.activation_code_attempts (student_id, course_id, submitted_code, success)
    values (student_uuid, course_uuid, clean_code, false);

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

  if not found or code_row.used_at is not null or code_row.expires_at <= now() then
    insert into public.activation_code_attempts (student_id, course_id, submitted_code, success)
    values (student_uuid, course_uuid, clean_code, false);

    return query select 'error'::text, generic_error, null::uuid, null::uuid;
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

  insert into public.activation_code_attempts (student_id, course_id, submitted_code, success)
  values (student_uuid, course_uuid, clean_code, true);

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

create or replace function public.redeem_any_course_activation_code(
  submitted_code text,
  student_uuid uuid
)
returns table (
  status text,
  message text,
  course_id uuid,
  enrollment_id uuid,
  order_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_code text;
  matched_course_id uuid;
  redemption record;
  failed_attempts integer;
  generic_error constant text := 'الكود غير صالح أو لا يمكن استخدامه الآن.';
begin
  if not (
    public.is_admin()
    or public.current_student_id() = student_uuid
    or auth.role() = 'service_role'
  ) then
    return query select 'error'::text, generic_error, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  clean_code := regexp_replace(coalesce(submitted_code, ''), '[^0-9]', '', 'g');

  select count(*)::integer
    into failed_attempts
  from public.activation_code_attempts
  where student_id = student_uuid
    and success = false
    and attempted_at > now() - interval '10 minutes';

  if failed_attempts >= 5 then
    return query select
      'rate_limited'::text,
      'محاولات كثيرة. جرّب مرة أخرى بعد دقائق.'::text,
      null::uuid,
      null::uuid,
      null::uuid;
    return;
  end if;

  if clean_code !~ '^[0-9]{6}$' then
    insert into public.activation_code_attempts (student_id, submitted_code, success)
    values (student_uuid, left(clean_code, 6), false);

    return query select 'error'::text, generic_error, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  select ac.course_id
    into matched_course_id
  from public.activation_codes ac
  where ac.code = clean_code
  limit 1;

  if matched_course_id is null then
    insert into public.activation_code_attempts (student_id, submitted_code, success)
    values (student_uuid, clean_code, false);

    return query select 'error'::text, generic_error, null::uuid, null::uuid, null::uuid;
    return;
  end if;

  select *
    into redemption
  from public.redeem_course_activation_code(matched_course_id, clean_code, student_uuid)
  limit 1;

  return query select
    redemption.status,
    redemption.message,
    matched_course_id,
    redemption.enrollment_id,
    redemption.order_id;
end;
$$;

revoke execute on function public.redeem_course_activation_code(uuid, text, uuid) from public, anon;
revoke execute on function public.redeem_any_course_activation_code(text, uuid) from public, anon;

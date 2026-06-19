alter table public.courses
  add column if not exists target_grade public.student_grade,
  add column if not exists target_section public.student_section;

create index if not exists courses_target_grade_section_idx
on public.courses(target_grade, target_section);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(trim(title)) >= 2),
  body text not null check (char_length(trim(body)) >= 2),
  href text,
  kind text not null default 'info',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_created_at_idx
on public.notifications(recipient_profile_id, created_at desc);

create index if not exists notifications_recipient_unread_idx
on public.notifications(recipient_profile_id)
where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications and admins read all" on public.notifications;
create policy "Users can read own notifications and admins read all"
on public.notifications for select
using (recipient_profile_id = auth.uid() or public.is_admin());

drop policy if exists "Users can mark own notifications read and admins update all" on public.notifications;
create policy "Users can mark own notifications read and admins update all"
on public.notifications for update
using (recipient_profile_id = auth.uid() or public.is_admin())
with check (recipient_profile_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can create notifications through policies" on public.notifications;
create policy "Admins can create notifications through policies"
on public.notifications for insert
with check (public.is_admin());

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
          'تم قبول اشتراكك',
          'تم تفعيل كورس ' || item.course_title || ' داخل لوحة الطالب.',
          '/dashboard/student',
          'enrollment_approved'
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

drop trigger if exists notify_order_completed_after_status_update on public.orders;
create trigger notify_order_completed_after_status_update
after update of status on public.orders
for each row execute function public.notify_order_completed();

create or replace function public.notify_new_lesson()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  course_title text;
  student_profile uuid;
begin
  select title into course_title
  from public.courses
  where id = new.course_id;

  for student_profile in
    select s.profile_id
    from public.enrollments e
    join public.students s on s.id = e.student_id
    where e.course_id = new.course_id
  loop
    insert into public.notifications (
      recipient_profile_id,
      title,
      body,
      href,
      kind
    )
    values (
      student_profile,
      'حصة جديدة اتضافت',
      'اتضافت حصة "' || new.title || '" في كورس ' || coalesce(course_title, 'تمكين') || '.',
      '/courses/' || new.course_id,
      'new_lesson'
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists notify_new_lesson_after_insert on public.lessons;
create trigger notify_new_lesson_after_insert
after insert on public.lessons
for each row execute function public.notify_new_lesson();

create or replace function public.notify_course_publish_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  teacher_profile uuid;
begin
  if new.is_published is distinct from old.is_published then
    select profile_id into teacher_profile
    from public.teachers
    where id = new.teacher_id;

    if teacher_profile is not null then
      insert into public.notifications (
        recipient_profile_id,
        title,
        body,
        href,
        kind
      )
      values (
        teacher_profile,
        case when new.is_published then 'الكورس اتنشر' else 'الكورس اتخفى' end,
        case
          when new.is_published then 'كورس ' || new.title || ' أصبح ظاهرًا للطلاب.'
          else 'كورس ' || new.title || ' لم يعد ظاهرًا للطلاب.'
        end,
        '/dashboard/teacher/courses',
        'course_publish'
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_course_publish_change_after_update on public.courses;
create trigger notify_course_publish_change_after_update
after update of is_published on public.courses
for each row execute function public.notify_course_publish_change();

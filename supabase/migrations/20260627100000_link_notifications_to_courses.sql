alter table public.notifications
add column if not exists course_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_course_id_fkey'
  ) then
    alter table public.notifications
      add constraint notifications_course_id_fkey
      foreign key (course_id)
      references public.courses(id)
      on delete cascade;
  end if;
end $$;

create index if not exists notifications_course_id_idx
on public.notifications(course_id);

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
          course_id,
          title,
          body,
          href,
          kind
        )
        values (
          student_profile,
          item.course_id,
          'تم تفعيل اشتراكك',
          'تم تفعيل كورس ' || item.course_title || ' داخل لوحة الطالب.',
          '/dashboard/student',
          'enrollment_activated'
        );
      end if;

      if item.teacher_profile_id is not null then
        insert into public.notifications (
          recipient_profile_id,
          course_id,
          title,
          body,
          href,
          kind
        )
        values (
          item.teacher_profile_id,
          item.course_id,
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
      course_id,
      title,
      body,
      href,
      kind
    )
    values (
      student_profile,
      new.course_id,
      'حصة جديدة اتضافت',
      'اتضافت حصة "' || new.title || '" في كورس ' || coalesce(course_title, 'تمكين') || '.',
      '/courses/' || new.course_id,
      'new_lesson'
    );
  end loop;

  return new;
end;
$$;

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
        course_id,
        title,
        body,
        href,
        kind
      )
      values (
        teacher_profile,
        new.id,
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

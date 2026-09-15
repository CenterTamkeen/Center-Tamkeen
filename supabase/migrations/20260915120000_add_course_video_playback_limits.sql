-- Each course owns its playback policy. Existing courses retain the legacy
-- three-playback behavior; NULL explicitly means unlimited playback.
alter table public.courses
add column if not exists video_playback_limit integer default 3;

alter table public.courses
drop constraint if exists courses_video_playback_limit_check;

alter table public.courses
add constraint courses_video_playback_limit_check
check (video_playback_limit is null or video_playback_limit in (3, 5, 7));

-- The limit is read from the course inside the database function, rather than
-- accepted from the client or application server.
drop function if exists public.record_lesson_playback(uuid, uuid, uuid, integer);
drop function if exists public.record_lesson_playback(uuid, uuid, uuid);

create function public.record_lesson_playback(
  student_uuid uuid,
  course_uuid uuid,
  lesson_uuid uuid
)
returns table (
  allowed boolean,
  playback_count integer,
  playback_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
  course_playback_limit integer;
begin
  if not (auth.role() = 'service_role' or public.is_admin()) then
    raise exception 'record_lesson_playback is service-only';
  end if;

  select c.video_playback_limit
  into course_playback_limit
  from public.courses c
  join public.lessons l on l.course_id = c.id
  where c.id = course_uuid
    and l.id = lesson_uuid;

  if not found then
    return query select false, 0, null::integer;
    return;
  end if;

  if not public.can_access_course(course_uuid, student_uuid) then
    return query select false, 0, course_playback_limit;
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
  where course_playback_limit is null
    or public.lesson_progress.playback_count < course_playback_limit
  returning public.lesson_progress.playback_count into next_count;

  if next_count is null then
    select lp.playback_count
    into next_count
    from public.lesson_progress lp
    where lp.student_id = student_uuid
      and lp.lesson_id = lesson_uuid;

    return query select false, coalesce(next_count, 0), course_playback_limit;
    return;
  end if;

  return query select true, next_count, course_playback_limit;
end;
$$;

revoke execute on function public.record_lesson_playback(uuid, uuid, uuid)
from public, anon, authenticated;

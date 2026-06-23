alter table public.lesson_progress
add column if not exists playback_count integer not null default 0 check (playback_count >= 0),
add column if not exists last_playback_started_at timestamptz;

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
begin
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
  where public.lesson_progress.playback_count < max_playbacks
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

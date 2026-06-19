with duplicate_lesson_videos as (
  select
    id,
    row_number() over (
      partition by course_id, bunny_video_id
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.lessons
  where bunny_video_id is not null
)
delete from public.lessons
where id in (
  select id
  from duplicate_lesson_videos
  where duplicate_rank > 1
);

create unique index if not exists lessons_course_bunny_video_unique_idx
on public.lessons(course_id, bunny_video_id)
where bunny_video_id is not null;

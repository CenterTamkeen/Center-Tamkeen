alter table public.lessons
add column if not exists youtube_video_id text,
add column if not exists youtube_url text;

update public.lessons
set video_provider = 'vdocipher'
where vdocipher_video_id is not null
  and bunny_video_id is null
  and video_provider = 'bunny';

alter table public.lessons
drop constraint if exists lessons_video_provider_valid;

alter table public.lessons
add constraint lessons_video_provider_valid
check (video_provider in ('bunny', 'vdocipher', 'youtube'));

alter table public.lessons
drop constraint if exists lessons_single_video_source;

alter table public.lessons
add constraint lessons_single_video_source
check (
  (
    video_provider = 'bunny'
    and bunny_video_id is not null
    and youtube_video_id is null
  )
  or (
    video_provider = 'youtube'
    and youtube_video_id is not null
    and bunny_video_id is null
  )
  or (
    video_provider = 'vdocipher'
    and vdocipher_video_id is not null
    and bunny_video_id is null
    and youtube_video_id is null
  )
  or (
    bunny_video_id is null
    and youtube_video_id is null
    and vdocipher_video_id is null
  )
);

create index if not exists lessons_youtube_video_id_idx
on public.lessons(youtube_video_id)
where youtube_video_id is not null;

create unique index if not exists lessons_course_youtube_video_unique_idx
on public.lessons(course_id, youtube_video_id)
where youtube_video_id is not null;

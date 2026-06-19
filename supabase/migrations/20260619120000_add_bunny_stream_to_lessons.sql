alter table public.lessons
add column if not exists bunny_video_id text,
add column if not exists thumbnail_url text,
add column if not exists video_provider text not null default 'bunny';

alter table public.lessons
drop constraint if exists lessons_video_provider_valid;

alter table public.lessons
add constraint lessons_video_provider_valid
check (video_provider in ('bunny', 'vdocipher'));

create index if not exists lessons_bunny_video_id_idx
on public.lessons(bunny_video_id)
where bunny_video_id is not null;

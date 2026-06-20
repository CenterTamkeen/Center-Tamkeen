create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  started_at timestamptz not null default now(),
  last_watched_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, lesson_id)
);

create index if not exists lesson_progress_student_course_idx
on public.lesson_progress(student_id, course_id);

create index if not exists lesson_progress_course_lesson_idx
on public.lesson_progress(course_id, lesson_id);

alter table public.lesson_progress enable row level security;

drop policy if exists "Students can read own lesson progress and admins read all" on public.lesson_progress;
create policy "Students can read own lesson progress and admins read all"
on public.lesson_progress for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.students s
    where s.id = lesson_progress.student_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "Students can upsert own enrolled lesson progress" on public.lesson_progress;
create policy "Students can upsert own enrolled lesson progress"
on public.lesson_progress for insert
with check (
  exists (
    select 1
    from public.students s
    join public.enrollments e on e.student_id = s.id
    join public.lessons l on l.id = lesson_progress.lesson_id
    where s.id = lesson_progress.student_id
      and s.profile_id = auth.uid()
      and e.course_id = lesson_progress.course_id
      and l.course_id = lesson_progress.course_id
  )
);

drop policy if exists "Students can update own lesson progress and admins update all" on public.lesson_progress;
create policy "Students can update own lesson progress and admins update all"
on public.lesson_progress for update
using (
  public.is_admin()
  or exists (
    select 1
    from public.students s
    where s.id = lesson_progress.student_id
      and s.profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.students s
    join public.enrollments e on e.student_id = s.id
    join public.lessons l on l.id = lesson_progress.lesson_id
    where s.id = lesson_progress.student_id
      and s.profile_id = auth.uid()
      and e.course_id = lesson_progress.course_id
      and l.course_id = lesson_progress.course_id
  )
);

drop trigger if exists set_lesson_progress_updated_at on public.lesson_progress;
create trigger set_lesson_progress_updated_at
before update on public.lesson_progress
for each row execute function public.update_updated_at_column();
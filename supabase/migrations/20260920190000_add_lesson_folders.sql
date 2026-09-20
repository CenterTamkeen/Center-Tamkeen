create table if not exists public.lesson_folders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  order_index integer not null default 0 check (order_index >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, name)
);

alter table public.lessons
  add column if not exists folder_id uuid references public.lesson_folders(id) on delete set null;

create index if not exists lesson_folders_course_id_order_idx
  on public.lesson_folders(course_id, order_index, created_at);
create index if not exists lessons_folder_id_idx on public.lessons(folder_id);

drop trigger if exists set_lesson_folders_updated_at on public.lesson_folders;
create trigger set_lesson_folders_updated_at
before update on public.lesson_folders
for each row execute function public.update_updated_at_column();

alter table public.lesson_folders enable row level security;

drop policy if exists "Published course folders are readable" on public.lesson_folders;
create policy "Published course folders are readable"
on public.lesson_folders for select
using (
  exists (
    select 1
    from public.courses c
    where c.id = lesson_folders.course_id
      and (
        (c.is_published and exists (
          select 1 from public.teachers t
          where t.id = c.teacher_id and t.is_active = true
        ))
        or c.teacher_id = public.current_teacher_id()
        or public.is_admin()
      )
  )
);

drop policy if exists "Teacher owners and admins can create lesson folders" on public.lesson_folders;
create policy "Teacher owners and admins can create lesson folders"
on public.lesson_folders for insert
with check (public.owns_course(course_id) or public.is_admin());

drop policy if exists "Teacher owners and admins can update lesson folders" on public.lesson_folders;
create policy "Teacher owners and admins can update lesson folders"
on public.lesson_folders for update
using (public.owns_course(course_id) or public.is_admin())
with check (public.owns_course(course_id) or public.is_admin());

drop policy if exists "Teacher owners and admins can delete lesson folders" on public.lesson_folders;
create policy "Teacher owners and admins can delete lesson folders"
on public.lesson_folders for delete
using (public.owns_course(course_id) or public.is_admin());

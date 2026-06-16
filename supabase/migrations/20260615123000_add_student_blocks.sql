create table if not exists public.student_blocks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  blocked_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  unique (student_id, teacher_id)
);

create unique index if not exists student_blocks_global_unique
on public.student_blocks (student_id)
where teacher_id is null;

create index if not exists student_blocks_student_id_idx
on public.student_blocks(student_id);

create index if not exists student_blocks_teacher_id_idx
on public.student_blocks(teacher_id);

alter table public.student_blocks enable row level security;

drop policy if exists "Admins can manage all student blocks" on public.student_blocks;
create policy "Admins can manage all student blocks"
on public.student_blocks for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Teachers can manage own student blocks" on public.student_blocks;
create policy "Teachers can manage own student blocks"
on public.student_blocks for all
using (teacher_id = public.current_teacher_id())
with check (teacher_id = public.current_teacher_id());

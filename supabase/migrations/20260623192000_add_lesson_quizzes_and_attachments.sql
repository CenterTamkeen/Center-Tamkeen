create table if not exists public.lesson_attachments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option_index integer not null check (correct_option_index between 0 and 3),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_quiz_questions_options_count check (jsonb_array_length(options) = 4)
);

create index if not exists lesson_attachments_lesson_idx
on public.lesson_attachments(lesson_id);

create index if not exists lesson_quiz_questions_lesson_order_idx
on public.lesson_quiz_questions(lesson_id, order_index);

alter table public.lesson_attachments enable row level security;
alter table public.lesson_quiz_questions enable row level security;

drop policy if exists "Teachers manage own lesson attachments and admins manage all" on public.lesson_attachments;
create policy "Teachers manage own lesson attachments and admins manage all"
on public.lesson_attachments for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = lesson_attachments.lesson_id
      and c.teacher_id = public.current_teacher_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = lesson_attachments.lesson_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Enrolled students read lesson attachments" on public.lesson_attachments;
create policy "Enrolled students read lesson attachments"
on public.lesson_attachments for select
using (
  exists (
    select 1
    from public.lessons l
    join public.enrollments e on e.course_id = l.course_id
    where l.id = lesson_attachments.lesson_id
      and e.student_id = public.current_student_id()
  )
);

drop policy if exists "Teachers manage own lesson quiz questions and admins manage all" on public.lesson_quiz_questions;
create policy "Teachers manage own lesson quiz questions and admins manage all"
on public.lesson_quiz_questions for all
using (
  public.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = lesson_quiz_questions.lesson_id
      and c.teacher_id = public.current_teacher_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = lesson_quiz_questions.lesson_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Enrolled students read completed lesson quiz questions" on public.lesson_quiz_questions;
create policy "Enrolled students read completed lesson quiz questions"
on public.lesson_quiz_questions for select
using (
  exists (
    select 1
    from public.lessons l
    join public.lesson_progress lp on lp.lesson_id = l.id
    where l.id = lesson_quiz_questions.lesson_id
      and lp.student_id = public.current_student_id()
      and lp.status = 'completed'
  )
);

drop trigger if exists set_lesson_quiz_questions_updated_at on public.lesson_quiz_questions;
create trigger set_lesson_quiz_questions_updated_at
before update on public.lesson_quiz_questions
for each row execute function public.update_updated_at_column();

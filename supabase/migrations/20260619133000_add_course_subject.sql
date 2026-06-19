alter table public.courses
add column if not exists subject text;

update public.courses c
set subject = t.subject
from public.teachers t
where c.teacher_id = t.id
  and (c.subject is null or btrim(c.subject) = '');

create index if not exists courses_subject_idx
on public.courses(subject);

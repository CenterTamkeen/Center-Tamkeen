drop policy if exists "Published courses are public and owners admins see all" on public.courses;
create policy "Published courses are public and owners admins see all"
on public.courses for select
using (
  (
    is_published = true
    and exists (
      select 1
      from public.teachers t
      where t.id = courses.teacher_id
        and t.is_active = true
    )
  )
  or teacher_id = public.current_teacher_id()
  or public.is_admin()
);

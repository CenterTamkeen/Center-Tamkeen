do $$
begin
  if exists (
    with ranked_teachers as (
      select
        id,
        row_number() over (
          partition by profile_id
          order by created_at asc, id asc
        ) as duplicate_rank
      from public.teachers
    )
    select 1
    from ranked_teachers
    join public.teachers t on t.id = ranked_teachers.id
    where ranked_teachers.duplicate_rank > 1
      and (
        exists (select 1 from public.courses where teacher_id = t.id)
        or exists (select 1 from public.coupons where teacher_id = t.id)
        or exists (
          select 1
          from public.teacher_earnings
          where teacher_id = t.id
        )
        or exists (select 1 from public.student_blocks where teacher_id = t.id)
        or exists (
          select 1
          from public.hero_announcements
          where teacher_id = t.id
        )
      )
  ) then
    raise exception 'Duplicate teacher profiles with dependent records were found. Merge those records before applying the unique constraint.';
  end if;
end $$;

with ranked_teachers as (
  select
    id,
    row_number() over (
      partition by profile_id
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.teachers
)
delete from public.teachers
using ranked_teachers
where teachers.id = ranked_teachers.id
  and ranked_teachers.duplicate_rank > 1;

create unique index if not exists teachers_profile_id_unique_idx
on public.teachers (profile_id);

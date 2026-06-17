alter table public.students
  drop constraint if exists students_section_matches_grade;

update public.students
set section = case
  when grade = 'first_secondary' and section = 'general'
    then 'preparatory'::public.student_section
  when grade = 'second_secondary' and section = 'scientific'
    then 'medicine_life_sciences'::public.student_section
  when grade = 'second_secondary' and section = 'literary'
    then 'arts'::public.student_section
  when grade = 'third_secondary' and section = 'science'
    then 'medicine_life_sciences'::public.student_section
  when grade = 'third_secondary' and section = 'mathematics'
    then 'engineering_computer_science'::public.student_section
  when grade = 'third_secondary' and section = 'literary'
    then 'arts'::public.student_section
  else section
end
where section in ('general', 'scientific', 'literary', 'science', 'mathematics');

alter table public.students
  add constraint students_section_matches_grade check (
    (grade = 'first_secondary' and section = 'preparatory')
    or (
      grade in ('second_secondary', 'third_secondary')
      and section in (
        'medicine_life_sciences',
        'engineering_computer_science',
        'business',
        'arts'
      )
    )
  );

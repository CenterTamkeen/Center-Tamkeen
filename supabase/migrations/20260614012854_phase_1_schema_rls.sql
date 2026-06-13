-- Phase 1: database schema, indexes, RLS policies, triggers, and storage.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists unaccent;

do $$
begin
  create type public.app_role as enum ('student', 'teacher', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.student_gender as enum ('male', 'female');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.student_grade as enum (
    'first_secondary',
    'second_secondary',
    'third_secondary'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.student_section as enum (
    'general',
    'scientific',
    'literary',
    'science',
    'mathematics'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('pending', 'completed', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.discount_type as enum ('percentage', 'fixed');
exception
  when duplicate_object then null;
end $$;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 8),
  role public.app_role not null default 'student',
  avatar_url text,
  phone text check (phone is null or phone ~ '^01[0-2,5][0-9]{8}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  student_phone text not null check (student_phone ~ '^01[0-2,5][0-9]{8}$'),
  father_phone text not null check (father_phone ~ '^01[0-2,5][0-9]{8}$'),
  school_name text not null check (char_length(trim(school_name)) >= 2),
  gender public.student_gender not null,
  grade public.student_grade not null,
  section public.student_section not null,
  photo_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_distinct_phones check (student_phone <> father_phone),
  constraint students_section_matches_grade check (
    (grade = 'first_secondary' and section = 'general')
    or (grade = 'second_secondary' and section in ('scientific', 'literary'))
    or (grade = 'third_secondary' and section in ('science', 'mathematics', 'literary'))
  )
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bio text,
  subject text not null check (char_length(trim(subject)) >= 2),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  thumbnail_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 2),
  order_index integer not null check (order_index >= 0),
  vdocipher_video_id text,
  duration integer check (duration is null or duration >= 0),
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, order_index)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete restrict,
  total_amount numeric(10, 2) not null check (total_amount >= 0),
  status public.order_status not null default 'pending',
  fawry_ref_no text unique,
  rejection_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_rejection_reason_required check (
    status <> 'rejected'
    or rejection_reason is not null
  )
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  price_at_purchase numeric(10, 2) not null check (price_at_purchase >= 0),
  created_at timestamptz not null default now(),
  unique (order_id, course_id)
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  code citext not null,
  discount_type public.discount_type not null,
  discount_value numeric(10, 2) not null,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, code),
  constraint coupons_discount_value_valid check (
    (discount_type = 'percentage' and discount_value > 0 and discount_value <= 100)
    or (discount_type = 'fixed' and discount_value > 0)
  ),
  constraint coupons_usage_count_valid check (
    usage_limit is null
    or used_count <= usage_limit
  )
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.teacher_earnings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (teacher_id, order_id)
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists students_profile_id_idx on public.students(profile_id);
create index if not exists students_grade_section_idx on public.students(grade, section);
create index if not exists teachers_profile_id_idx on public.teachers(profile_id);
create index if not exists teachers_slug_idx on public.teachers(slug);
create index if not exists courses_teacher_id_idx on public.courses(teacher_id);
create index if not exists courses_published_created_at_idx on public.courses(is_published, created_at desc);
create index if not exists lessons_course_id_order_idx on public.lessons(course_id, order_index);
create index if not exists orders_student_id_status_idx on public.orders(student_id, status);
create index if not exists orders_status_created_at_idx on public.orders(status, created_at desc);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists order_items_course_id_idx on public.order_items(course_id);
create index if not exists enrollments_student_id_idx on public.enrollments(student_id);
create index if not exists enrollments_course_id_idx on public.enrollments(course_id);
create index if not exists coupons_teacher_id_code_idx on public.coupons(teacher_id, code);
create index if not exists coupons_active_expires_at_idx on public.coupons(is_active, expires_at);
create index if not exists reviews_course_id_created_at_idx on public.reviews(course_id, created_at desc);
create index if not exists reviews_student_id_idx on public.reviews(student_id);
create index if not exists teacher_earnings_teacher_id_idx on public.teacher_earnings(teacher_id);
create index if not exists teacher_earnings_order_id_idx on public.teacher_earnings(order_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

drop trigger if exists set_students_updated_at on public.students;
create trigger set_students_updated_at
before update on public.students
for each row execute function public.update_updated_at_column();

drop trigger if exists set_teachers_updated_at on public.teachers;
create trigger set_teachers_updated_at
before update on public.teachers
for each row execute function public.update_updated_at_column();

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
before update on public.courses
for each row execute function public.update_updated_at_column();

drop trigger if exists set_lessons_updated_at on public.lessons;
create trigger set_lessons_updated_at
before update on public.lessons
for each row execute function public.update_updated_at_column();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.update_updated_at_column();

drop trigger if exists set_coupons_updated_at on public.coupons;
create trigger set_coupons_updated_at
before update on public.coupons
for each row execute function public.update_updated_at_column();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.update_updated_at_column();

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students where profile_id = auth.uid();
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers where profile_id = auth.uid();
$$;

create or replace function public.owns_course(course_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses
    where id = course_uuid
      and teacher_id = public.current_teacher_id()
  );
$$;

create or replace function public.is_enrolled_in_course(course_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments
    where student_id = public.current_student_id()
      and course_id = course_uuid
  );
$$;

create or replace function public.generate_teacher_slug(source_name text, teacher_uuid uuid default null)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 1;
begin
  base_slug := lower(unaccent(coalesce(source_name, 'teacher')));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'teacher';
  end if;

  candidate := base_slug;

  while exists (
    select 1
    from public.teachers
    where slug = candidate
      and (teacher_uuid is null or id <> teacher_uuid)
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;

  return candidate;
end;
$$;

create or replace function public.set_teacher_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  profile_name text;
begin
  if new.slug is null or trim(new.slug) = '' then
    select full_name into profile_name
    from public.profiles
    where id = new.profile_id;

    new.slug := public.generate_teacher_slug(profile_name, new.id);
  else
    new.slug := public.generate_teacher_slug(new.slug, new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists set_teacher_slug_before_write on public.teachers;
create trigger set_teacher_slug_before_write
before insert or update of slug, profile_id on public.teachers
for each row execute function public.set_teacher_slug();

create or replace function public.set_order_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists set_order_completed_at_before_update on public.orders;
create trigger set_order_completed_at_before_update
before update of status on public.orders
for each row execute function public.set_order_completed_at();

create or replace function public.complete_order_side_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    insert into public.enrollments (student_id, course_id, order_id)
    select new.student_id, oi.course_id, new.id
    from public.order_items oi
    where oi.order_id = new.id
    on conflict (student_id, course_id) do nothing;

    insert into public.teacher_earnings (teacher_id, order_id, amount)
    select c.teacher_id, new.id, sum(oi.price_at_purchase)
    from public.order_items oi
    join public.courses c on c.id = oi.course_id
    where oi.order_id = new.id
    group by c.teacher_id
    on conflict (teacher_id, order_id) do update
      set amount = excluded.amount;
  end if;

  return new;
end;
$$;

drop trigger if exists complete_order_after_status_update on public.orders;
create trigger complete_order_after_status_update
after update of status on public.orders
for each row execute function public.complete_order_side_effects();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.enrollments enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.teacher_earnings enable row level security;

drop policy if exists "Profiles are readable by owner admins and active teacher pages" on public.profiles;
create policy "Profiles are readable by owner admins and active teacher pages"
on public.profiles for select
using (
  id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.teachers
    where teachers.profile_id = profiles.id
      and teachers.is_active = true
  )
);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "Users can update their own profile or admins can update all" on public.profiles;
create policy "Users can update their own profile or admins can update all"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Students are readable by owner teachers of enrolled courses and admins" on public.students;
create policy "Students are readable by owner teachers of enrolled courses and admins"
on public.students for select
using (
  profile_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.student_id = students.id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Students can create their own student record" on public.students;
create policy "Students can create their own student record"
on public.students for insert
with check (
  profile_id = auth.uid()
  and public.current_user_role() = 'student'
);

drop policy if exists "Students can update themselves and admins can update all students" on public.students;
create policy "Students can update themselves and admins can update all students"
on public.students for update
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "Active teachers are public and owners admins see all" on public.teachers;
create policy "Active teachers are public and owners admins see all"
on public.teachers for select
using (is_active = true or profile_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can create teachers" on public.teachers;
create policy "Admins can create teachers"
on public.teachers for insert
with check (public.is_admin());

drop policy if exists "Teacher owners and admins can update teachers" on public.teachers;
create policy "Teacher owners and admins can update teachers"
on public.teachers for update
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can delete teachers" on public.teachers;
create policy "Admins can delete teachers"
on public.teachers for delete
using (public.is_admin());

drop policy if exists "Published courses are public and owners admins see all" on public.courses;
create policy "Published courses are public and owners admins see all"
on public.courses for select
using (
  is_published = true
  or teacher_id = public.current_teacher_id()
  or public.is_admin()
);

drop policy if exists "Teacher owners and admins can create courses" on public.courses;
create policy "Teacher owners and admins can create courses"
on public.courses for insert
with check (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Teacher owners and admins can update courses" on public.courses;
create policy "Teacher owners and admins can update courses"
on public.courses for update
using (teacher_id = public.current_teacher_id() or public.is_admin())
with check (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Teacher owners and admins can delete courses" on public.courses;
create policy "Teacher owners and admins can delete courses"
on public.courses for delete
using (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Lessons are readable by preview enrolled owner or admin" on public.lessons;
create policy "Lessons are readable by preview enrolled owner or admin"
on public.lessons for select
using (
  exists (
    select 1
    from public.courses c
    where c.id = lessons.course_id
      and c.is_published = true
      and lessons.is_free_preview = true
  )
  or public.is_enrolled_in_course(course_id)
  or public.owns_course(course_id)
  or public.is_admin()
);

drop policy if exists "Teacher owners and admins can create lessons" on public.lessons;
create policy "Teacher owners and admins can create lessons"
on public.lessons for insert
with check (public.owns_course(course_id) or public.is_admin());

drop policy if exists "Teacher owners and admins can update lessons" on public.lessons;
create policy "Teacher owners and admins can update lessons"
on public.lessons for update
using (public.owns_course(course_id) or public.is_admin())
with check (public.owns_course(course_id) or public.is_admin());

drop policy if exists "Teacher owners and admins can delete lessons" on public.lessons;
create policy "Teacher owners and admins can delete lessons"
on public.lessons for delete
using (public.owns_course(course_id) or public.is_admin());

drop policy if exists "Students can read own orders and admins can read all" on public.orders;
create policy "Students can read own orders and admins can read all"
on public.orders for select
using (student_id = public.current_student_id() or public.is_admin());

drop policy if exists "Students can create pending own orders" on public.orders;
create policy "Students can create pending own orders"
on public.orders for insert
with check (
  student_id = public.current_student_id()
  and status = 'pending'
);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Order items are readable by order owner course teacher and admins" on public.order_items;
create policy "Order items are readable by order owner course teacher and admins"
on public.order_items for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.student_id = public.current_student_id()
  )
  or exists (
    select 1
    from public.courses c
    where c.id = order_items.course_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Students can create items for pending own orders" on public.order_items;
create policy "Students can create items for pending own orders"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and o.student_id = public.current_student_id()
      and o.status = 'pending'
  )
);

drop policy if exists "Enrollments are readable by student course teacher and admins" on public.enrollments;
create policy "Enrollments are readable by student course teacher and admins"
on public.enrollments for select
using (
  student_id = public.current_student_id()
  or public.is_admin()
  or exists (
    select 1
    from public.courses c
    where c.id = enrollments.course_id
      and c.teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Only admins can create enrollments through policies" on public.enrollments;
create policy "Only admins can create enrollments through policies"
on public.enrollments for insert
with check (public.is_admin());

drop policy if exists "Only admins can update enrollments" on public.enrollments;
create policy "Only admins can update enrollments"
on public.enrollments for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Only admins can delete enrollments" on public.enrollments;
create policy "Only admins can delete enrollments"
on public.enrollments for delete
using (public.is_admin());

drop policy if exists "Active coupons are readable and teachers admins read own inactive coupons" on public.coupons;
create policy "Active coupons are readable and teachers admins read own inactive coupons"
on public.coupons for select
using (
  (
    is_active = true
    and (expires_at is null or expires_at > now())
    and (usage_limit is null or used_count < usage_limit)
  )
  or teacher_id = public.current_teacher_id()
  or public.is_admin()
);

drop policy if exists "Teacher owners and admins can create coupons" on public.coupons;
create policy "Teacher owners and admins can create coupons"
on public.coupons for insert
with check (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Teacher owners and admins can update coupons" on public.coupons;
create policy "Teacher owners and admins can update coupons"
on public.coupons for update
using (teacher_id = public.current_teacher_id() or public.is_admin())
with check (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Teacher owners and admins can delete coupons" on public.coupons;
create policy "Teacher owners and admins can delete coupons"
on public.coupons for delete
using (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public"
on public.reviews for select
using (true);

drop policy if exists "Enrolled students can create reviews" on public.reviews;
create policy "Enrolled students can create reviews"
on public.reviews for insert
with check (
  student_id = public.current_student_id()
  and public.is_enrolled_in_course(course_id)
);

drop policy if exists "Students can update own reviews and admins can update all" on public.reviews;
create policy "Students can update own reviews and admins can update all"
on public.reviews for update
using (student_id = public.current_student_id() or public.is_admin())
with check (student_id = public.current_student_id() or public.is_admin());

drop policy if exists "Students can delete own reviews and admins can delete all" on public.reviews;
create policy "Students can delete own reviews and admins can delete all"
on public.reviews for delete
using (student_id = public.current_student_id() or public.is_admin());

drop policy if exists "Teacher earnings are readable by owner teachers and admins" on public.teacher_earnings;
create policy "Teacher earnings are readable by owner teachers and admins"
on public.teacher_earnings for select
using (teacher_id = public.current_teacher_id() or public.is_admin());

drop policy if exists "Only admins can create teacher earnings through policies" on public.teacher_earnings;
create policy "Only admins can create teacher earnings through policies"
on public.teacher_earnings for insert
with check (public.is_admin());

drop policy if exists "Only admins can update teacher earnings" on public.teacher_earnings;
create policy "Only admins can update teacher earnings"
on public.teacher_earnings for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Only admins can delete teacher earnings" on public.teacher_earnings;
create policy "Only admins can delete teacher earnings"
on public.teacher_earnings for delete
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'thumbnails',
    'thumbnails',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read Tamkeen media" on storage.objects;
create policy "Public can read Tamkeen media"
on storage.objects for select
using (bucket_id in ('avatars', 'thumbnails'));

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Teachers and admins can upload thumbnails" on storage.objects;
create policy "Teachers and admins can upload thumbnails"
on storage.objects for insert
with check (
  bucket_id = 'thumbnails'
  and (
    public.is_admin()
    or (
      public.current_teacher_id() is not null
      and (storage.foldername(name))[1] = public.current_teacher_id()::text
    )
  )
);

drop policy if exists "Teachers and admins can update thumbnails" on storage.objects;
create policy "Teachers and admins can update thumbnails"
on storage.objects for update
using (
  bucket_id = 'thumbnails'
  and (
    public.is_admin()
    or (
      public.current_teacher_id() is not null
      and (storage.foldername(name))[1] = public.current_teacher_id()::text
    )
  )
)
with check (
  bucket_id = 'thumbnails'
  and (
    public.is_admin()
    or (
      public.current_teacher_id() is not null
      and (storage.foldername(name))[1] = public.current_teacher_id()::text
    )
  )
);

drop policy if exists "Teachers and admins can delete thumbnails" on storage.objects;
create policy "Teachers and admins can delete thumbnails"
on storage.objects for delete
using (
  bucket_id = 'thumbnails'
  and (
    public.is_admin()
    or (
      public.current_teacher_id() is not null
      and (storage.foldername(name))[1] = public.current_teacher_id()::text
    )
  )
);

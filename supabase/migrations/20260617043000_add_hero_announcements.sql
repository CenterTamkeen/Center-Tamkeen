create table if not exists public.hero_announcements (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete cascade,
  owner_role public.app_role not null,
  title text not null check (char_length(trim(title)) >= 2),
  image_url text not null check (char_length(trim(image_url)) > 0),
  button_text text not null check (char_length(trim(button_text)) between 2 and 40),
  button_url text not null check (char_length(trim(button_url)) between 1 and 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_announcements_owner_role_valid check (owner_role in ('admin', 'teacher')),
  constraint hero_announcements_teacher_owner_valid check (
    (owner_role = 'teacher' and teacher_id is not null)
    or (owner_role = 'admin' and teacher_id is null)
  )
);

create index if not exists hero_announcements_active_created_at_idx
on public.hero_announcements(is_active, created_at desc);

create index if not exists hero_announcements_teacher_id_idx
on public.hero_announcements(teacher_id);

drop trigger if exists set_hero_announcements_updated_at on public.hero_announcements;
create trigger set_hero_announcements_updated_at
before update on public.hero_announcements
for each row execute function public.update_updated_at_column();

alter table public.hero_announcements enable row level security;

drop policy if exists "Active hero announcements are public" on public.hero_announcements;
create policy "Active hero announcements are public"
on public.hero_announcements for select
using (
  is_active = true
  or public.is_admin()
  or teacher_id = public.current_teacher_id()
);

drop policy if exists "Admins and teachers can create hero announcements" on public.hero_announcements;
create policy "Admins and teachers can create hero announcements"
on public.hero_announcements for insert
with check (
  (
    public.is_admin()
    and created_by = auth.uid()
    and owner_role = 'admin'
    and teacher_id is null
  )
  or (
    public.current_teacher_id() is not null
    and created_by = auth.uid()
    and owner_role = 'teacher'
    and teacher_id = public.current_teacher_id()
  )
);

drop policy if exists "Admins and teacher owners can update hero announcements" on public.hero_announcements;
create policy "Admins and teacher owners can update hero announcements"
on public.hero_announcements for update
using (public.is_admin() or teacher_id = public.current_teacher_id())
with check (public.is_admin() or teacher_id = public.current_teacher_id());

drop policy if exists "Admins and teacher owners can delete hero announcements" on public.hero_announcements;
create policy "Admins and teacher owners can delete hero announcements"
on public.hero_announcements for delete
using (public.is_admin() or teacher_id = public.current_teacher_id());

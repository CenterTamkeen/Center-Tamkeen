create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('student_signup')),
  code_hash text not null,
  attempts integer not null default 0 check (attempts >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (email, purpose)
);

alter table public.email_verification_codes enable row level security;

create index if not exists email_verification_codes_expires_at_idx
  on public.email_verification_codes (expires_at);

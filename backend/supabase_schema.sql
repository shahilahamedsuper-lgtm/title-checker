-- Users table
create table if not exists public.users (
  id          text primary key default gen_random_uuid()::text,
  email       text unique not null,
  name        text not null,
  password_hash text not null,
  created_at  timestamptz default now()
);

-- File history table
create table if not exists public.file_history (
  id          text primary key default gen_random_uuid()::text,
  user_id     text references public.users(id) on delete cascade,
  filename    text not null,
  content_type text,
  size_bytes  int default 0,
  operation   text not null check (operation in ('upload','analyze','deduplicate','excel')),
  status      text not null default 'analyzed' check (status in ('analyzed','pending','failed')),
  uploaded_at timestamptz default now()
);

create index if not exists idx_file_history_user_id on public.file_history(user_id);
create index if not exists idx_file_history_uploaded_at on public.file_history(uploaded_at desc);

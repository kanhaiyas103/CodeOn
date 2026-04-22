-- Codeon core schema

create table if not exists public.user_sessions (
  user_id text primary key,
  sessions_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.project_artifacts (
  id bigint generated always as identity primary key,
  user_id text not null,
  artifact_type text not null,
  artifact_name text,
  artifact_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_projects (
  id bigint generated always as identity primary key,
  user_id text,
  project_name text not null,
  output_dir text not null,
  summary text,
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_artifacts_user_id on public.project_artifacts(user_id);
create index if not exists idx_generated_projects_user_id on public.generated_projects(user_id);

-- RLS policies are optional here because server-side service-role key is used for MVP backend writes.

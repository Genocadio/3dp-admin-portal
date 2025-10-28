-- Add new columns to profiles table for organization and user role
alter table if exists public.profiles
add column organisation_name text,
add column user_role text not null default 'manager' check (user_role in ('manager', 'ceo', 'accountant', 'other')),
add column phone_number text,
add column is_active boolean not null default true;

-- Create admin_users table for admin-only accounts (separate from company users)
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster admin lookups
create index if not exists idx_admin_users_email on public.admin_users(email);

-- Add note: Admin accounts will be linked to auth.users with role='admin'
-- Regular company users will have role='user' in auth

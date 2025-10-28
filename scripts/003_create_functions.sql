-- Function to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers to all tables
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.applications
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.categories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.questions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.submissions
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.submission_answers
  for each row execute function public.handle_updated_at();

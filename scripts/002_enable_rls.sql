-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.categories enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.submission_media enable row level security;

-- Profiles policies
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Applications policies (everyone can view active, only admins can modify)
create policy "Anyone can view active applications"
  on public.applications for select
  using (is_active = true or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can insert applications"
  on public.applications for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can update applications"
  on public.applications for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can delete applications"
  on public.applications for delete
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Categories policies
create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Admins can insert categories"
  on public.categories for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can update categories"
  on public.categories for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can delete categories"
  on public.categories for delete
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Questions policies
create policy "Anyone can view questions"
  on public.questions for select
  using (true);

create policy "Admins can insert questions"
  on public.questions for insert
  with check (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can update questions"
  on public.questions for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Admins can delete questions"
  on public.questions for delete
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Submissions policies
create policy "Users can view own submissions"
  on public.submissions for select
  using (auth.uid() = user_id or exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

create policy "Users can insert own submissions"
  on public.submissions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own pending submissions"
  on public.submissions for update
  using (auth.uid() = user_id and status = 'pending');

create policy "Admins can update any submission"
  on public.submissions for update
  using (exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  ));

-- Submission answers policies
create policy "Users can view own submission answers"
  on public.submission_answers for select
  using (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and (submissions.user_id = auth.uid() or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    ))
  ));

create policy "Users can insert own submission answers"
  on public.submission_answers for insert
  with check (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and submissions.user_id = auth.uid()
  ));

create policy "Users can update own submission answers"
  on public.submission_answers for update
  using (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and submissions.user_id = auth.uid()
    and submissions.status = 'pending'
  ));

-- Submission media policies
create policy "Users can view own submission media"
  on public.submission_media for select
  using (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and (submissions.user_id = auth.uid() or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    ))
  ));

create policy "Users can insert own submission media"
  on public.submission_media for insert
  with check (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and submissions.user_id = auth.uid()
  ));

create policy "Users can delete own submission media"
  on public.submission_media for delete
  using (exists (
    select 1 from public.submissions
    where submissions.id = submission_id
    and submissions.user_id = auth.uid()
    and submissions.status = 'pending'
  ));

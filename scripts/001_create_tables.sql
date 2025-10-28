-- Create profiles table for user information
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create applications table (e.g., "Tax Evaluation")
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  is_active boolean default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create categories table (within applications)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create questions table (within categories)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  question_text text not null,
  help_text text,
  question_type text not null check (question_type in ('multiple_choice', 'text', 'media_only')),
  options jsonb, -- Array of {text, value, points, showUpload}
  points integer default 0,
  media_upload_config jsonb default '{"required": false, "allowedTypes": ["image/*", "application/pdf"], "maxSize": 5242880}'::jsonb,
  depends_on_question_id uuid references public.questions(id) on delete set null,
  depends_on_answer text,
  order_index integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create submissions table (user applications)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected')),
  total_score integer default 0,
  max_score integer default 0,
  submitted_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create submission_answers table (individual answers)
create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  answer_text text,
  answer_value text,
  points_earned integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(submission_id, question_id)
);

-- Create submission_media table (uploaded files)
create table if not exists public.submission_media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text not null,
  file_size integer not null,
  uploaded_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_categories_application on public.categories(application_id);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_submissions_user on public.submissions(user_id);
create index if not exists idx_submissions_application on public.submissions(application_id);
create index if not exists idx_submission_answers_submission on public.submission_answers(submission_id);
create index if not exists idx_submission_media_submission on public.submission_media(submission_id);

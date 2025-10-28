# Admin Account Setup Guide

## Creating Your First Admin Account

Since the application uses Supabase Authentication, admin accounts must be created through the signup flow and then promoted to admin role.

### Step 1: Sign Up
1. Navigate to `/auth/sign-up` in your application
2. Create an account with your desired credentials

**Recommended Admin Credentials:**
- Email: `admin@3dp.com`
- Password: `Admin123!` (or your preferred secure password)

### Step 2: Promote to Admin
After signing up, you need to update the user's role in the database:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Run this query (replace with your email):

\`\`\`sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@3dp.com';
\`\`\`

### Step 3: Access Admin Panel
1. Log out and log back in
2. Navigate to `/admin` to access the admin dashboard

## Creating Additional Admins

To create more admin accounts, repeat the process:
1. Have them sign up through `/auth/sign-up`
2. Run the UPDATE query with their email address
3. They can now access `/admin`

## Verifying Admin Access

You can verify a user's role by running:

\`\`\`sql
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE role = 'admin';
\`\`\`

## Security Notes

- Admin role is checked via Row Level Security (RLS) policies
- Only users with `role = 'admin'` can access admin-only data
- Regular users cannot elevate their own permissions
- Always use strong passwords for admin accounts

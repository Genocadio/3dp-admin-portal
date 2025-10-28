# Database Migration Guide - How to Execute the Script

## Quick Start (2 minutes)

### Option 1: Using Supabase Dashboard (Easiest) ✅ RECOMMENDED

1. **Open Supabase Console**
   - Go to: https://app.supabase.com
   - Select your project
   - Click "SQL Editor" in left sidebar

2. **Create New Query**
   - Click "New Query" button
   - Title: "Add Org and Roles Migration"

3. **Copy & Paste Script**
   - Open: `/scripts/007_add_org_and_roles.sql`
   - Copy ALL the code
   - Paste into Supabase SQL editor

4. **Execute**
   - Click "Run" button (or Cmd+Enter)
   - Wait for success confirmation ✅

5. **Verify**
   - Go to "Table Editor"
   - Check `profiles` table has new columns
   - Check `admin_users` table exists

---

## Step-by-Step Instructions

### Step 1: Access Supabase SQL Editor

```
1. Open https://app.supabase.com
2. Login with your credentials
3. Select your project from the dropdown
4. Left sidebar → Click "SQL Editor"
```

### Step 2: Get the Migration Script

```
Location: /scripts/007_add_org_and_roles.sql

Content to copy:

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
```

### Step 3: Execute in Supabase

```
Method A: GUI Method
1. Click "New Query" button
2. Paste the entire script
3. Click "Run" button
4. Watch for green success indicator ✅

Method B: Copy-Paste Direct
1. Click in the editor area
2. Paste script (Cmd+V)
3. Press Cmd+Enter to execute
```

### Step 4: Verify Success

After execution, you should see:
```
✅ Query executed successfully
```

Then verify the changes:

**Check profiles table additions:**
```sql
-- Run this query to verify new columns exist:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='profiles' 
AND column_name IN ('organisation_name', 'user_role', 'phone_number', 'is_active');
```

**Check admin_users table creation:**
```sql
-- Run this query to verify table exists:
SELECT table_name 
FROM information_schema.tables 
WHERE table_name='admin_users';
```

---

## Option 2: Using Terminal/CLI

If you prefer command line:

### Using psql (PostgreSQL Command Line)

```bash
# 1. Get your Supabase connection string
# - Go to: https://app.supabase.com → Project Settings → Database
# - Copy "Connection String" (select "psql" tab)
# - Should look like: postgresql://[user]:[password]@[host]:[port]/[database]

# 2. Connect and execute script:
psql "postgresql://[your-connection-string]" < scripts/007_add_org_and_roles.sql

# 3. Expected output:
# ALTER TABLE
# CREATE TABLE
# CREATE INDEX
```

### Using Supabase CLI

```bash
# 1. Install Supabase CLI (if not already)
npm install -g supabase

# 2. Link to your project
supabase link --project-ref [your-project-ref]

# 3. Execute migration
supabase db push

# Or directly:
supabase db execute -f scripts/007_add_org_and_roles.sql
```

### Using curl (REST API)

```bash
# Get your API credentials from:
# https://app.supabase.com → Project Settings → API

curl -X POST 'https://[project-ref].supabase.co/rest/v1/rpc/execute_sql' \
  -H 'Authorization: Bearer [your-anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "ALTER TABLE public.profiles ADD COLUMN organisation_name text; ..."
  }'
```

---

## Verification Checklist

After running the script, verify all changes:

### ✅ Profiles Table Updates

```sql
-- Check new columns exist
\d public.profiles

-- Should show:
-- organisation_name | text
-- user_role         | text
-- phone_number      | text
-- is_active         | boolean
```

### ✅ Admin Users Table Creation

```sql
-- Check table exists
\d public.admin_users

-- Should show columns:
-- id        | uuid
-- email     | text (unique)
-- full_name | text
-- created_at | timestamp
-- updated_at | timestamp
```

### ✅ Index Creation

```sql
-- Check index exists
\di public.idx_admin_users_email

-- Should show the index is created
```

### ✅ Test Insert (Optional)

```sql
-- Test profiles table with new columns
UPDATE public.profiles 
SET organisation_name = 'Test Company', 
    user_role = 'manager', 
    phone_number = '+1234567890',
    is_active = true
WHERE id = '[test-user-id]'
LIMIT 1;

-- Test admin_users table
INSERT INTO public.admin_users (email, full_name)
VALUES ('admin@test.com', 'Test Admin');

-- If no errors, everything works! ✅
```

---

## Troubleshooting

### Error: "Column already exists"
```
Solution: The columns were already added in a previous run.
This is OK - the script uses "IF NOT EXISTS" so it's safe to run again.
```

### Error: "Table already exists"
```
Solution: Same as above - the table already exists.
This is expected and safe - won't create duplicates.
```

### Error: "Permission denied"
```
Solution: Your user doesn't have sufficient permissions.
→ Contact your Supabase project owner
→ Or request superuser/admin access
```

### Error: "Invalid syntax"
```
Solution: Script may have been corrupted in copy/paste.
→ Copy the script again from: /scripts/007_add_org_and_roles.sql
→ Paste carefully without extra characters
→ Try again
```

### Changes not showing up
```
Solution: Browser cache or connection issue.
→ Refresh the page (Cmd+R)
→ Clear browser cache
→ Close and reopen Supabase
→ Try a new incognito window
```

---

## After Migration: Next Steps

Once the database script succeeds, you need to:

### 1. Update RLS Policies
See: `USER_MANAGEMENT_NEXT_STEPS.md` → "REQUIRED - RLS Policies Update"

```sql
-- Example: Allow users to update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### 2. Update Auth Trigger
See: `USER_MANAGEMENT_NEXT_STEPS.md` → "REQUIRED - Middleware Update"

The `handle_new_user()` trigger needs to capture:
- `organisation_name` from metadata
- `user_role` from metadata

### 3. Update Middleware
See: `USER_MANAGEMENT_NEXT_STEPS.md` → "REQUIRED - Auth Middleware"

Check `is_active` status and route based on role.

---

## Complete Workflow Example

### Scenario: Setting up on a fresh Supabase project

```bash
# 1. Project created on Supabase.com ✓

# 2. Run base migration (existing tables)
# Already done - profiles, applications, etc. exist ✓

# 3. Run THIS new migration
supabase db execute -f scripts/007_add_org_and_roles.sql
# Output: SUCCESS ✓

# 4. Verify changes
SELECT COUNT(*) FROM public.admin_users;
# Output: 0 (empty table, good) ✓

# 5. Update RLS policies
# Copy from USER_MANAGEMENT_NEXT_STEPS.md
# Paste into Supabase SQL editor
# Run each policy ✓

# 6. Update auth trigger
# Modify handle_new_user() function ✓

# 7. Update middleware.ts
# Add is_active check and role routing ✓

# 8. Test the system
npm run dev
# Go to http://localhost:3000/auth/sign-up
# Try registering a user ✓

# 9. Verify data
SELECT * FROM profiles WHERE email='test@example.com';
# Should show: organisation_name, user_role filled ✓

# 10. Create first admin
-- In Supabase SQL Editor:
INSERT INTO admin_users (email, full_name) 
VALUES ('admin@company.com', 'Admin User');
# Output: 1 row affected ✓

# 11. Deploy to production 🚀
```

---

## Quick Command Reference

### Most Common: Supabase Dashboard

```
1. Open: https://app.supabase.com
2. Select project
3. Left sidebar → "SQL Editor"
4. Click "New Query"
5. Paste script from: /scripts/007_add_org_and_roles.sql
6. Click "Run"
7. See: ✅ "Query executed successfully"
```

### Via Terminal (if DB URL available)

```bash
# Get connection string from Supabase → Settings → Database
# Run:
psql [connection-string] < scripts/007_add_org_and_roles.sql
```

### Via Supabase CLI

```bash
supabase link --project-ref [project-id]
supabase db execute -f scripts/007_add_org_and_roles.sql
```

---

## Still Have Questions?

| Question | Answer |
|----------|--------|
| Where's my Supabase project? | https://app.supabase.com |
| How do I get my connection string? | Project Settings → Database → Connection String |
| What if I get an error? | See Troubleshooting section above |
| Can I run this script twice? | Yes, it's safe - uses IF NOT EXISTS |
| How long does it take? | Usually < 1 second |
| Do I need to restart my app? | Yes, after updating middleware |
| Will existing data be affected? | No, only adds new columns/tables |

---

## Summary

**The easiest way:**
1. Go to https://app.supabase.com
2. Open SQL Editor
3. Create New Query
4. Copy/paste `/scripts/007_add_org_and_roles.sql`
5. Click Run
6. Done! ✅

**Total time: 2-3 minutes**

Then follow `USER_MANAGEMENT_NEXT_STEPS.md` for backend setup.

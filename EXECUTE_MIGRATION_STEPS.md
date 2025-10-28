# HOW TO EXECUTE DATABASE MIGRATION - Step-by-Step

## 🎯 The Quickest Route (Follow These Exact Steps)

### Step 1️⃣: Go to Supabase Dashboard
```
URL: https://app.supabase.com
```
- Login if needed
- Select your project

### Step 2️⃣: Open SQL Editor
```
In left sidebar:
SQL Editor → Click it
```

### Step 3️⃣: Create New Query
```
Click: "New Query" button (top right)
```

### Step 4️⃣: Copy the Script
```
Open this file in your editor:
/scripts/007_add_org_and_roles.sql

Select ALL (Cmd+A)
Copy (Cmd+C)
```

**The script content is:**
```sql
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

### Step 5️⃣: Paste into Supabase
```
In Supabase SQL Editor:
Click in the text area
Paste (Cmd+V)
```

You should see the SQL code appear.

### Step 6️⃣: Run the Query
```
Click: "Run" button (green button, top right)
OR press: Cmd+Enter
```

### Step 7️⃣: Wait for Success ✅
```
You should see:
✓ Query executed successfully

(Usually takes < 1 second)
```

### Step 8️⃣: Verify It Worked
```
In Supabase:
1. Click "Table Editor" (left sidebar)
2. Select "profiles" table
3. Scroll right
4. Check you see these new columns:
   • organisation_name
   • user_role
   • phone_number
   • is_active

5. In left sidebar, check for "admin_users" table
   (Should appear in the tables list)

If you see all of these → ✅ Migration successful!
```

---

## 📺 Visual Walkthrough

```
┌─ Supabase Dashboard ──────────────────────────────────┐
│                                                       │
│  Left Sidebar:              Main Area:               │
│  ├─ Dashboard               ┌─────────────────────┐  │
│  ├─ Table Editor            │ New Query (Click!)  │  │
│  ├─ SQL Editor ◄─ CLICK     │                     │  │
│  │                          │ [Empty editor area] │  │
│  │                          │                     │  │
│  │                          │ [Run button - green]│  │
│  └──                        └─────────────────────┘  │
│                                                       │
│  After clicking SQL Editor, you'll see:              │
│  - "New Query" button appears                        │
│  - Empty text editor area                            │
│  - "Run" button ready to execute                     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## ⏸️ If You're Getting Confused

### "I don't see SQL Editor"
```
Solution:
1. Refresh the page
2. Make sure you're logged into Supabase
3. Make sure you selected your project
4. Try again
```

### "I don't see New Query button"
```
Solution:
1. Make sure you clicked "SQL Editor" in sidebar
2. Refresh the page
3. The "New Query" button should appear top right
```

### "Where's my connection string?"
```
For reference only (you don't need it for the dashboard):
Supabase Dashboard → Settings → Database
Look for "Connection String" tab
But you DON'T need this for the visual method
```

---

## 🔄 Alternative Methods (If Dashboard Doesn't Work)

### Method A: Using Terminal (if you have psql)
```bash
# 1. Get your connection string:
# Supabase Dashboard → Settings → Database → Connection String (psql)

# 2. Run:
psql "postgresql://[paste-connection-string-here]" < scripts/007_add_org_and_roles.sql

# 3. You should see output like:
# ALTER TABLE
# CREATE TABLE
# CREATE INDEX

# Done! ✅
```

### Method B: Using Supabase CLI
```bash
# 1. Install CLI
npm install -g supabase

# 2. Link to project
supabase link --project-ref [your-project-id]

# 3. Run migration
supabase db push

# Or directly:
supabase db execute -f scripts/007_add_org_and_roles.sql

# Done! ✅
```

---

## 🧪 How to Test It Worked

After running, test with these queries in SQL Editor:

### Test 1: Check new profiles columns
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='profiles' 
  AND column_name IN ('organisation_name', 'user_role', 'phone_number', 'is_active')
ORDER BY column_name;
```

**Expected result:**
```
 column_name      | data_type
──────────────────┼──────────
 is_active        | boolean
 organisation_name| text
 phone_number     | text
 user_role        | text
```

### Test 2: Check admin_users table
```sql
SELECT * FROM admin_users LIMIT 1;
```

**Expected result:**
```
(No rows - empty table is good!)
```

### Test 3: Try creating an admin user
```sql
INSERT INTO admin_users (email, full_name)
VALUES ('test@example.com', 'Test Admin');

-- If no error → ✅ Table works!

-- Clean up:
DELETE FROM admin_users WHERE email = 'test@example.com';
```

---

## ✅ Checklist

Before moving to next steps:

- [ ] Opened https://app.supabase.com
- [ ] Selected your project
- [ ] Opened SQL Editor
- [ ] Created New Query
- [ ] Copied script from /scripts/007_add_org_and_roles.sql
- [ ] Pasted into SQL editor
- [ ] Clicked "Run"
- [ ] Saw success message ✅
- [ ] Verified columns exist in profiles table
- [ ] Verified admin_users table exists

**All checked? Great! Move to step 2 →**

---

## 📖 What to Do Next

Once migration completes:

```
COMPLETED ✅
└─ Database Migration
   (This step)

NEXT UP ⬜
├─ Update RLS Policies
│  Read: USER_MANAGEMENT_NEXT_STEPS.md
│  Section: "REQUIRED - RLS Policies Update"
│
├─ Update Auth Trigger
│  Read: USER_MANAGEMENT_NEXT_STEPS.md
│  Section: "REQUIRED - Middleware Update"
│
└─ Update Middleware
   Read: USER_MANAGEMENT_NEXT_STEPS.md
   Section: "REQUIRED - Middleware Update"
```

All instructions are in: `USER_MANAGEMENT_NEXT_STEPS.md`

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Column already exists" | Safe to ignore - means it was already added |
| "Permission denied" | Ask project admin for access |
| Can't find SQL Editor | Refresh browser & make sure you're logged in |
| Script looks different | Copy from `/scripts/007_add_org_and_roles.sql` again |
| Changes not showing | Refresh browser, wait 5 seconds, try again |
| Query won't run | Check for syntax - paste fresh copy from file |
| Success message never appears | Check error message - may be a permissions issue |

---

## 💡 Pro Tips

1. **Save your SQL Editor** - Supabase auto-saves, so you can reuse this query
2. **Test before production** - Always run on staging database first
3. **Keep backups** - Supabase has automatic backups, but good practice
4. **Small queries first** - Test individual ALTER statements if unsure
5. **Use IF NOT EXISTS** - Migration script includes this, so it's rerunnable

---

## ⏱️ Expected Timeline

```
Action                    Time      Difficulty
──────────────────────────────────────────────
Login to Supabase         1 min     ⭐ Easy
Open SQL Editor          30 sec     ⭐ Easy
Copy script              1 min      ⭐ Easy
Paste into editor        1 min      ⭐ Easy
Run query               30 sec      ⭐ Easy
Verify success           1 min      ⭐ Easy
──────────────────────────────────────────────
TOTAL:                  5 min       ✅ Quick!
```

---

## 🎉 Success!

Once you see "Query executed successfully":

✅ **Your database is updated**  
✅ **Profiles table has new columns**  
✅ **admin_users table is created**  
✅ **Ready for next step**

Now follow: `USER_MANAGEMENT_NEXT_STEPS.md`

---

**Questions? Check:**
- Full guide: `DATABASE_MIGRATION_GUIDE.md`
- Quick reference: `USER_MANAGEMENT_QUICK_REFERENCE.md`
- Next steps: `USER_MANAGEMENT_NEXT_STEPS.md`

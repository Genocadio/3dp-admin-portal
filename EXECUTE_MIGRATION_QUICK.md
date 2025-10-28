# Execute Database Migration - Visual Quick Start

## 🚀 THE FASTEST WAY (2 minutes)

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Open Supabase                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Go to: https://app.supabase.com                         │
│  2. Login with your account                                 │
│  3. Select your project from dropdown                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Open SQL Editor                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Left Sidebar:                                              │
│  ├─ Dashboard                                               │
│  ├─ Table Editor                                            │
│  ├─ SQL Editor  ← CLICK HERE                                │
│  ├─ Auth                                                    │
│  └─ ...                                                     │
│                                                             │
│  You should see empty editor area with "New Query" button   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Create New Query                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Click the "New Query" button                               │
│                                                             │
│  (Optional) Name it: "Add Org and Roles"                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Copy the Migration Script                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  File: /scripts/007_add_org_and_roles.sql                   │
│                                                             │
│  Copy from:                                                 │
│  ┌──────────────────────────────────────────────┐          │
│  │ -- Add new columns to profiles table...      │          │
│  │ alter table if exists public.profiles        │          │
│  │ add column organisation_name text,           │          │
│  │ add column user_role text not null...        │          │
│  │ ... (entire file)                            │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Paste into Editor                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  In Supabase SQL Editor:                                    │
│  1. Click in text area                                      │
│  2. Paste script (Cmd+V)                                    │
│                                                             │
│  You should see the SQL code appear in the editor           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Execute!                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Click the "Run" button                                     │
│  (Or press: Cmd+Enter / Ctrl+Enter)                         │
│                                                             │
│  Watch for success indicator...                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ ✅ SUCCESS!                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Green notification appears:                                │
│  "Query executed successfully"                              │
│                                                             │
│  Your database is now updated!                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 What Gets Created

```
DATABASE CHANGES:
│
├─ PROFILES TABLE (existing)
│  ├─ organisation_name TEXT (NEW)
│  ├─ user_role TEXT (NEW) - default: 'manager'
│  ├─ phone_number TEXT (NEW)
│  └─ is_active BOOLEAN (NEW) - default: true
│
├─ ADMIN_USERS TABLE (NEW)
│  ├─ id UUID (Primary Key)
│  ├─ email TEXT (Unique)
│  ├─ full_name TEXT
│  ├─ created_at TIMESTAMP
│  └─ updated_at TIMESTAMP
│
└─ INDEXES
   └─ idx_admin_users_email (for faster queries)
```

---

## ✅ Verify It Worked

After running the script, verify success:

### Option A: Visual Check (Easy)
```
1. In Supabase, click "Table Editor" (left sidebar)
2. Look for "admin_users" table
   • If you see it → ✅ Migration worked!
   
3. Click "profiles" table
   • Scroll right to see new columns:
   • organisation_name
   • user_role
   • phone_number
   • is_active
   • If you see all 4 → ✅ All good!
```

### Option B: SQL Check (Technical)
```sql
-- Run these queries in SQL Editor to verify:

-- Check new columns in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='profiles' 
ORDER BY ordinal_position DESC 
LIMIT 5;

-- Should return:
-- | column_name      | data_type |
-- | is_active        | boolean   |
-- | phone_number     | text      |
-- | user_role        | text      |
-- | organisation_name| text      |

-- Check admin_users table exists
SELECT * FROM admin_users LIMIT 1;

-- Should return: (empty result, which is expected)
```

---

## 🎯 After Migration: What's Next?

```
┌──────────────────────────────────────────────┐
│ ✅ Step 1: Database Migration (DONE!)        │
│                                              │
│ Next Steps:                                  │
│                                              │
│ ⬜ Step 2: Update RLS Policies               │
│    Location: USER_MANAGEMENT_NEXT_STEPS.md   │
│    Time: ~10 minutes                         │
│                                              │
│ ⬜ Step 3: Update Auth Trigger               │
│    Location: USER_MANAGEMENT_NEXT_STEPS.md   │
│    Time: ~5 minutes                          │
│                                              │
│ ⬜ Step 4: Update Middleware                 │
│    Location: USER_MANAGEMENT_NEXT_STEPS.md   │
│    Time: ~15 minutes                         │
│                                              │
│ ⬜ Step 5: Test Everything                   │
│    Location: USER_MANAGEMENT_IMPLEMENTATION  │
│    Time: ~20 minutes                         │
│                                              │
│ ⬜ Step 6: Deploy to Production              │
│    Time: ~30 minutes                         │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### ❌ Error: "Column already exists"
```
Reason: Migration already ran successfully before
Solution: This is OK - just means data is already set up
Action:  You can safely ignore this error
         The "IF NOT EXISTS" clause prevents duplicates
```

### ❌ Error: "Permission denied"
```
Reason: Your user doesn't have admin access
Solution: 
  1. Ask project owner for admin/superuser role
  2. Or have owner run the migration
  3. Contact Supabase support
```

### ❌ Error: "Syntax error"
```
Reason: Script may have been corrupted in copy/paste
Solution:
  1. Clear the editor (Ctrl+A, Delete)
  2. Copy the script again from: /scripts/007_add_org_and_roles.sql
  3. Paste carefully (Cmd+V or Ctrl+V)
  4. Try running again
```

### ❌ Changes not showing in Table Editor
```
Reason: Browser cache or connection delay
Solution:
  1. Refresh page (Cmd+R or Ctrl+R)
  2. Wait 5 seconds
  3. Click "Table Editor" again
  4. Select "profiles" table
  5. Columns should now be visible
```

### ❌ Query doesn't show as successful
```
Reason: Network timeout or query error
Solution:
  1. Check the error message
  2. Copy error text
  3. Refer to troubleshooting above
  4. Or contact support with error message
```

---

## 📞 Quick Support

### Still Can't Find the SQL Editor?
```
Path in Supabase Dashboard:
Home (top-left logo)
    └─ SQL Editor (left sidebar)
    
If you don't see "SQL Editor":
  1. Refresh the page
  2. Logout and login again
  3. Or try different browser
```

### Lost Your Script?
```
Location: /scripts/007_add_org_and_roles.sql

Or copy this:

alter table if exists public.profiles
add column organisation_name text,
add column user_role text not null default 'manager' check (user_role in ('manager', 'ceo', 'accountant', 'other')),
add column phone_number text,
add column is_active boolean not null default true;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_admin_users_email on public.admin_users(email);
```

### Need Command Line?
```bash
# If you have psql installed:
psql [your-connection-string] < scripts/007_add_org_and_roles.sql

# Get connection string from:
# Supabase → Settings → Database → Connection String (psql tab)
```

---

## ⏱️ Timeline

```
Action                      Time      Status
─────────────────────────────────────────────
1. Open Supabase             1 min    ⏳ Easy
2. Navigate to SQL Editor    30 sec   ⏳ Easy
3. Copy/paste script         1 min    ⏳ Easy
4. Execute script            30 sec   ⏳ Auto
5. Verify success            1 min    ⏳ Easy
─────────────────────────────────────────────
TOTAL:                       ~4 min   ✅ DONE!
```

---

## 🎉 You're Done With Step 1!

Once the migration completes successfully:

```
✅ Database updated
✅ New columns added to profiles
✅ admin_users table created
✅ Indexes created

Next: Follow USER_MANAGEMENT_NEXT_STEPS.md for backend setup
```

---

**Need help? Check the full guide: DATABASE_MIGRATION_GUIDE.md**

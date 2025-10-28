# DATABASE MIGRATION - COMPLETE GUIDE

## 📌 QUICK ANSWER: How to Execute

### The Fastest Way (2-3 minutes):

```
1. Open: https://app.supabase.com
2. Click: "SQL Editor" (left sidebar)
3. Click: "New Query"
4. Copy this SQL:
   
   -- From: /scripts/007_add_org_and_roles.sql
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

5. Paste: (Cmd+V)
6. Click: "Run" button
7. See: "✓ Query executed successfully"
8. Done! ✅
```

---

## 📚 DOCUMENTATION FILES

We've created several guides for you:

### For Different Needs:

| Document | Purpose | Time |
|----------|---------|------|
| **MIGRATION_SCRIPT_READY.md** | Copy-paste ready SQL | 30 sec |
| **EXECUTE_MIGRATION_STEPS.md** | Detailed step-by-step | 5 min |
| **EXECUTE_MIGRATION_QUICK.md** | Visual quick guide | 5 min |
| **DATABASE_MIGRATION_GUIDE.md** | Complete reference | 10 min |
| **USER_MANAGEMENT_NEXT_STEPS.md** | Backend setup after | 30 min |

### Pick One Based on Your Style:

- **Visual learner?** → Read `EXECUTE_MIGRATION_QUICK.md`
- **In a hurry?** → Read `MIGRATION_SCRIPT_READY.md`
- **Want details?** → Read `DATABASE_MIGRATION_GUIDE.md`
- **Step-by-step?** → Read `EXECUTE_MIGRATION_STEPS.md`

---

## 🎯 THREE WAYS TO EXECUTE

### Option 1: Supabase Dashboard (Easiest) ✅ RECOMMENDED

```bash
1. Dashboard: https://app.supabase.com
2. SQL Editor → New Query
3. Paste script (see above)
4. Run
5. Done!
```

**Pros:**
- No terminal knowledge needed
- No extra tools required
- Visual feedback
- Easy to verify results

**Time:** 2-3 minutes

---

### Option 2: Terminal with psql

```bash
# Get connection string from:
# Supabase → Settings → Database → Connection String (psql)

psql "postgresql://[your-connection-string]" < scripts/007_add_org_and_roles.sql
```

**Pros:**
- Automation-friendly
- Can script deployments
- Faster for repeated runs

**Cons:**
- Need to install psql
- Need connection string

**Time:** 1 minute (if setup)

---

### Option 3: Supabase CLI

```bash
# Install
npm install -g supabase

# Link to project
supabase link --project-ref [your-project-id]

# Execute
supabase db execute -f scripts/007_add_org_and_roles.sql
```

**Pros:**
- Works across projects
- Integrates with CI/CD
- Modern tool

**Cons:**
- Requires Node.js installed
- Extra setup step

**Time:** 5 minutes (first time), 1 minute (after)

---

## ✅ VERIFICATION

After running, verify success:

### Visual Verification (Easiest):
```
1. Supabase Dashboard
2. Table Editor (left sidebar)
3. Select "profiles" table
4. Scroll right → see new columns?
   ✅ organisation_name
   ✅ user_role
   ✅ phone_number
   ✅ is_active
5. See "admin_users" in table list?
   ✅ Yes? All good!
```

### SQL Verification:
```sql
-- Run in SQL Editor:
SELECT COUNT(*) FROM admin_users;
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('organisation_name', 'user_role', 'phone_number', 'is_active');
```

Both should return without errors = ✅ Success

---

## 🚨 TROUBLESHOOTING

### "Column already exists"
- **Reason:** You already ran the migration
- **Solution:** Safe to ignore - the `IF NOT EXISTS` prevents duplicates
- **Action:** Continue to next step

### "Permission denied"
- **Reason:** User doesn't have enough permissions
- **Solution:** 
  - Ask project admin for superuser role
  - Or have owner run the migration
- **Action:** Contact project owner

### "Syntax error"
- **Reason:** Script was corrupted in copy/paste
- **Solution:** 
  - Clear editor (select all, delete)
  - Copy fresh from: `/scripts/007_add_org_and_roles.sql`
  - Try again
- **Action:** Recopy and retry

### "Changes not showing"
- **Reason:** Browser cache
- **Solution:** 
  - Refresh page (Cmd+R)
  - Wait 5 seconds
  - Close and reopen Supabase
- **Action:** Try again

---

## 📋 WHAT'S BEING ADDED

### To `profiles` table:
```
organisation_name  TEXT         (new field for company name)
user_role          TEXT         (new field: manager/ceo/accountant/other)
phone_number       TEXT         (new field for contact)
is_active          BOOLEAN      (new field for soft-delete)
```

### New table `admin_users`:
```
id                 UUID         (primary key)
email              TEXT         (unique - for login)
full_name          TEXT         (admin name)
created_at         TIMESTAMP    (when created)
updated_at         TIMESTAMP    (when updated)
```

### New index:
```
idx_admin_users_email  (for faster email lookups)
```

---

## ⏱️ TIME ESTIMATES

| Method | Setup Time | Execution Time | Total |
|--------|-----------|-----------------|-------|
| Dashboard | 0 min | 2-3 min | 2-3 min ✅ |
| psql | 5 min | 1 min | 6 min |
| Supabase CLI | 5 min | 1 min | 6 min |

---

## 🔄 AFTER MIGRATION

Once the database migration completes successfully:

### Immediate Next Steps:
1. **Update RLS Policies** (~10 min)
2. **Update Auth Trigger** (~5 min)
3. **Update Middleware** (~15 min)
4. **Test Everything** (~20 min)

### Documentation:
All these steps are explained in:
📖 **USER_MANAGEMENT_NEXT_STEPS.md**

---

## 📖 WHICH GUIDE TO READ

Based on what you need:

### "I want to run it NOW"
→ Read: `MIGRATION_SCRIPT_READY.md` (copy-paste ready)

### "I want step-by-step visual instructions"
→ Read: `EXECUTE_MIGRATION_QUICK.md`

### "I want exact numbered steps"
→ Read: `EXECUTE_MIGRATION_STEPS.md`

### "I want to understand everything"
→ Read: `DATABASE_MIGRATION_GUIDE.md`

### "I want to set up backend after"
→ Read: `USER_MANAGEMENT_NEXT_STEPS.md`

---

## 🎯 RECOMMENDED PATH

```
START HERE
    ↓
Read: MIGRATION_SCRIPT_READY.md (30 sec)
    ↓
Copy the SQL
    ↓
Run in Supabase
    ↓
See ✅ "Query executed successfully"
    ↓
Verify in Table Editor
    ↓
DONE! Move to: USER_MANAGEMENT_NEXT_STEPS.md
```

---

## 💡 PRO TIPS

1. **Always test first** - Use a staging database if available
2. **Keep backups** - Supabase has auto-backups, but good practice
3. **Document changes** - Keep notes of what was run and when
4. **Repeat is safe** - Script uses `IF NOT EXISTS`, so no duplicates
5. **Check error messages** - They usually explain what went wrong

---

## 🆘 NEED HELP?

### Script Issue?
→ Check: `DATABASE_MIGRATION_GUIDE.md` → Troubleshooting

### Stuck?
→ Check: `EXECUTE_MIGRATION_STEPS.md` → "Still Can't Find..."

### Connection Problem?
→ Check: `DATABASE_MIGRATION_GUIDE.md` → "Permission denied"

### Next Steps After?
→ Read: `USER_MANAGEMENT_NEXT_STEPS.md`

---

## ✅ SUCCESS CHECKLIST

Before moving on:

- [ ] Opened Supabase dashboard
- [ ] Found SQL Editor
- [ ] Copied the migration script
- [ ] Pasted into editor
- [ ] Clicked Run
- [ ] Saw success message ✅
- [ ] Verified new columns in profiles table
- [ ] Verified admin_users table exists
- [ ] Ready to move to next steps

---

## 🎉 YOU'RE READY!

Everything you need is set up:

✅ Database migration script ready  
✅ Multiple execution methods documented  
✅ Verification procedures provided  
✅ Troubleshooting guide included  
✅ Next steps clearly defined  

**Pick your method and execute!**

---

## 📞 QUICK REFERENCE LINKS

- **Copy-paste script:** `MIGRATION_SCRIPT_READY.md`
- **Visual guide:** `EXECUTE_MIGRATION_QUICK.md`
- **Step-by-step:** `EXECUTE_MIGRATION_STEPS.md`
- **Full guide:** `DATABASE_MIGRATION_GUIDE.md`
- **What's next:** `USER_MANAGEMENT_NEXT_STEPS.md`

---

**Happy database migration! 🚀**

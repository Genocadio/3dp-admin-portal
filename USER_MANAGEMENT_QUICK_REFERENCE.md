# User Management System - Quick Reference Guide

## 🎯 Quick Links

### User Flows
| Action | URL/Component | Status |
|--------|---------------|--------|
| Sign up | `/auth/sign-up` | ✅ Ready |
| Login | `/auth/login` | ✅ Works |
| View Profile | `/profile` | ✅ Ready |
| Edit Profile | `/profile` | ✅ Ready |
| Admin Panel | `/admin` | ✅ Ready |
| Manage Users | `/admin` → Users tab | ✅ Ready |

### New Features Checklist
| Feature | Component | Status |
|---------|-----------|--------|
| Organisation Name field | sign-up | ✅ Ready |
| User Role dropdown | sign-up | ✅ Ready |
| Profile page | /profile | ✅ Ready |
| Edit profile fields | /profile | ✅ Ready |
| Avatar menu | header | ✅ Ready |
| Company user list | admin/users | ✅ Ready |
| Create admin user | admin/users | ✅ Ready |
| Delete users | admin/users | ✅ Ready |

---

## 📁 Key Files Location

### Frontend Components
```
components/
├── profile-avatar-menu.tsx          (NEW - Avatar dropdown)
├── user-management.tsx               (NEW - Admin user management)
├── user-dashboard.tsx                (UPDATED - Uses avatar menu)
└── admin-dashboard.tsx               (UPDATED - Uses avatar menu)

app/
├── profile/page.tsx                  (NEW - Profile management)
└── auth/sign-up/page.tsx            (UPDATED - Org & role fields)

lib/
└── types.ts                          (UPDATED - New types)

scripts/
└── 007_add_org_and_roles.sql        (NEW - Database migration)
```

---

## 🔐 User Types

### Company User
- **Created via**: Sign-up page
- **Required fields**: Name, Org, Role, Email, Password
- **Dashboard**: `/dashboard`
- **Permissions**: View applications, submit forms, view own profile
- **Roles**: Manager, CEO, Accountant, Other

### Admin User
- **Created via**: Admin → Users tab → Create Admin User
- **Required fields**: Name, Email only
- **Dashboard**: `/admin`
- **Permissions**: All (create apps, review submissions, manage users)
- **Password**: Set separately via Supabase or email link

---

## 💾 Database Changes

### Run This SQL
```bash
# File: /scripts/007_add_org_and_roles.sql
```

### Columns Added to `profiles`
```sql
organisation_name  TEXT
user_role          TEXT DEFAULT 'manager' 
                   CHECK (user_role IN ('manager', 'ceo', 'accountant', 'other'))
phone_number       TEXT
is_active          BOOLEAN DEFAULT true
```

### New Table
```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  created_at timestamp,
  updated_at timestamp
)
```

---

## 🎨 UI Components Used

### Imports Needed
```typescript
import { ProfileAvatarMenu } from "@/components/profile-avatar-menu"
import { UserManagement } from "@/components/user-management"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
```

### Avatar Styles
```tsx
// Avatar with initials
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
  {initials}
</div>
```

---

## 🔗 Component Integration

### In Headers (Replace Logout)
```tsx
// OLD:
<Button onClick={logout}><LogOut className="w-4 h-4" /> Logout</Button>

// NEW:
<ProfileAvatarMenu />
```

### In Admin Dashboard
```tsx
<Tabs>
  <TabsContent value="users">
    <UserManagement />
  </TabsContent>
</Tabs>
```

### In Sign-Up Form
```tsx
<Select value={userRole} onValueChange={setUserRole}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="manager">Manager</SelectItem>
    <SelectItem value="ceo">CEO</SelectItem>
    <SelectItem value="accountant">Accountant</SelectItem>
    <SelectItem value="other">Other</SelectItem>
  </SelectContent>
</Select>
```

---

## ✅ Testing Quick Checklist

### Registration
- [ ] Sign up with all fields filled
- [ ] Organisation name required
- [ ] Role selection works
- [ ] Email validation works
- [ ] Password confirmation works

### Profile
- [ ] Can access `/profile`
- [ ] Avatar shows initials
- [ ] Can edit name
- [ ] Can edit organisation
- [ ] Can edit role
- [ ] Can edit phone
- [ ] Changes save
- [ ] Changes persist

### Avatar Menu
- [ ] Avatar appears in header
- [ ] Click opens dropdown
- [ ] Shows user name/email
- [ ] "Manage Profile" link works
- [ ] "Logout" signs out

### Admin Users
- [ ] Can view company users
- [ ] Can view admin users
- [ ] Can create new admin
- [ ] Can delete user
- [ ] Deletion shows confirm dialog
- [ ] Deleted user can't login

---

## 🛠️ Backend Setup Required

### Step 1: Database
```bash
Run: /scripts/007_add_org_and_roles.sql
```

### Step 2: Auth Trigger
Update in Supabase → Functions:
```sql
-- Captures org_name and user_role from auth metadata
handle_new_user() should include these in INSERT
```

### Step 3: RLS Policies
Add policies for:
- profiles: Users can only read/update own
- admin_users: Only admins can access

### Step 4: Middleware
Update `middleware.ts`:
```typescript
// Check is_active status
// Route based on role (admin → /admin, user → /dashboard)
```

---

## 📊 Data Flow Diagram

### Sign-Up Flow
```
Sign-Up Page
    ↓
[Name, Org, Role, Email, Password]
    ↓
auth.signUp() with metadata
    ↓
auth.users created
    ↓
handle_new_user() trigger fires
    ↓
profiles record created with org + role
    ↓
Email confirmation sent
```

### Login Flow
```
Login Page [Email + Password]
    ↓
auth.signIn()
    ↓
Check: is_active = true? (if no → error)
    ↓
Get role from profiles
    ↓
admin role → /admin
user role → /dashboard
```

### Profile Edit Flow
```
/profile page
    ↓
Load current profile data
    ↓
Edit fields
    ↓
[Save Changes] clicked
    ↓
Update profiles table
    ↓
Success message
```

### Admin User Creation
```
Admin Dashboard → Users tab
    ↓
[+ Create Admin User] clicked
    ↓
Dialog shows (Name + Email)
    ↓
[Create Admin] clicked
    ↓
Insert into admin_users table
    ↓
Success message
    ↓
Admin shares login credentials
```

---

## 🔍 Troubleshooting

### Avatar not showing initials?
- Check user.full_name is populated
- Verify ProfileAvatarMenu is imported
- Check component is in correct location

### Profile fields not saving?
- Check RLS allows profile updates
- Verify user ID is correct
- Check for auth token validity

### Can't create admin user?
- Verify logged-in user is admin
- Check admin_users table exists
- Check RLS policy allows creation

### User can still login after deactivation?
- Check middleware validates is_active
- Verify is_active = false was set
- Check auth token hasn't expired

---

## 📝 Type Definitions

### Profile Type
```typescript
type Profile = {
  id: string
  email: string
  full_name: string | null
  role: "user" | "admin"
  organisation_name: string | null
  user_role: "manager" | "ceo" | "accountant" | "other"
  phone_number: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### AdminUser Type
```typescript
type AdminUser = {
  id: string
  email: string
  full_name: string
  created_at: string
  updated_at: string
}
```

---

## 🎓 Learning Resources

### Files to Read
1. `USER_MANAGEMENT_IMPLEMENTATION.md` - Full details
2. `USER_MANAGEMENT_ARCHITECTURE.md` - Visual overview
3. `USER_MANAGEMENT_NEXT_STEPS.md` - Backend setup
4. `USER_MANAGEMENT_COMPLETION.md` - Summary

### Component Files
- `profile-avatar-menu.tsx` - See dropdown implementation
- `user-management.tsx` - See table + dialog implementation
- `profile/page.tsx` - See form handling pattern

---

## 🚀 Deployment Steps

1. **Review**: Check all files compile ✅
2. **Database**: Run migration script
3. **RLS**: Update access policies
4. **Auth**: Update trigger and middleware
5. **Test**: Follow testing checklist
6. **Deploy**: Push to production
7. **Monitor**: Watch for errors first 24h

---

## 📞 Support

### Questions About...
- **Frontend**: Check component files
- **Database**: See SQL script
- **Architecture**: Read architecture doc
- **Implementation**: Read next steps doc
- **Types**: Check lib/types.ts

### Issues?
- Compile errors? Run `npm run build`
- Type errors? Check types.ts
- Runtime errors? Check middleware.ts
- Database errors? Check SQL script

---

**Last Updated**: Today
**Status**: ✅ Frontend complete, backend setup needed
**Version**: 1.0

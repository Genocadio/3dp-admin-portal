# User Management System - Architecture Overview

## User Registration & Onboarding

```
Sign Up Page (/auth/sign-up)
├── Full Name (required)
├── Organisation Name (required) ← NEW
├── User Role Dropdown (required) ← NEW
│   ├── Manager
│   ├── CEO
│   ├── Accountant
│   └── Other
├── Email (required)
└── Password (required)
    ↓
    Creates: auth.users (role='user') + profiles record
```

## User Navigation - Header Avatar Menu

```
Old: [Button: Logout]

New: [Avatar Badge with Initials]
    └─ Dropdown Menu
       ├─ User Name & Email
       ├─ ────────────────
       ├─ Manage Profile → /profile
       ├─ ────────────────
       └─ Logout
```

## User Profile Management (`/profile`)

```
Profile Page Layout:
┌─────────────────────────────────────────┐
│ [Avatar Card]         [Edit Form Card]  │
├──────────────┼──────────────────────────┤
│ Initials     │ Full Name [editable]     │
│ Avatar       │ Email [read-only]        │
│ ────────     │ Organisation [editable]  │
│ Name         │ Role [dropdown]          │
│ Email        │ Phone [editable]         │
│ Org          │ ────────────────         │
│ Role         │ [Save Changes] [Reset]   │
└─────────────────────────────────────────┘
```

## Admin Portal - User Management Tab

```
Admin Dashboard
├── Overview Tab
├── Applications Tab
├── Submissions Tab
└── Users Tab (NEW) ─────┐
                          │
                    ┌─────┴─────┐
                    │            │
            Company Users    Admin Users
            Tab              Tab
            
    ┌──────────────────┐  ┌──────────────────┐
    │ Company Users    │  │ Admin Users      │
    ├──────────────────┤  ├──────────────────┤
    │ Name      │Email │  │ Name      │Email │
    │ Org       │Role  │  │ Created   │      │
    │ Join Date │ Delete│  │ Delete    │      │
    │           │      │  │           │      │
    └──────────────────┘  └──────────────────┘
                          ↓
                    [+ Create Admin User]
                    Dialog:
                    - Full Name
                    - Email
```

## Data Model

```
Database Tables:

profiles (existing + new fields)
├── id (uuid) [FK: auth.users]
├── email
├── full_name
├── role ('user' | 'admin')
├── organisation_name ← NEW
├── user_role ← NEW ('manager'|'ceo'|'accountant'|'other')
├── phone_number ← NEW
├── is_active ← NEW (boolean, default true)
├── created_at
└── updated_at

admin_users ← NEW TABLE
├── id (uuid)
├── email (unique)
├── full_name
├── created_at
└── updated_at
```

## Authentication Flows

### Regular User Flow
```
Sign Up → profiles.role = 'user'
          profiles.organisation_name = input
          profiles.user_role = input
              ↓
         Login with email/password
         Check: is_active = true
              ↓
         Access: Dashboard, Applications, Profile
```

### Admin User Flow
```
Admin Creates User → admin_users record created
                    (name + email only)
                        ↓
                  Admin shares credentials
                        ↓
                  New admin logs in
                  Check: role = 'admin'
                        ↓
                  Access: Admin Portal
                  Can: Create apps, Review submissions, Manage users
```

### Deactivation
```
Admin Delete Action
    ↓
Company User: profiles.is_active = false (soft delete)
            → User cannot login
            → Record preserved
            
Admin User: DELETE from admin_users (hard delete)
          → User cannot login
          → Permanent removal
```

## Components Hierarchy

```
App
├── Auth Pages
│   └── /auth/sign-up (Enhanced)
│
├── User Pages
│   ├── /dashboard (UserDashboard)
│   │   ├── ProfileAvatarMenu (NEW)
│   │   ├── ApplicationSubmission
│   │   └── SubmissionDetailView
│   │
│   └── /profile (NEW - Profile Management)
│
└── Admin Pages
    ├── /admin (AdminDashboard)
    │   ├── ProfileAvatarMenu (NEW)
    │   ├── Overview Tab
    │   ├── Applications Tab
    │   ├── Submissions Tab
    │   └── Users Tab (UserManagement - NEW)
    │
    └── UserManagement (NEW)
        ├── Company Users Tab
        └── Admin Users Tab
```

## Key Features Comparison

| Feature | Company User | Admin User |
|---------|---|---|
| Registration | Self-register with org | Created by admin |
| Profile Editing | Can edit all fields | Limited (name only?) |
| Can Create Apps | ❌ | ✅ |
| Can Review Submissions | ❌ | ✅ |
| Can Manage Users | ❌ | ✅ |
| Can View Other Users | ❌ | ✅ |
| Deactivation | Soft delete (reversible) | Hard delete (permanent) |

## Next Steps

### 1. Database Setup
```bash
# Run migration script
Run: /scripts/007_add_org_and_roles.sql
```

### 2. RLS Policy Updates
- Update policies to check `is_active = true`
- Restrict admin_users table access
- Ensure profile privacy

### 3. Auth Middleware
- Update `middleware.ts` to check role and is_active
- Route users based on role
- Validate admin access

### 4. Email Integration (Optional)
- Send welcome email to new admin users
- Send profile update confirmations
- Notify on deactivation

### 5. Finalization
- Test all user flows
- Verify role-based access control
- Test soft delete/reactivation
- Confirm avatar displays correctly

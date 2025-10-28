# User Management - Next Implementation Steps

## REQUIRED - Database Setup

### Step 1: Run Migration
Execute the migration script to add new columns and tables:

```bash
# In your Supabase SQL editor, run:
# /scripts/007_add_org_and_roles.sql

ALTER TABLE profiles ADD COLUMN organisation_name text;
ALTER TABLE profiles ADD COLUMN user_role text NOT NULL DEFAULT 'manager';
ALTER TABLE profiles ADD COLUMN phone_number text;
ALTER TABLE profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE TABLE admin_users (...);
CREATE INDEX idx_admin_users_email ON admin_users(email);
```

### Step 2: Update Auth Trigger
Modify the `handle_new_user()` trigger to capture auth metadata:

```sql
-- Update existing trigger to include new fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, organisation_name, user_role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'role',
    new.raw_user_meta_data->>'organisation_name',
    new.raw_user_meta_data->>'user_role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## REQUIRED - RLS Policies Update

### Step 1: Update Profiles RLS
```sql
-- Ensure profiles only show active users in public queries
ALTER POLICY "Public read profiles" ON profiles
USING (is_active = true OR auth.uid() = id);

-- Add policy for users to update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 2: Create Admin Users RLS
```sql
-- Only admins can read admin_users
CREATE POLICY "Admins can read admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can create admin users
CREATE POLICY "Admins can create admin users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete admin users
CREATE POLICY "Admins can delete admin users" ON admin_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

## REQUIRED - Middleware Update

### Step 1: Update Auth Middleware (`middleware.ts`)
```typescript
// Add check for is_active status
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    // ... existing config
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user is active
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active, role")
      .eq("id", user.id)
      .single();

    if (profile && !profile.is_active) {
      // Redirect deactivated users to login
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Route based on role
    if (profile?.role === "admin" && !request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (profile?.role === "user" && request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabase.response;
}
```

## REQUIRED - Create Admin Users Management API

### Step 1: Create API Routes for User Management

Create `/app/api/admin/users/route.ts`:
```typescript
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET - List users
export async function GET(request: Request) {
  const supabase = createServerClient();
  
  // Verify admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Query logic here
}

// POST - Create admin user
export async function POST(request: Request) {
  // Create admin logic
}

// DELETE - Deactivate/delete user
export async function DELETE(request: Request) {
  // Delete logic
}
```

## REQUIRED - Login Flow Update

### Step 1: Check Admin Status on Login
Update login page to handle admin users:

```typescript
// In auth flow after login
const { data: profile } = await supabase
  .from("profiles")
  .select("role, is_active")
  .eq("id", user.id)
  .single();

if (!profile.is_active) {
  throw new Error("Your account has been deactivated");
}

if (profile.role === "admin") {
  router.push("/admin");
} else {
  router.push("/dashboard");
}
```

## REQUIRED - Update Auth Trigger for Admin Users

Admin users created via the portal need special handling:

```sql
-- Create trigger to handle admin user creation
CREATE OR REPLACE FUNCTION handle_new_admin_user()
RETURNS trigger AS $$
BEGIN
  -- When admin_users record is created, an auth record should be created separately
  -- This is manual for security - admin creates auth account via Supabase UI or API
  -- Then links it by email
  RETURN new;
END;
$$ LANGUAGE plpgsql;
```

## OPTIONAL - Email Service Integration

### Email Templates Needed
1. **Admin Welcome Email**
   - Include login link
   - Temporary password
   - Instructions to set permanent password

2. **Account Deactivation Notification**
   - Notify user their account is deactivated
   - Contact information for reactivation

3. **Profile Update Confirmation**
   - Confirm profile changes
   - Display new information

## OPTIONAL - Two-Factor Authentication

Consider adding 2FA for admin accounts:
- SMS or email-based OTP
- TOTP apps (Google Authenticator)
- Security keys

## Testing Checklist

### User Registration
- [ ] Sign up new user with organisation and role
- [ ] Verify profile record created with correct data
- [ ] Test with all role options (manager, ceo, accountant, other)
- [ ] Try duplicate email (should fail)
- [ ] Try missing required fields (should fail)

### Profile Management
- [ ] Edit own profile fields
- [ ] Try to edit other user profile (should fail)
- [ ] Update organisation name
- [ ] Update phone number
- [ ] Change role
- [ ] Verify changes persist

### Avatar Menu
- [ ] Avatar shows correct initials
- [ ] Click opens dropdown menu
- [ ] "Manage Profile" navigates to profile page
- [ ] "Logout" signs out and redirects to login
- [ ] Avatar visible on all pages

### Admin User Management
- [ ] View all company users in table
- [ ] View all admin users in table
- [ ] Create new admin user (name + email)
- [ ] Delete company user (marked as inactive)
- [ ] Deleted company user cannot login
- [ ] Delete admin user (hard delete)
- [ ] Deleted admin user cannot login
- [ ] Pagination works if many users
- [ ] Search/filter users (if implemented)

### Access Control
- [ ] Regular user cannot access /admin
- [ ] Admin can access /admin
- [ ] Regular user can only see own data
- [ ] Admin can see all user data
- [ ] Deactivated user cannot access dashboard
- [ ] Deactivated user cannot login

### Role-Based Routing
- [ ] Admin logged in → redirects to /admin
- [ ] User logged in → redirects to /dashboard
- [ ] Direct URL access respects role

## Deployment Checklist

- [ ] Database migration applied to production
- [ ] RLS policies updated in production
- [ ] Middleware updated and tested
- [ ] API routes created and tested
- [ ] Auth trigger updated
- [ ] Email service configured (if applicable)
- [ ] Admin accounts created for team
- [ ] Test user created for acceptance testing
- [ ] Documentation updated for team
- [ ] Monitor error logs for first week
- [ ] Gather user feedback

## Known Limitations

1. **Admin User Password Reset**: Currently admin users created with name/email only - password management should be handled via Supabase admin panel or API
2. **Bulk Operations**: User management UI works with individual operations - bulk delete/export not yet implemented
3. **Audit Log**: No audit trail of who deleted which user or when
4. **User Search**: Current implementation loads all users - should add search/pagination for large datasets

## Future Enhancements

1. **Bulk User Import**: CSV import for multiple users
2. **User Activity Tracking**: Log all user actions
3. **Advanced Filters**: Search, sort, filter users
4. **Bulk Operations**: Delete/deactivate multiple users at once
5. **User Roles**: More granular role-based permissions
6. **Invite System**: Admin sends invite links instead of creating users
7. **SSO Integration**: OAuth2/SAML for enterprise customers
8. **2FA**: Two-factor authentication for accounts
9. **User Audit Log**: Track all user management actions
10. **Backup/Restore**: User data export/import capabilities

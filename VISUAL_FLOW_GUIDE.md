# Visual Flow Guide

## 1. Forgot Password Flow

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                           │
│                                                         │
│  Email: [_______________]                              │
│  Password: [______________]                            │
│                                                         │
│  [Login Button]                                         │
│                   ← Forgot password? (NEW!)             │
└─────────────────────────────────────────────────────────┘
                        ↓ Click
┌─────────────────────────────────────────────────────────┐
│            FORGOT PASSWORD PAGE (NEW)                   │
│                                                         │
│  Enter your email address:                              │
│  Email: [user@example.com]                              │
│                                                         │
│  [Send Reset Code]                                      │
│                                                         │
│  ← Back to Login                                        │
└─────────────────────────────────────────────────────────┘
                        ↓
            System generates 6-digit code
            Email sent to user@example.com
            (Code visible in console for dev)
                        ↓
┌─────────────────────────────────────────────────────────┐
│           RESET PASSWORD PAGE (NEW)                     │
│                                                         │
│  Email: user@example.com (read-only)                    │
│  Verification Code: [123456]                            │
│  New Password: [_______________]                        │
│  Confirm Password: [_______________]                    │
│                                                         │
│  [Reset Password]                                       │
│                   ← Back to Login                        │
└─────────────────────────────────────────────────────────┘
                        ↓
            Code verified
            Password updated
            Auto-redirect to login
                        ↓
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                           │
│        ✓ Login with new password                        │
│           Now works!                                    │
└─────────────────────────────────────────────────────────┘
```

## 2. Admin User Creation & Credentials Flow

```
┌─────────────────────────────────────────────────────────┐
│              ADMIN DASHBOARD - USERS                    │
│                                                         │
│  [Admin Users Tab]                                      │
│                                                         │
│  [+ Create Admin User] (button)                         │
└─────────────────────────────────────────────────────────┘
                        ↓ Click
┌─────────────────────────────────────────────────────────┐
│          CREATE ADMIN USER DIALOG                       │
│                                                         │
│  Full Name: [John Doe]                                  │
│  Email Address: [john@example.com]                      │
│                                                         │
│  [Cancel]    [Create Admin]                             │
└─────────────────────────────────────────────────────────┘
                        ↓ Click Create
        ┌─────────────────────────────────────┐
        │ 1. Generate Temp Password (12 chars)│
        │    e.g., xK7@mN2pQr5!Yz            │
        │ 2. Create admin_users record        │
        │ 3. Send Email with credentials      │
        └─────────────────────────────────────┘
                        ↓
            ✓ Admin user created!
        Temporary password sent to john@example.com
                        ↓
┌─────────────────────────────────────────────────────────┐
│              EMAIL RECEIVED                             │
│                                                         │
│  ╔═════════════════════════════════════════╗           │
│  ║   Welcome to Admin Portal               ║           │
│  ║   Your account has been created         ║           │
│  ║                                         ║           │
│  ║   Email: john@example.com               ║           │
│  ║   Password: xK7@mN2pQr5!Yz              ║           │
│  ║                                         ║           │
│  ║   🔒 Change password immediately!      ║           │
│  ║   [Login to Portal]                     ║           │
│  ╚═════════════════════════════════════════╝           │
└─────────────────────────────────────────────────────────┘
                        ↓ Click Login
┌─────────────────────────────────────────────────────────┐
│                    LOGIN PAGE                           │
│                                                         │
│  Email: john@example.com                                │
│  Password: xK7@mN2pQr5!Yz                               │
│                                                         │
│  [Login]                                                │
└─────────────────────────────────────────────────────────┘
                        ↓ Login Success
┌─────────────────────────────────────────────────────────┐
│           PROFILE - PASSWORD CHANGE                     │
│                                                         │
│  [Profile Tab] [Password Tab] ← AUTO-OPEN              │
│                                                         │
│  Current Password: [_______]                            │
│  New Password: [_______]                                │
│  Confirm: [_______]                                     │
│                                                         │
│  [Change Password]                                      │
│                                                         │
│  ✓ Password changed successfully                        │
└─────────────────────────────────────────────────────────┘
```

## 3. Code & Email Generation Timeline

```
User Action                    Backend Processing              Output
─────────────────────────────────────────────────────────────────────────

Submit Email             ─→  Verify email exists          
                         ─→  Generate Code (random)        
                         ─→  Set expiration (15 min)        
                         ─→  Store in memory
                         ─→  Create email HTML             ← Email Sent
                         ─→  Return success
                                         ✓ Code: 123456 (dev mode)

─────────────────────────────────────────────────────────────────────────

Admin Creates            ─→  Verify admin auth
New Admin                ─→  Generate Temp Password       ← Temp Pass: xK7@mN2p...
                         ─→  Create DB record in admin_users
                         ─→  Create email HTML
                         ─→  Send email                   ← Email Sent
                         ─→  Return success

─────────────────────────────────────────────────────────────────────────

User Submits             ─→  Verify code (check: exists, expiry, attempts)
Reset Code               ─→  Check attempt count (max 3)
                         ─→  If valid: Update password in auth.users
                         ─→  Clear reset code from memory
                         ─→  Return success                ← Redirect to login
                         ─→ (If invalid: increment attempts)

```

## 4. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER SYSTEM                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SUPABASE AUTH (auth.users)                                 │ │
│  │ - Handles user authentication                              │ │
│  │ - Stores user passwords securely                           │ │
│  │ - Session management                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↑ ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ NEXT.JS API ROUTES (/api/auth/password/*)                 │ │
│  │ - send-reset-code: Generate code, send email              │ │
│  │ - verify-reset: Check code, update password               │ │
│  │ - change: Update password for logged-in user              │ │
│  │ - generate-temp: Create temp password for admin            │ │
│  │ - send-admin-credentials: Email new admin creds           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↑ ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ IN-MEMORY CODE STORAGE (or DB)                            │ │
│  │ - Reset codes: Map<email, {code, expires, attempts}>      │ │
│  │ - Auto-cleanup every 1 minute                             │ │
│  │ - TTL: 15 minutes per code                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↑ ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ EMAIL SENDER (Console | Resend | SendGrid)                │ │
│  │ - Uses professional HTML templates                        │ │
│  │ - Password reset emails                                   │ │
│  │ - Admin credentials emails                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                           ↑                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FRONTEND PAGES                                             │ │
│  │ - Login page (updated)                                     │ │
│  │ - Forgot password page (existing)                          │ │
│  │ - Reset password page (new)                               │ │
│  │ - Profile page (updated)                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## 5. Error Handling Flow

```
User Action
    ↓
API Receives Request
    ↓
┌─ Validation ──────────────────────────────┐
│ ✗ Invalid email format?      → 400 Error  │
│ ✗ Email not found?           → 400 Error  │
│ ✓ Valid                       → Continue  │
└────────────────────────────────────────────┘
    ↓
┌─ Reset Code Verification ─────────────────┐
│ ✗ Code not found?            → 400 Error  │
│ ✗ Code expired?              → 400 Error  │
│ ✗ Too many attempts (3+)?    → 400 Error  │
│ ✗ Code doesn't match?        → Attempt+1 │
│ ✓ Code valid                 → Continue  │
└────────────────────────────────────────────┘
    ↓
┌─ Password Update ─────────────────────────┐
│ ✗ Password < 8 chars?        → Error     │
│ ✗ Passwords don't match?     → Error     │
│ ✗ DB update fails?           → 500 Error │
│ ✓ Success                    → Clear code│
└────────────────────────────────────────────┘
    ↓
Success / Error Response
```

## 6. Security Model

```
┌────────────────────────────────────────────────────────────┐
│              PASSWORD RESET SECURITY                       │
│                                                            │
│  🔐 Code Generation:                                      │
│     - Cryptographically secure (crypto.randomInt)         │
│     - 6 digits (1,000,000 combinations)                   │
│     - Expires in 15 minutes                               │
│     - Only valid for sending user                         │
│                                                            │
│  🔐 Attempt Limiting:                                     │
│     - Max 3 failed attempts per code                      │
│     - Code deleted after 3 fails                          │
│     - Must request new code                               │
│                                                            │
│  🔐 Password Requirements:                                │
│     - Minimum 8 characters                                │
│     - Must confirm (no typos)                             │
│     - Sent via HTTPS only (production)                    │
│                                                            │
│  🔐 Temporary Passwords:                                  │
│     - 12 characters minimum                               │
│     - Letters + numbers + special chars                   │
│     - Unique per admin                                    │
│     - User forced to change on first login                │
│                                                            │
│  🔐 Email Verification:                                   │
│     - User owns email (confirms receipt)                  │
│     - Code sent only via email                            │
│     - Can't proceed without valid code                    │
└────────────────────────────────────────────────────────────┘
```

## 7. Implementation Checklist (For You)

```
✅ Login Page
   ├─ "Forgot password?" link added
   └─ Navigates to /auth/forgot-password

✅ Forgot Password Page
   ├─ Email input
   ├─ Code generation via API
   └─ Success redirect

✅ Reset Password Page (NEW)
   ├─ Code verification input
   ├─ New password fields
   ├─ Validation
   └─ Password update

✅ Admin Creation
   ├─ Temp password generation
   ├─ Email sending
   └─ User management UI updated

✅ Email System
   ├─ Template generator
   ├─ API endpoint integration
   └─ Console logging for development

✅ API Routes
   ├─ send-reset-code
   ├─ verify-reset
   ├─ change
   ├─ generate-temp
   └─ send-admin-credentials

✅ Documentation
   ├─ PASSWORD_RESET_GUIDE.md
   └─ IMPLEMENTATION_SUMMARY.md
```

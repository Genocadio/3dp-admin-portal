# Password Reset & Admin Credentials Implementation Guide

## Overview

This document outlines the implementation of:
1. **Forgot Password Flow** - Allow users to reset their password via email verification
2. **Admin User Credentials** - Automatically generate and email temporary passwords to new admin users

## Features Implemented

### 1. Login Page Enhancement
- Added "Forgot password?" link in the login form
- Link navigates to `/auth/forgot-password`

### 2. Forgot Password Flow
**File**: `/app/auth/forgot-password/page.tsx`

Features:
- Users enter their email address
- System generates a 6-digit verification code
- Code sent via email (logs to console for now)
- Code valid for 15 minutes
- User redirected to password reset page after submission

### 3. Password Reset Page
**File**: `/app/auth/reset-password/page.tsx`

Features:
- Users enter the 6-digit verification code
- Enter new password (minimum 8 characters)
- Confirm password match validation
- Code verification with attempt limits (max 3 attempts)
- Automatic redirect to login on success

### 4. Admin User Creation with Credentials
**File**: `/components/user-management.tsx`

Features:
- Admin portal users can create new admin accounts
- Automatic temporary password generation (12 characters with special characters)
- Temporary password sent via email
- Email contains:
  - Email address
  - Temporary password
  - Link to login portal
  - Security warning to change password immediately

### 5. Email Templates
**File**: `/lib/email-templates.ts`

Includes professional HTML email templates for:
- **Password Reset**: Beautiful reset code email
- **Admin Credentials**: Secure delivery of temporary admin passwords

Templates include:
- Gradient headers
- Clear visual hierarchy
- Security warnings
- Expiration information
- Call-to-action buttons

## API Endpoints

### POST `/api/auth/password/send-reset-code`
Sends password reset code to user's email

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Reset code sent to email",
  "testCode": "123456" // Only in development
}
```

### POST `/api/auth/password/verify-reset`
Verifies reset code and updates password

**Request:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

### POST `/api/auth/password/change`
Change password for logged-in user

**Request:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### POST `/api/auth/password/generate-temp`
Generate temporary password for new admin

**Response:**
```json
{
  "tempPassword": "aBcD1234!@#$",
  "message": "Temporary password generated. User must change on first login."
}
```

### POST `/api/auth/password/send-admin-credentials`
Send admin credentials email

**Request:**
```json
{
  "email": "admin@example.com",
  "fullName": "John Doe",
  "temporaryPassword": "aBcD1234!@#$"
}
```

**Response:**
```json
{
  "message": "Admin credentials sent successfully"
}
```

## Email Integration

### Current Implementation (Development)
- Emails logged to console
- Test codes visible in API responses
- Perfect for development and testing

### Production Integration
To integrate with a real email service (Resend, SendGrid, etc.):

1. Install email library:
```bash
npm install resend
```

2. Update `sendEmail` function in `/app/api/auth/password/route.ts`:
```typescript
async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@3dp.local',
      to,
      subject,
      html
    })
  } else {
    // Fallback to console logging
    console.log(`Email sent to ${to}: ${subject}`)
  }
}
```

3. Add environment variables:
```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com
```

## Database Integration (Optional)

For production environments with persistent storage, create tables using the migration:

**File**: `/scripts/008_add_password_reset.sql`

Tables created:
1. `password_reset_codes` - Stores active reset codes
2. `admin_credential_logs` - Audit trail for admin credential distribution

Run migration:
```bash
# Using Supabase CLI
supabase db push scripts/008_add_password_reset.sql
```

## Security Considerations

✅ **Implemented:**
- 6-digit verification codes
- 15-minute code expiration
- Attempt limiting (3 failed attempts)
- Automatic code cleanup
- Password minimum 8 characters
- Special characters in temporary passwords
- HTTPS only (in production)

⚠️ **Recommendations for Production:**
- Implement rate limiting on email endpoints
- Add CAPTCHA to forgot password form
- Store reset codes in database with RLS policies
- Use database for persistent code storage
- Implement email verification for new accounts
- Add suspicious activity detection
- Log all password reset attempts
- Consider two-factor authentication

## Testing

### Test Forgot Password Flow
1. Click "Forgot password?" on login page
2. Enter your email
3. Check console logs for verification code
4. Copy code and enter on reset page
5. Enter new password and confirm
6. Login with new password

### Test Admin Credentials
1. Go to Admin Portal > Users > Admin Users tab
2. Click "Create Admin User"
3. Enter name and email
4. Check console logs for temporary password
5. New admin can login with email + temp password
6. Prompted to change password on first login

## Files Modified/Created

### New Files
- `/app/auth/reset-password/page.tsx` - Password reset verification page
- `/lib/email-templates.ts` - Email template generators
- `/scripts/008_add_password_reset.sql` - Database migration

### Modified Files
- `/app/auth/login/page.tsx` - Added "Forgot password?" link
- `/app/api/auth/password/route.ts` - Enhanced with email sending
- `/components/user-management.tsx` - Updated admin creation with credentials

## Next Steps

1. **Email Service Integration** - Integrate with Resend, SendGrid, or similar
2. **Database Setup** - Run migration script for persistent storage
3. **Environment Variables** - Configure email service credentials
4. **Testing** - Thoroughly test all flows
5. **Monitoring** - Set up alerts for failed password resets
6. **Documentation** - Update user documentation with new features

## Architecture Diagram

```
User Login
    ↓
Forgot Password Link
    ↓
Enter Email → API: send-reset-code
    ↓
Email with Code
    ↓
Enter Code → API: verify-reset
    ↓
Update Auth.Users Password
    ↓
Redirect to Login
    ↓
Login with New Password

---

Admin Creates New User
    ↓
Generate Temp Password → API: generate-temp
    ↓
Create Admin Record in DB
    ↓
Send Email → API: send-admin-credentials
    ↓
Email with Credentials
    ↓
New Admin Logs In
    ↓
Prompted to Change Password
```

## Troubleshooting

### Emails Not Showing
- Check browser console for test codes
- Verify email service credentials in `.env.local`
- Check server logs for errors

### Code Expired
- Reset codes expire after 15 minutes
- User must request new code

### Password Change Fails
- Ensure new password is different from current
- Minimum 8 characters required
- Use special characters and numbers

### Admin Credentials Not Sent
- Verify user is authenticated as admin
- Check admin_users table for record creation
- Verify email in request matches created admin email

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Review SQL migration for database issues
3. Verify environment variables are set correctly
4. Check email service configuration

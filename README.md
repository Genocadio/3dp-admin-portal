# 3DP Admin Portal

A comprehensive application management system with Supabase backend, conditional logic, media uploads, and review workflows.

## System Overview

The 3DP Admin Portal is a complete application management platform where:
- **Admins** create applications (like "Tax Evaluation") with categories and questions
- **Users** browse applications, complete them with document uploads, and track review status
- **Review System** allows admins to approve/reject submissions with notes visible to users

## Key Features

### 1. Application-Based Architecture
- Create multiple applications (e.g., "Tax Evaluation", "Business Compliance")
- Each application contains multiple categories
- Each category contains multiple questions
- Applications can be activated/deactivated

### 2. Advanced Question System

#### Question Types:
- **Multiple Choice**: Single selection with point values
- **True/False**: Binary choice questions
- **Checkbox**: Multiple selection questions
- **Text Input**: Free-form text answers
- **Media Upload Only**: Document/file upload questions

#### Conditional Logic:
- Questions can depend on answers from previous questions
- Example: "Upload tax clearance" only shows if user answered "Yes" to "Do you have tax clearance?"
- Supports multiple required answers for complex conditions

#### Media Upload Configurations:
- **None**: No media upload needed
- **Optional**: Users can optionally upload supporting documents
- **Required**: Users MUST upload files to proceed (enforced validation)
- **Answer-Based Uploads**: Upload button only shows for specific answer choices

### 3. Complete Review Workflow
- Admins can review all submissions
- Change status: Pending → In Review → Approved/Rejected
- Add review notes visible to users
- View all uploaded documents and media
- Track missing required uploads

### 4. User Experience
- Browse available applications
- Complete applications with progress tracking
- Upload documents with validation
- View submission status and admin feedback
- Access past submissions and reports

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with Row Level Security
- **File Storage**: Supabase Storage with public access policies

## Database Schema

### Tables:
1. **profiles** - User profiles with roles (admin/user)
2. **applications** - Application definitions
3. **categories** - Categories within applications
4. **questions** - Questions with conditional logic
5. **submissions** - User application submissions
6. **submission_answers** - Individual answers
7. **submission_media** - Uploaded files

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access their own submissions
- Admins have full access to all data
- Automatic profile creation on signup

## Getting Started

### 1. Database Setup

Run the SQL scripts in order in your Supabase SQL Editor:

\`\`\`bash
scripts/001_create_tables.sql      # Create all tables
scripts/002_enable_rls.sql         # Enable Row Level Security
scripts/003_create_functions.sql   # Create helper functions
scripts/004_seed_data.sql          # Add sample data
scripts/005_create_storage_bucket.sql  # Setup file storage
scripts/006_make_admin.sql         # Promote your account to admin
\`\`\`

### 2. Create Your Admin Account

1. Visit `/auth/sign-up`
2. Sign up with your email (e.g., yvesgeno@outlook.com)
3. Run script 006 to promote your account to admin
4. Log out and log back in

### 3. Create Your First Application

1. Login as admin at `/admin`
2. Go to "Applications" tab
3. Click "Create Application"
4. Add categories and questions
5. Configure conditional logic and upload requirements
6. Activate the application

### 4. Test User Flow

1. Sign up as a regular user at `/auth/sign-up`
2. Go to `/dashboard`
3. Select an application
4. Complete the questions
5. Upload required documents
6. Submit and view report

## User Flows

### Admin Flow:
1. **Login** → `/auth/login` (admin credentials)
2. **Dashboard** → `/admin` (view stats and recent activity)
3. **Manage Applications** → Create/edit applications with categories
4. **Build Questions** → Add questions with conditional logic
5. **Review Submissions** → View answers, documents, add notes
6. **Update Status** → Approve/reject with feedback

### User Flow:
1. **Sign Up** → `/auth/sign-up` (create account)
2. **Browse** → `/dashboard` (see available applications)
3. **Apply** → Select application and answer questions
4. **Upload** → Add required documents
5. **Submit** → Complete and view instant report
6. **Track** → Check review status and admin feedback

## Environment Variables

All Supabase environment variables are automatically configured:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- And others...

## Key Components

### Admin Components:
- `admin-dashboard.tsx` - Main admin interface with stats
- `application-manager.tsx` - Create/manage applications
- `category-question-manager.tsx` - Build questions with logic
- `submissions-view.tsx` - View all submissions
- `submission-review.tsx` - Review interface with notes

### User Components:
- `user-dashboard.tsx` - Browse applications and submissions
- `application-submission.tsx` - Complete applications
- `submission-detail-view.tsx` - View submission with feedback

### Shared:
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/supabase/server.ts` - Server Supabase client
- `middleware.ts` - Auth middleware for protected routes

## Conditional Logic Examples

### Example 1: Tax Clearance
\`\`\`typescript
Question 1: "Do you have tax clearance?"
  - Options: ["Yes", "No"]
  
Question 2: "Upload tax clearance document"
  - Depends on: Question 1
  - Required answer: "Yes"
  - Media: Required
  - Only shows if user answered "Yes" to Question 1
\`\`\`

### Example 2: Answer-Based Upload
\`\`\`typescript
Question: "Do you have a valid tax declaration for 2024?"
  - Options: ["Yes, filed and approved", "Yes, filed but pending", "No"]
  - Media: Optional
  - Show upload for: ["Yes, filed and approved", "Yes, filed but pending"]
  - Upload button only appears if user selects one of these options
\`\`\`

## Review Status Flow

1. **Pending** - Initial submission state
2. **In Review** - Admin is reviewing
3. **Approved** - Submission approved
4. **Rejected** - Submission rejected with notes

Users can see their status and admin notes in their dashboard.

## Deployment

### Deploy to Vercel:
1. Push code to GitHub
2. Import repository in Vercel
3. Environment variables are auto-configured
4. Deploy

### Post-Deployment:
1. Run database scripts in Supabase
2. Create admin account
3. Start creating applications

See `DEPLOYMENT.md` for detailed instructions.

## Security Features

- Supabase Auth with email/password
- Row Level Security on all tables
- Secure file uploads with access policies
- Protected routes with middleware
- Role-based access control

## Future Enhancements

- [ ] Email notifications for status changes
- [ ] PDF report generation
- [ ] Bulk submission review
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] OAuth providers (Google, GitHub)
- [ ] Webhook integrations
- [ ] API for external integrations

## Support

For issues or questions:
1. Check the database scripts are all executed
2. Verify your account has admin role
3. Check Supabase logs for errors
4. Ensure storage bucket is created

## License

MIT License - feel free to use for your projects.

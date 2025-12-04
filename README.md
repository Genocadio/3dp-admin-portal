# 3DP Admin Portal

A comprehensive admin portal for managing applications, evaluations, and user submissions. Built with Next.js, React, TypeScript, and GraphQL.

## Features

### User Management
- User registration and authentication
- Role-based access control (Admin/User)
- User activation/deactivation
- User deletion
- Profile management with update capabilities
- Password change functionality
- Password reset via email code

### Evaluation Forms
- Create and manage evaluation forms
- Dynamic form builder with sections and questions
- Multiple question types:
  - Single-line text input
  - Paragraph text input
  - Single choice (MCQ)
  - Multiple choice (MCQ)
  - File upload
- Question dependencies and conditional logic
- Auto-save functionality
- Form deletion with cascade to answers

### Answer Submissions
- Users can submit answers to evaluation forms
- Automatic evaluation for multiple-choice questions
- Manual review required for text inputs and file uploads
- Review status tracking (AUTO/COMPLETE)
- Score visibility based on review completion
- PDF report generation for completed reviews

### Review System
- Manual review for text and file upload questions
- Automatic scoring for multiple-choice questions
- Review status: AUTO (waiting for manual review) or COMPLETE
- Question-level scoring and feedback
- Total score calculation
- Review notes and comments

### Dashboard
- Admin dashboard with statistics
- User dashboard with evaluation access
- Tab persistence across page refreshes
- Recent activity tracking
- Pending reviews overview

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **UI Library**: React 19
- **GraphQL Client**: Apollo Client
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **File Upload**: Cloudinary

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- GraphQL backend server running
- Cloudinary account (for file uploads)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 3dp-admin-portal
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
# Backend GraphQL endpoint
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/graphql

# Cloudinary Configuration (optional, for file uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset-name
```

4. Run the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
3dp-admin-portal/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard page
│   ├── auth/              # Authentication pages
│   │   ├── forgot-password/
│   │   ├── login/
│   │   ├── reset-password/
│   │   ├── sign-up/
│   │   └── sign-up-success/
│   ├── dashboard/         # User dashboard page
│   ├── profile/           # User profile page
│   └── layout.tsx         # Root layout with Apollo Provider
├── components/             # React components
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   ├── admin-dashboard.tsx
│   ├── user-dashboard.tsx
│   ├── evaluations-list.tsx
│   ├── evaluation-form-builder.tsx
│   ├── answer-review.tsx
│   └── ...
├── lib/                   # Utility libraries
│   ├── apollo/           # Apollo Client configuration
│   ├── auth/             # Authentication utilities
│   ├── graphql/          # GraphQL queries and mutations
│   └── utils.ts           # General utilities
├── scripts/               # Database migration scripts
└── public/                # Static assets
```

## GraphQL Integration

The application uses Apollo Client for GraphQL operations. All queries and mutations are defined in:
- `lib/graphql/evaluations.ts` - Evaluation and answer queries/mutations
- `lib/graphql/users.ts` - User management queries/mutations
- `lib/graphql/mutations.ts` - Authentication and profile mutations

### Key Mutations

- `login` - User authentication
- `register` - User registration
- `changePassword` - Change user password
- `updateProfile` - Update user profile
- `requestPasswordReset` - Request password reset code
- `resetPassword` - Reset password with code
- `createEvaluationForm` - Create evaluation form
- `updateEvaluationForm` - Update evaluation form
- `deleteEvaluationForm` - Delete evaluation form
- `createAnswer` - Submit evaluation answer
- `reviewAnswer` - Review submitted answer
- `deleteAnswer` - Delete answer
- `deleteUser` - Delete user account

### Key Queries

- `me` - Get current user
- `users` - Get all users
- `evaluationForms` - Get all evaluation forms
- `myAnswers` - Get current user's answers
- `allAnswers` - Get all answers (admin)
- `dashboardStats` - Get dashboard statistics

## Authentication

Authentication is handled via JWT tokens stored in localStorage. The token is automatically included in GraphQL requests via Apollo Client's auth link.

## Features in Detail

### Evaluation Form Builder
- Auto-saves when questions are added
- Button changes from "Create" to "Update" after first save
- Supports question dependencies
- Media attachments for questions
- Multiple choice options with correct answer marking

### Answer Review
- Automatic scoring for MCQ questions
- Manual review interface for text/file questions
- Review status tracking
- Score visibility only when review is COMPLETE
- "Waiting for manual evaluation" message for AUTO status

### User Management
- Admin can activate/deactivate users
- Admin can delete users
- Users cannot delete their own account
- Profile updates with role-based field restrictions

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier (if configured) for formatting

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | GraphQL endpoint URL | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | No |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Cloudinary upload preset | No |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

[Add your license here]

## Support

For issues and questions, please contact the development team.


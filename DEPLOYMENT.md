# Deployment Guide

## Deploying to Vercel

This application is optimized for deployment on Vercel.

### Steps

1. **Push to GitHub**
   - Click the GitHub icon in the top right of v0
   - Connect your repository

2. **Deploy to Vercel**
   - Click "Publish" in v0, or
   - Go to [vercel.com](https://vercel.com) and import your repository

3. **Environment Variables**
   - All Supabase environment variables are automatically configured
   - No manual setup required

4. **Database Setup**
   - Run all SQL scripts in your Supabase SQL Editor
   - Create your first admin account

### Post-Deployment

1. Visit your deployed URL
2. Sign up for an account
3. Run the admin promotion script
4. Start creating applications

## Custom Domain

To add a custom domain:
1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Monitoring

- View logs in Vercel dashboard
- Monitor database usage in Supabase dashboard
- Check storage usage for uploaded files

## Backup

Regular backups are handled by Supabase. To create manual backups:
1. Go to Supabase dashboard
2. Navigate to Database → Backups
3. Create a manual backup

## Scaling

The application scales automatically with Vercel and Supabase:
- Vercel handles frontend scaling
- Supabase handles database and storage scaling
- No manual intervention required for normal traffic

-- Insert sample application
insert into public.applications (id, title, description, is_active)
values 
  ('00000000-0000-0000-0000-000000000001', 'Tax Compliance Evaluation', 'Complete evaluation for tax compliance requirements', true)
on conflict (id) do nothing;

-- Insert sample categories
insert into public.categories (id, application_id, title, description, order_index)
values 
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Tax Documentation', 'Required tax documentation and declarations', 1),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Financial Records', 'Financial statements and records', 2)
on conflict (id) do nothing;

-- Insert sample questions
insert into public.questions (id, category_id, question_text, help_text, question_type, options, points, media_upload_config, order_index)
values 
  (
    '00000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000011',
    'Do you have a valid tax declaration for 2024?',
    'This refers to your annual tax filing with the relevant tax authority.',
    'multiple_choice',
    '[
      {"text": "Yes", "value": "yes", "points": 10, "showUpload": true},
      {"text": "No", "value": "no", "points": 0, "showUpload": false}
    ]'::jsonb,
    10,
    '{"required": false, "allowedTypes": ["application/pdf", "image/*"], "maxSize": 5242880}'::jsonb,
    1
  ),
  (
    '00000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000011',
    'Upload your tax clearance certificate',
    'Please upload a valid tax clearance certificate',
    'media_only',
    null,
    10,
    '{"required": true, "allowedTypes": ["application/pdf", "image/*"], "maxSize": 5242880}'::jsonb,
    2
  )
on conflict (id) do nothing;

-- ============================================
-- ADMIN ACCOUNT SETUP INSTRUCTIONS
-- ============================================
-- To create an admin account:
-- 1. Sign up through the app at /auth/sign-up with your desired credentials
-- 2. After signup, run this query to make that user an admin:
--
--    UPDATE public.profiles 
--    SET role = 'admin' 
--    WHERE email = 'your-admin-email@example.com';
--
-- Example admin credentials you can create:
-- Email: admin@3dp.com
-- Password: Admin123!
-- 
-- Then run: UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@3dp.com';
-- ============================================

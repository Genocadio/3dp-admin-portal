-- Make yvesgeno@outlook.com an admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'yvesgeno@outlook.com';

-- Verify the update
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
WHERE email = 'yvesgeno@outlook.com';

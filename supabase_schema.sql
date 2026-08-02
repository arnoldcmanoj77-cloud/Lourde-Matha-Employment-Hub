-- ================================================
-- LOURDE MATHA EMPLOYMENT HUB - SUPABASE SCHEMA
-- Run this entire script in the Supabase SQL Editor
-- ================================================

-- ----------------------------------------
-- STEP 1: Create Profiles Table
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  passport_number TEXT,
  job_category TEXT,
  role TEXT DEFAULT 'applicant',
  status TEXT DEFAULT 'Draft',
  admin_notes TEXT,
  cv_path TEXT,
  passport_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- STEP 2: Enable RLS on profiles
-- ----------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------
-- STEP 3: Profiles RLS Policies
-- ----------------------------------------

-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to insert their own profile (needed during registration)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ----------------------------------------
-- STEP 4: Storage Bucket
-- Run this in the Supabase SQL Editor
-- ----------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('applicant-documents', 'applicant-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------
-- STEP 5: Storage Policies
-- Note: In Supabase dashboard, go to Storage > Policies
-- and add these policies manually. OR run below in SQL Editor.
-- ----------------------------------------

-- Allow applicants to upload their own documents
CREATE POLICY "Applicants can upload own docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'applicant-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow applicants to read their own documents
CREATE POLICY "Applicants can read own docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'applicant-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow applicants to update/replace their own documents
CREATE POLICY "Applicants can update own docs"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'applicant-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to read all documents
CREATE POLICY "Admins can read all docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'applicant-documents'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to delete any documents
CREATE POLICY "Admins can delete any docs"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'applicant-documents'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ================================================
-- STEP 6: Create Admin User
-- ================================================
-- IMPORTANT: After running this schema, follow these steps:
--
-- 1. Go to Authentication > Users in your Supabase dashboard
-- 2. Click "Add User" and create a user with:
--    Email:    augnal@lourdematha.com
--    Password: augnal@2006
--    (Make sure email confirmation is disabled in Auth settings)
--
-- 3. Then run this query to promote them to admin:
--    (Uncomment the block below and run it AFTER creating the user)
--
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'augnal@lourdematha.com'
-- );
-- ================================================

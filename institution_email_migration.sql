-- Migration: Add institution_email to profiles table and update admins
-- Run this in your Supabase SQL Editor

-- 1. Add the column if it does not exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS institution_email VARCHAR(255);

-- 2. Update institution emails for admins
UPDATE profiles
SET institution_email = 'sujoy.moulick2024@iem.edu.in'
WHERE email = 'sujoymoulick05@gmail.com';

UPDATE profiles
SET institution_email = 'somnath.das2024@iem.edu.in'
WHERE email = 'somnath.uem0@gmail.com';

UPDATE profiles
SET institution_email = 'arnab.basak2024@iem.edu.in'
WHERE email = 'basakarnab430@gmail.com';

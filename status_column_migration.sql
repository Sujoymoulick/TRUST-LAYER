-- Migration: Add status to profiles table
-- Run this query in your Supabase SQL Editor:
-- Go to: https://supabase.com -> Select your project -> SQL Editor -> New Query

-- 1. Add status column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 2. Ensure all existing profiles have 'active' status if NULL
UPDATE profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Add category to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'for_sale';

COMMENT ON COLUMN public.properties.category IS 'Property category: for_sale or owned';

-- Add company information fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_phone text,
ADD COLUMN IF NOT EXISTS company_email text,
ADD COLUMN IF NOT EXISTS company_gstin text,
ADD COLUMN IF NOT EXISTS company_website text;
-- Add company_revenue column to sales_transactions table
ALTER TABLE public.sales_transactions
ADD COLUMN IF NOT EXISTS company_revenue numeric;
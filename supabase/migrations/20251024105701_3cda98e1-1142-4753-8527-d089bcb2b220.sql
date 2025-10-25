-- Add lead contact fields so leads can be independent
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lead_name TEXT,
ADD COLUMN IF NOT EXISTS lead_email TEXT,
ADD COLUMN IF NOT EXISTS lead_phone TEXT;

-- Ensure properties table has proper category values
-- Category should be: for_sale, for_rent, for_lease
COMMENT ON COLUMN properties.category IS 'Property category: for_sale, for_rent, for_lease';

-- Create payment_logs table for tenant payments
CREATE TABLE IF NOT EXISTS tenant_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_management_id UUID REFERENCES tenant_management(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE tenant_payment_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment logs
CREATE POLICY "Admins and agents can manage payment logs"
ON tenant_payment_logs FOR ALL
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

CREATE POLICY "Authenticated users can view payment logs"
ON tenant_payment_logs FOR SELECT
USING (auth.role() = 'authenticated');

-- Add quotation storage fields
ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS pdf_url TEXT;
-- Multi-tenant migration: Add user_id to all tables and remove role-based access
-- Add user_id columns to tables that don't have them

ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE site_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE tenant_management ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sales_transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE lease_agreements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add new property fields for real estate
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_cents NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS area_acres NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS dtcp_approved BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS facing TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS plot_dimensions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS road_width_feet NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS corner_plot BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS electricity_available BOOLEAN DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS water_source TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS boundary_wall BOOLEAN DEFAULT false;

-- Add company logo field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_logo_url TEXT;

-- Update RLS policies for user-based access (drop all existing policies first)
DROP POLICY IF EXISTS "Admins and agents can manage clients" ON clients;
DROP POLICY IF EXISTS "Clients are viewable by authenticated users" ON clients;
DROP POLICY IF EXISTS "Admins and agents can manage leads" ON leads;
DROP POLICY IF EXISTS "Leads are viewable by authenticated users" ON leads;
DROP POLICY IF EXISTS "Admins and agents can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins and agents can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
DROP POLICY IF EXISTS "Properties are viewable by authenticated users" ON properties;
DROP POLICY IF EXISTS "Admins and agents can manage property images" ON property_images;
DROP POLICY IF EXISTS "Property images are viewable by authenticated users" ON property_images;
DROP POLICY IF EXISTS "Admins and agents can manage payments" ON payments;
DROP POLICY IF EXISTS "Payments are viewable by authenticated users" ON payments;
DROP POLICY IF EXISTS "Admins and agents can manage quotations" ON quotations;
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON quotations;
DROP POLICY IF EXISTS "Admins and agents can manage quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Authenticated users can view quotation items" ON quotation_items;
DROP POLICY IF EXISTS "Admins and agents can manage site progress" ON site_progress;
DROP POLICY IF EXISTS "Authenticated users can view site progress" ON site_progress;
DROP POLICY IF EXISTS "Admins and agents can manage tenant management" ON tenant_management;
DROP POLICY IF EXISTS "Authenticated users can view tenant management" ON tenant_management;
DROP POLICY IF EXISTS "Admins and agents can manage maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Maintenance requests are viewable by authenticated users" ON maintenance_requests;
DROP POLICY IF EXISTS "Admins and agents can manage transactions" ON sales_transactions;
DROP POLICY IF EXISTS "Transactions are viewable by authenticated users" ON sales_transactions;
DROP POLICY IF EXISTS "Admins and agents can manage leases" ON lease_agreements;
DROP POLICY IF EXISTS "Leases are viewable by authenticated users" ON lease_agreements;
DROP POLICY IF EXISTS "Admins and agents can manage daily updates" ON site_daily_updates;
DROP POLICY IF EXISTS "Authenticated users can view daily updates" ON site_daily_updates;
DROP POLICY IF EXISTS "Admins and agents can manage milestones" ON site_milestones;
DROP POLICY IF EXISTS "Authenticated users can view milestones" ON site_milestones;
DROP POLICY IF EXISTS "Admins and agents can manage important dates" ON site_important_dates;
DROP POLICY IF EXISTS "Authenticated users can view important dates" ON site_important_dates;
DROP POLICY IF EXISTS "Admins and agents can manage site documents" ON site_documents;
DROP POLICY IF EXISTS "Authenticated users can view site documents" ON site_documents;
DROP POLICY IF EXISTS "Admins and agents can manage payment logs" ON tenant_payment_logs;
DROP POLICY IF EXISTS "Authenticated users can view payment logs" ON tenant_payment_logs;

-- Create user-based RLS policies
CREATE POLICY "Users can manage their own clients" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own leads" ON leads FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own properties" ON properties FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own property images" ON property_images FOR ALL USING (auth.uid() IN (SELECT user_id FROM properties WHERE properties.id = property_images.property_id));
CREATE POLICY "Users can manage their own payments" ON payments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own quotations" ON quotations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own quotation items" ON quotation_items FOR ALL USING (auth.uid() IN (SELECT user_id FROM quotations WHERE quotations.id = quotation_items.quotation_id));
CREATE POLICY "Users can manage their own site progress" ON site_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own tenant management" ON tenant_management FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own maintenance requests" ON maintenance_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own sales transactions" ON sales_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own lease agreements" ON lease_agreements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own daily updates" ON site_daily_updates FOR ALL USING (auth.uid() IN (SELECT user_id FROM site_progress WHERE site_progress.id = site_daily_updates.site_progress_id));
CREATE POLICY "Users can manage their own milestones" ON site_milestones FOR ALL USING (auth.uid() IN (SELECT user_id FROM site_progress WHERE site_progress.id = site_milestones.site_progress_id));
CREATE POLICY "Users can manage their own important dates" ON site_important_dates FOR ALL USING (auth.uid() IN (SELECT user_id FROM site_progress WHERE site_progress.id = site_important_dates.site_progress_id));
CREATE POLICY "Users can manage their own site documents" ON site_documents FOR ALL USING (auth.uid() IN (SELECT user_id FROM site_progress WHERE site_progress.id = site_documents.site_progress_id));
CREATE POLICY "Users can manage their own tenant payment logs" ON tenant_payment_logs FOR ALL USING (auth.uid() IN (SELECT user_id FROM tenant_management WHERE tenant_management.id = tenant_payment_logs.tenant_management_id));
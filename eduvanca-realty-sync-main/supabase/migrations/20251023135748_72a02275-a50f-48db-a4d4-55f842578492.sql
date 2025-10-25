-- Create storage buckets for property images and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 15728640, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('project-documents', 'project-documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']);

-- Storage policies for property images (public bucket)
CREATE POLICY "Public can view property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role))
);

CREATE POLICY "Admins and agents can delete property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role))
);

-- Storage policies for project documents (private bucket)
CREATE POLICY "Authenticated users can view project documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role))
);

CREATE POLICY "Admins and agents can delete project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role))
);

-- Tenant Management Table
CREATE TABLE IF NOT EXISTS tenant_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  unit_number TEXT,
  unit_type TEXT NOT NULL, -- apartment, house, commercial_space, etc.
  floor_number INTEGER,
  square_feet NUMERIC,
  rental_amount NUMERIC NOT NULL,
  security_deposit NUMERIC,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  rent_due_day INTEGER DEFAULT 1,
  lease_status TEXT DEFAULT 'active', -- active, expired, terminated, renewed
  payment_status TEXT DEFAULT 'current', -- current, overdue, paid_ahead
  last_payment_date DATE,
  next_payment_date DATE,
  amenities TEXT[],
  parking_spaces INTEGER DEFAULT 0,
  furnished_status TEXT, -- fully_furnished, semi_furnished, unfurnished
  pet_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  maintenance_responsibility TEXT, -- tenant, landlord, shared
  utilities_included TEXT[], -- water, electricity, gas, internet, etc.
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  move_in_date DATE,
  move_out_date DATE,
  lease_renewal_date DATE,
  special_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Management Table
CREATE TABLE IF NOT EXISTS site_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  project_type TEXT NOT NULL, -- residential, commercial, mixed_use, infrastructure
  site_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  contractor_name TEXT,
  contractor_phone TEXT,
  contractor_email TEXT,
  project_manager TEXT,
  architect_name TEXT,
  engineer_name TEXT,
  start_date DATE NOT NULL,
  expected_completion_date DATE,
  actual_completion_date DATE,
  project_status TEXT DEFAULT 'planning', -- planning, in_progress, on_hold, completed, cancelled
  overall_progress_percentage NUMERIC DEFAULT 0,
  total_budget NUMERIC,
  spent_amount NUMERIC DEFAULT 0,
  pending_amount NUMERIC,
  total_area_sqft NUMERIC,
  number_of_units INTEGER,
  number_of_floors INTEGER,
  construction_type TEXT, -- RCC, steel, prefab, etc.
  approval_status TEXT, -- pending, approved, rejected
  building_permit_number TEXT,
  building_permit_date DATE,
  occupancy_certificate_number TEXT,
  occupancy_certificate_date DATE,
  safety_compliance_status TEXT DEFAULT 'pending',
  environmental_clearance BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Daily Updates Table
CREATE TABLE IF NOT EXISTS site_daily_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  update_date DATE NOT NULL DEFAULT CURRENT_DATE,
  work_completed TEXT NOT NULL,
  materials_used TEXT,
  labor_count INTEGER,
  equipment_used TEXT,
  weather_conditions TEXT,
  delays_encountered TEXT,
  safety_incidents TEXT,
  photos_uploaded TEXT[], -- Array of storage URLs
  supervisor_name TEXT,
  next_day_plan TEXT,
  progress_percentage NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Documents Table
CREATE TABLE IF NOT EXISTS site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- contract, blueprint, permit, report, invoice, etc.
  document_url TEXT NOT NULL, -- Storage path
  file_size BIGINT,
  uploaded_by UUID,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  document_date DATE,
  expiry_date DATE,
  is_important BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Important Dates Table
CREATE TABLE IF NOT EXISTS site_important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  date_title TEXT NOT NULL,
  date_type TEXT NOT NULL, -- milestone, inspection, payment, delivery, deadline
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  status TEXT DEFAULT 'upcoming', -- upcoming, completed, missed, rescheduled
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  reminder_days_before INTEGER DEFAULT 7,
  description TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Milestones Table
CREATE TABLE IF NOT EXISTS site_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, delayed
  progress_percentage NUMERIC DEFAULT 0,
  budget_allocated NUMERIC,
  budget_spent NUMERIC,
  dependencies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft', -- draft, sent, accepted, rejected, expired
  subtotal NUMERIC NOT NULL DEFAULT 0,
  sgst_rate NUMERIC DEFAULT 9,
  sgst_amount NUMERIC DEFAULT 0,
  cgst_rate NUMERIC DEFAULT 9,
  cgst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  terms_and_conditions TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Items Table
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'unit',
  rate NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  notes TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE tenant_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant_management
CREATE POLICY "Authenticated users can view tenant management"
ON tenant_management FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage tenant management"
ON tenant_management FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for site_progress
CREATE POLICY "Authenticated users can view site progress"
ON site_progress FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage site progress"
ON site_progress FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for site_daily_updates
CREATE POLICY "Authenticated users can view daily updates"
ON site_daily_updates FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage daily updates"
ON site_daily_updates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for site_documents
CREATE POLICY "Authenticated users can view site documents"
ON site_documents FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage site documents"
ON site_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for site_important_dates
CREATE POLICY "Authenticated users can view important dates"
ON site_important_dates FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage important dates"
ON site_important_dates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for site_milestones
CREATE POLICY "Authenticated users can view milestones"
ON site_milestones FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage milestones"
ON site_milestones FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for quotations
CREATE POLICY "Authenticated users can view quotations"
ON quotations FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage quotations"
ON quotations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for quotation_items
CREATE POLICY "Authenticated users can view quotation items"
ON quotation_items FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage quotation items"
ON quotation_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_tenant_management_updated_at BEFORE UPDATE ON tenant_management
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_site_progress_updated_at BEFORE UPDATE ON site_progress
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_site_daily_updates_updated_at BEFORE UPDATE ON site_daily_updates
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_site_important_dates_updated_at BEFORE UPDATE ON site_important_dates
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_site_milestones_updated_at BEFORE UPDATE ON site_milestones
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to auto-generate quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('quotation_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS quotation_seq START 1;

CREATE TRIGGER set_quotation_number
BEFORE INSERT ON quotations
FOR EACH ROW
EXECUTE FUNCTION generate_quotation_number();
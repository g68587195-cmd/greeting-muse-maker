-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'industrial');
CREATE TYPE property_status AS ENUM ('available', 'under_offer', 'sold', 'rented', 'off_market');
CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'negotiating', 'won', 'lost');
CREATE TYPE transaction_type AS ENUM ('sale', 'lease', 'rent');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE app_role AS ENUM ('admin', 'agent', 'viewer');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  company_name TEXT,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_gstin TEXT,
  company_website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  property_type property_type NOT NULL,
  status property_status NOT NULL DEFAULT 'available',
  category TEXT NOT NULL DEFAULT 'for_sale',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  zip_code TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  price DECIMAL(15, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet DECIMAL(10, 2),
  year_built INTEGER,
  amenities TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Property images table
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  client_type TEXT,
  preferences JSONB,
  notes TEXT,
  assigned_agent UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  lead_name TEXT,
  lead_email TEXT,
  lead_phone TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT,
  notes TEXT,
  assigned_agent UUID REFERENCES auth.users(id),
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales transactions table
CREATE TABLE public.sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  transaction_type transaction_type NOT NULL,
  sale_price DECIMAL(15, 2) NOT NULL,
  commission_rate DECIMAL(5, 2),
  commission_amount DECIMAL(15, 2),
  agent_id UUID REFERENCES auth.users(id),
  contract_date DATE,
  closing_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lease agreements table
CREATE TABLE public.lease_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  tenant_id UUID NOT NULL REFERENCES public.clients(id),
  monthly_rent DECIMAL(10, 2) NOT NULL,
  security_deposit DECIMAL(10, 2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.lease_agreements(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES public.sales_transactions(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  due_date DATE,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Maintenance requests table
CREATE TABLE public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  title TEXT NOT NULL,
  description TEXT,
  status maintenance_status NOT NULL DEFAULT 'pending',
  priority TEXT,
  reported_by UUID REFERENCES public.clients(id),
  assigned_to TEXT,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  scheduled_date DATE,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Management Table
CREATE TABLE public.tenant_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  unit_number TEXT,
  unit_type TEXT NOT NULL,
  floor_number INTEGER,
  square_feet NUMERIC,
  rental_amount NUMERIC NOT NULL,
  security_deposit NUMERIC,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  rent_due_day INTEGER DEFAULT 1,
  lease_status TEXT DEFAULT 'active',
  payment_status TEXT DEFAULT 'current',
  last_payment_date DATE,
  next_payment_date DATE,
  amenities TEXT[],
  parking_spaces INTEGER DEFAULT 0,
  furnished_status TEXT,
  pet_allowed BOOLEAN DEFAULT false,
  smoking_allowed BOOLEAN DEFAULT false,
  maintenance_responsibility TEXT,
  utilities_included TEXT[],
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

-- Tenant payment logs table
CREATE TABLE public.tenant_payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_management_id UUID REFERENCES tenant_management(id) ON DELETE CASCADE NOT NULL,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Site Progress Management Table
CREATE TABLE public.site_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  project_type TEXT NOT NULL,
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
  project_status TEXT DEFAULT 'planning',
  overall_progress_percentage NUMERIC DEFAULT 0,
  total_budget NUMERIC,
  spent_amount NUMERIC DEFAULT 0,
  pending_amount NUMERIC,
  total_area_sqft NUMERIC,
  number_of_units INTEGER,
  number_of_floors INTEGER,
  construction_type TEXT,
  approval_status TEXT,
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
CREATE TABLE public.site_daily_updates (
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
  photos_uploaded TEXT[],
  supervisor_name TEXT,
  next_day_plan TEXT,
  progress_percentage NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Documents Table
CREATE TABLE public.site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
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
CREATE TABLE public.site_important_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  date_title TEXT NOT NULL,
  date_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  status TEXT DEFAULT 'upcoming',
  priority TEXT DEFAULT 'medium',
  reminder_days_before INTEGER DEFAULT 7,
  description TEXT,
  assigned_to TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Progress Milestones Table
CREATE TABLE public.site_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_progress_id UUID REFERENCES site_progress(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_description TEXT,
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  status TEXT DEFAULT 'not_started',
  progress_percentage NUMERIC DEFAULT 0,
  budget_allocated NUMERIC,
  budget_spent NUMERIC,
  dependencies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations Table
CREATE TABLE public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  quotation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  sgst_rate NUMERIC DEFAULT 9,
  sgst_amount NUMERIC DEFAULT 0,
  cgst_rate NUMERIC DEFAULT 9,
  cgst_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  terms_and_conditions TEXT,
  notes TEXT,
  pdf_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation Items Table
CREATE TABLE public.quotation_items (
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

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_daily_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_important_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for properties
CREATE POLICY "Properties are viewable by authenticated users"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Admins and agents can update properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for property_images
CREATE POLICY "Property images are viewable by authenticated users"
  ON public.property_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage property images"
  ON public.property_images FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for clients
CREATE POLICY "Clients are viewable by authenticated users"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for leads
CREATE POLICY "Leads are viewable by authenticated users"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for sales_transactions
CREATE POLICY "Transactions are viewable by authenticated users"
  ON public.sales_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage transactions"
  ON public.sales_transactions FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for lease_agreements
CREATE POLICY "Leases are viewable by authenticated users"
  ON public.lease_agreements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage leases"
  ON public.lease_agreements FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for payments
CREATE POLICY "Payments are viewable by authenticated users"
  ON public.payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for maintenance_requests
CREATE POLICY "Maintenance requests are viewable by authenticated users"
  ON public.maintenance_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and agents can manage maintenance requests"
  ON public.maintenance_requests FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'agent')
  );

-- RLS Policies for tenant_management
CREATE POLICY "Authenticated users can view tenant management"
  ON tenant_management FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage tenant management"
  ON tenant_management FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS policies for payment logs
CREATE POLICY "Authenticated users can view payment logs"
  ON tenant_payment_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage payment logs"
  ON tenant_payment_logs FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for site_progress
CREATE POLICY "Authenticated users can view site progress"
  ON site_progress FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage site progress"
  ON site_progress FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for site_daily_updates
CREATE POLICY "Authenticated users can view daily updates"
  ON site_daily_updates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage daily updates"
  ON site_daily_updates FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for site_documents
CREATE POLICY "Authenticated users can view site documents"
  ON site_documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage site documents"
  ON site_documents FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for site_important_dates
CREATE POLICY "Authenticated users can view important dates"
  ON site_important_dates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage important dates"
  ON site_important_dates FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for site_milestones
CREATE POLICY "Authenticated users can view milestones"
  ON site_milestones FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage milestones"
  ON site_milestones FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for quotations
CREATE POLICY "Authenticated users can view quotations"
  ON quotations FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage quotations"
  ON quotations FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- RLS Policies for quotation_items
CREATE POLICY "Authenticated users can view quotation items"
  ON quotation_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can manage quotation items"
  ON quotation_items FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sales_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lease_agreements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

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

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  
  -- Auto-assign first user as admin
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Default role for new users
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-generate quotation number
CREATE SEQUENCE IF NOT EXISTS quotation_seq START 1;

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('quotation_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quotation_number();

-- Create indexes for better performance
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_property_images_property_id ON public.property_images(property_id);
CREATE INDEX idx_clients_assigned_agent ON public.clients(assigned_agent);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_assigned_agent ON public.leads(assigned_agent);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_maintenance_status ON public.maintenance_requests(status);

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
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

CREATE POLICY "Admins and agents can delete property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

-- Storage policies for project documents (private bucket)
CREATE POLICY "Authenticated users can view project documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Admins and agents can upload project documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-documents'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );

CREATE POLICY "Admins and agents can delete project documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-documents'
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
  );
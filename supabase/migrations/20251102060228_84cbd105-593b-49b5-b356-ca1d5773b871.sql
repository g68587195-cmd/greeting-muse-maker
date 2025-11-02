-- Drop existing site progress related tables and recreate with comprehensive structure
DROP TABLE IF EXISTS site_daily_updates CASCADE;
DROP TABLE IF EXISTS site_documents CASCADE;
DROP TABLE IF EXISTS site_important_dates CASCADE;
DROP TABLE IF EXISTS site_milestones CASCADE;
DROP TABLE IF EXISTS site_progress CASCADE;

-- 1. Main Projects Table (Master Data)
CREATE TABLE site_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Basic Info
  project_name TEXT NOT NULL,
  project_code TEXT,
  project_type TEXT NOT NULL, -- Residential, Commercial, Villa, etc.
  construction_type TEXT, -- New Construction, Renovation, etc.
  
  -- Client/Owner
  client_id UUID REFERENCES clients(id),
  property_id UUID REFERENCES properties(id),
  
  -- Team
  project_manager TEXT,
  site_engineer TEXT,
  architect_name TEXT,
  engineer_name TEXT,
  contractor_name TEXT,
  contractor_phone TEXT,
  contractor_email TEXT,
  
  -- Location
  site_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  
  -- Dates
  start_date DATE NOT NULL,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Budget
  total_budget NUMERIC DEFAULT 0,
  spent_amount NUMERIC DEFAULT 0,
  pending_amount NUMERIC DEFAULT 0,
  
  -- Project Details
  total_area_sqft NUMERIC,
  number_of_floors INTEGER,
  number_of_units INTEGER,
  
  -- Permits & Approvals
  building_permit_number TEXT,
  building_permit_date DATE,
  occupancy_certificate_number TEXT,
  occupancy_certificate_date DATE,
  environmental_clearance BOOLEAN DEFAULT false,
  approval_status TEXT,
  safety_compliance_status TEXT DEFAULT 'pending',
  
  -- Status
  project_status TEXT DEFAULT 'planning', -- planning, in_progress, on_hold, completed, cancelled
  overall_progress_percentage NUMERIC DEFAULT 0,
  health_indicator TEXT DEFAULT 'green', -- green, yellow, red
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Project Phases/Milestones
CREATE TABLE site_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  
  phase_name TEXT NOT NULL,
  phase_code TEXT,
  phase_order INTEGER DEFAULT 0,
  description TEXT,
  
  -- Dates
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  
  -- Progress
  progress_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed, delayed
  
  -- Budget
  budget_allocated NUMERIC DEFAULT 0,
  budget_spent NUMERIC DEFAULT 0,
  
  -- Team
  assigned_contractor TEXT,
  assigned_team TEXT,
  
  dependencies TEXT, -- Other phases this depends on
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Phase Tasks (Detailed checklist per phase)
CREATE TABLE site_phase_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID REFERENCES site_phases(id) ON DELETE CASCADE,
  
  task_name TEXT NOT NULL,
  task_description TEXT,
  task_order INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  progress_percentage NUMERIC DEFAULT 0,
  
  -- Dates
  planned_date DATE,
  completed_date DATE,
  
  assigned_to TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Progress Logs
CREATE TABLE site_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_by UUID REFERENCES auth.users(id),
  
  -- Work Details
  work_shift TEXT, -- Morning, Evening, Full Day
  work_completed TEXT NOT NULL,
  progress_summary TEXT,
  next_day_plan TEXT,
  
  -- Conditions
  weather_conditions TEXT,
  temperature TEXT,
  
  -- Progress
  overall_progress_percentage NUMERIC,
  
  -- Resources
  labor_count INTEGER DEFAULT 0,
  materials_used TEXT,
  equipment_used TEXT,
  
  -- Issues
  delays_encountered TEXT,
  safety_incidents TEXT,
  issues_reported TEXT,
  
  -- Media
  photos_uploaded TEXT[],
  supervisor_name TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Material Usage Logs
CREATE TABLE site_materials_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  material_name TEXT NOT NULL,
  material_code TEXT,
  material_category TEXT, -- Cement, Steel, Bricks, etc.
  
  quantity_issued NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- bags, tons, cubic meters, etc.
  
  quantity_used NUMERIC,
  quantity_remaining NUMERIC,
  
  source TEXT, -- Inventory, Purchase, Supplier
  supplier_name TEXT,
  
  cost_per_unit NUMERIC,
  total_cost NUMERIC,
  
  issued_to TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Labor & Workforce Logs
CREATE TABLE site_labor_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  contractor_name TEXT,
  labor_type TEXT, -- Mason, Carpenter, Electrician, Plumber, Helper
  
  total_count INTEGER NOT NULL,
  hours_worked NUMERIC,
  
  work_completed TEXT,
  attendance_status TEXT,
  
  wage_per_person NUMERIC,
  total_wages NUMERIC,
  
  supervisor_name TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Equipment & Machinery Logs
CREATE TABLE site_equipment_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  equipment_name TEXT NOT NULL,
  equipment_id TEXT,
  equipment_type TEXT, -- Crane, Excavator, Mixer, etc.
  
  usage_duration NUMERIC, -- hours
  operator_name TEXT,
  
  fuel_used NUMERIC,
  fuel_cost NUMERIC,
  
  maintenance_notes TEXT,
  condition_status TEXT, -- Good, Needs Maintenance, Under Repair
  
  rental_cost NUMERIC,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Quality & Inspection Logs
CREATE TABLE site_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type TEXT, -- Quality, Safety, Structural, Final
  
  inspected_by TEXT NOT NULL,
  inspector_designation TEXT,
  
  inspection_area TEXT,
  observations TEXT,
  
  quality_rating TEXT, -- Excellent, Good, Satisfactory, Poor
  issues_found TEXT,
  corrective_actions TEXT,
  
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected, rework_required
  approval_date DATE,
  approved_by TEXT,
  
  photos TEXT[],
  documents TEXT[],
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Financial Logs (Daily/Weekly Expenses)
CREATE TABLE site_financial_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  expense_category TEXT NOT NULL, -- Labor, Materials, Equipment, Vendor Payment, Other
  expense_description TEXT NOT NULL,
  
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, partially_paid
  
  vendor_name TEXT,
  invoice_number TEXT,
  
  approved_by TEXT,
  approval_status TEXT DEFAULT 'pending',
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Site Issues & Problems
CREATE TABLE site_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  issue_id TEXT, -- Auto-generated issue number
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reported_by TEXT NOT NULL,
  
  issue_title TEXT NOT NULL,
  issue_description TEXT,
  issue_category TEXT, -- Safety, Quality, Delay, Resource, Design, Other
  
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  priority TEXT DEFAULT 'medium',
  
  assigned_to TEXT,
  deadline DATE,
  
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  resolution_notes TEXT,
  resolved_date DATE,
  resolved_by TEXT,
  
  attachments TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Change Requests
CREATE TABLE site_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  
  change_id TEXT, -- Auto-generated CR number
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  requested_by TEXT NOT NULL,
  
  change_title TEXT NOT NULL,
  change_description TEXT NOT NULL,
  change_reason TEXT,
  
  impact_on_time INTEGER, -- days
  impact_on_cost NUMERIC,
  impact_on_design TEXT,
  
  approval_status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by TEXT,
  approval_date DATE,
  approval_notes TEXT,
  
  implementation_status TEXT DEFAULT 'not_started',
  
  documents TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Site Documents
CREATE TABLE site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES site_projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES site_phases(id) ON DELETE SET NULL,
  
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL, -- Drawing, Permit, Report, Invoice, Photo, Other
  document_category TEXT,
  
  document_url TEXT NOT NULL,
  file_size BIGINT,
  
  document_date DATE,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id),
  
  expiry_date DATE,
  is_important BOOLEAN DEFAULT false,
  
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE site_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_phase_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_materials_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_labor_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_equipment_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_financial_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_projects
CREATE POLICY "Users can manage their own projects" ON site_projects FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for site_phases
CREATE POLICY "Users can manage their own project phases" ON site_phases FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_phases.project_id));

-- RLS Policies for site_phase_tasks
CREATE POLICY "Users can manage their own phase tasks" ON site_phase_tasks FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id IN (SELECT project_id FROM site_phases WHERE site_phases.id = site_phase_tasks.phase_id)));

-- RLS Policies for site_daily_logs
CREATE POLICY "Users can manage their own daily logs" ON site_daily_logs FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_daily_logs.project_id));

-- RLS Policies for site_materials_log
CREATE POLICY "Users can manage their own materials log" ON site_materials_log FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_materials_log.project_id));

-- RLS Policies for site_labor_log
CREATE POLICY "Users can manage their own labor log" ON site_labor_log FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_labor_log.project_id));

-- RLS Policies for site_equipment_log
CREATE POLICY "Users can manage their own equipment log" ON site_equipment_log FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_equipment_log.project_id));

-- RLS Policies for site_inspections
CREATE POLICY "Users can manage their own inspections" ON site_inspections FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_inspections.project_id));

-- RLS Policies for site_financial_log
CREATE POLICY "Users can manage their own financial log" ON site_financial_log FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_financial_log.project_id));

-- RLS Policies for site_issues
CREATE POLICY "Users can manage their own site issues" ON site_issues FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_issues.project_id));

-- RLS Policies for site_change_requests
CREATE POLICY "Users can manage their own change requests" ON site_change_requests FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_change_requests.project_id));

-- RLS Policies for site_documents
CREATE POLICY "Users can manage their own site documents" ON site_documents FOR ALL 
USING (auth.uid() IN (SELECT user_id FROM site_projects WHERE site_projects.id = site_documents.project_id));

-- Create indexes for better performance
CREATE INDEX idx_site_projects_user_id ON site_projects(user_id);
CREATE INDEX idx_site_phases_project_id ON site_phases(project_id);
CREATE INDEX idx_site_phase_tasks_phase_id ON site_phase_tasks(phase_id);
CREATE INDEX idx_site_daily_logs_project_id ON site_daily_logs(project_id);
CREATE INDEX idx_site_daily_logs_date ON site_daily_logs(log_date);
CREATE INDEX idx_site_materials_log_project_id ON site_materials_log(project_id);
CREATE INDEX idx_site_labor_log_project_id ON site_labor_log(project_id);
CREATE INDEX idx_site_equipment_log_project_id ON site_equipment_log(project_id);
CREATE INDEX idx_site_inspections_project_id ON site_inspections(project_id);
CREATE INDEX idx_site_financial_log_project_id ON site_financial_log(project_id);
CREATE INDEX idx_site_issues_project_id ON site_issues(project_id);
CREATE INDEX idx_site_change_requests_project_id ON site_change_requests(project_id);
CREATE INDEX idx_site_documents_project_id ON site_documents(project_id);

-- Create triggers for updated_at
CREATE TRIGGER update_site_projects_updated_at BEFORE UPDATE ON site_projects FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_phases_updated_at BEFORE UPDATE ON site_phases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_phase_tasks_updated_at BEFORE UPDATE ON site_phase_tasks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_daily_logs_updated_at BEFORE UPDATE ON site_daily_logs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_inspections_updated_at BEFORE UPDATE ON site_inspections FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_issues_updated_at BEFORE UPDATE ON site_issues FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER update_site_change_requests_updated_at BEFORE UPDATE ON site_change_requests FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          address: string | null
          assigned_agent: string | null
          client_type: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string
          preferences: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          assigned_agent?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          assigned_agent?: string | null
          client_type?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_agent: string | null
          client_id: string | null
          created_at: string
          follow_up_date: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          lead_phone: string | null
          notes: string | null
          property_id: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          client_id?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          property_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          client_id?: string | null
          created_at?: string
          follow_up_date?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          notes?: string | null
          property_id?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      lease_agreements: {
        Row: {
          created_at: string
          end_date: string
          id: string
          monthly_rent: number
          notes: string | null
          property_id: string
          security_deposit: number | null
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          monthly_rent: number
          notes?: string | null
          property_id: string
          security_deposit?: number | null
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          monthly_rent?: number
          notes?: string | null
          property_id?: string
          security_deposit?: number | null
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lease_agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lease_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          notes: string | null
          priority: string | null
          property_id: string
          reported_by: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          property_id: string
          reported_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          notes?: string | null
          priority?: string | null
          property_id?: string
          reported_by?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          due_date: string | null
          id: string
          lease_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          lease_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "lease_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "sales_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_address: string | null
          company_email: string | null
          company_gstin: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          company_website: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_gstin?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_address?: string | null
          company_email?: string | null
          company_gstin?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          area_acres: number | null
          area_cents: number | null
          bathrooms: number | null
          bedrooms: number | null
          boundary_wall: boolean | null
          category: string
          city: string
          corner_plot: boolean | null
          country: string
          created_at: string
          created_by: string | null
          description: string | null
          dtcp_approved: boolean | null
          electricity_available: boolean | null
          facing: string | null
          id: string
          plot_dimensions: string | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          road_width_feet: number | null
          square_feet: number | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          user_id: string | null
          water_source: string | null
          year_built: number | null
          zip_code: string | null
        }
        Insert: {
          address: string
          amenities?: string[] | null
          area_acres?: number | null
          area_cents?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          boundary_wall?: boolean | null
          category?: string
          city: string
          corner_plot?: boolean | null
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dtcp_approved?: boolean | null
          electricity_available?: boolean | null
          facing?: string | null
          id?: string
          plot_dimensions?: string | null
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          road_width_feet?: number | null
          square_feet?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          user_id?: string | null
          water_source?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string
          amenities?: string[] | null
          area_acres?: number | null
          area_cents?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          boundary_wall?: boolean | null
          category?: string
          city?: string
          corner_plot?: boolean | null
          country?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          dtcp_approved?: boolean | null
          electricity_available?: boolean | null
          facing?: string | null
          id?: string
          plot_dimensions?: string | null
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          road_width_feet?: number | null
          square_feet?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          user_id?: string | null
          water_source?: string | null
          year_built?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      property_images: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          property_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          property_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          amount: number
          created_at: string | null
          display_order: number | null
          id: string
          item_description: string
          notes: string | null
          quantity: number
          quotation_id: string | null
          rate: number
          unit: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          item_description: string
          notes?: string | null
          quantity?: number
          quotation_id?: string | null
          rate: number
          unit?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          display_order?: number | null
          id?: string
          item_description?: string
          notes?: string | null
          quantity?: number
          quotation_id?: string | null
          rate?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          cgst_amount: number | null
          cgst_rate: number | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          property_id: string | null
          quotation_date: string
          quotation_number: string
          sgst_amount: number | null
          sgst_rate: number | null
          status: string | null
          subtotal: number
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          property_id?: string | null
          quotation_date?: string
          quotation_number: string
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string | null
          subtotal?: number
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          property_id?: string | null
          quotation_date?: string
          quotation_number?: string
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string | null
          subtotal?: number
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_transactions: {
        Row: {
          agent_id: string | null
          client_id: string
          closing_date: string | null
          commission_amount: number | null
          commission_rate: number | null
          company_revenue: number | null
          contract_date: string | null
          created_at: string
          id: string
          notes: string | null
          property_id: string
          sale_price: number
          status: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          client_id: string
          closing_date?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          company_revenue?: number | null
          contract_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          sale_price: number
          status?: string
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          client_id?: string
          closing_date?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          company_revenue?: number | null
          contract_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          sale_price?: number
          status?: string
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      site_daily_updates: {
        Row: {
          created_at: string | null
          created_by: string | null
          delays_encountered: string | null
          equipment_used: string | null
          id: string
          labor_count: number | null
          materials_used: string | null
          next_day_plan: string | null
          photos_uploaded: string[] | null
          progress_percentage: number | null
          safety_incidents: string | null
          site_progress_id: string | null
          supervisor_name: string | null
          update_date: string
          updated_at: string | null
          weather_conditions: string | null
          work_completed: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delays_encountered?: string | null
          equipment_used?: string | null
          id?: string
          labor_count?: number | null
          materials_used?: string | null
          next_day_plan?: string | null
          photos_uploaded?: string[] | null
          progress_percentage?: number | null
          safety_incidents?: string | null
          site_progress_id?: string | null
          supervisor_name?: string | null
          update_date?: string
          updated_at?: string | null
          weather_conditions?: string | null
          work_completed: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delays_encountered?: string | null
          equipment_used?: string | null
          id?: string
          labor_count?: number | null
          materials_used?: string | null
          next_day_plan?: string | null
          photos_uploaded?: string[] | null
          progress_percentage?: number | null
          safety_incidents?: string | null
          site_progress_id?: string | null
          supervisor_name?: string | null
          update_date?: string
          updated_at?: string | null
          weather_conditions?: string | null
          work_completed?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_daily_updates_site_progress_id_fkey"
            columns: ["site_progress_id"]
            isOneToOne: false
            referencedRelation: "site_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      site_documents: {
        Row: {
          created_at: string | null
          document_date: string | null
          document_name: string
          document_type: string
          document_url: string
          expiry_date: string | null
          file_size: number | null
          id: string
          is_important: boolean | null
          notes: string | null
          site_progress_id: string | null
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_date?: string | null
          document_name: string
          document_type: string
          document_url: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_important?: boolean | null
          notes?: string | null
          site_progress_id?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_date?: string | null
          document_name?: string
          document_type?: string
          document_url?: string
          expiry_date?: string | null
          file_size?: number | null
          id?: string
          is_important?: boolean | null
          notes?: string | null
          site_progress_id?: string | null
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_documents_site_progress_id_fkey"
            columns: ["site_progress_id"]
            isOneToOne: false
            referencedRelation: "site_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      site_important_dates: {
        Row: {
          actual_date: string | null
          assigned_to: string | null
          created_at: string | null
          date_title: string
          date_type: string
          description: string | null
          id: string
          notes: string | null
          priority: string | null
          reminder_days_before: number | null
          scheduled_date: string
          site_progress_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          date_title: string
          date_type: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reminder_days_before?: number | null
          scheduled_date: string
          site_progress_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_date?: string | null
          assigned_to?: string | null
          created_at?: string | null
          date_title?: string
          date_type?: string
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reminder_days_before?: number | null
          scheduled_date?: string
          site_progress_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_important_dates_site_progress_id_fkey"
            columns: ["site_progress_id"]
            isOneToOne: false
            referencedRelation: "site_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      site_milestones: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          budget_allocated: number | null
          budget_spent: number | null
          created_at: string | null
          dependencies: string | null
          id: string
          milestone_description: string | null
          milestone_name: string
          notes: string | null
          planned_end_date: string | null
          planned_start_date: string | null
          progress_percentage: number | null
          site_progress_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string | null
          dependencies?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name: string
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percentage?: number | null
          site_progress_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string | null
          dependencies?: string | null
          id?: string
          milestone_description?: string | null
          milestone_name?: string
          notes?: string | null
          planned_end_date?: string | null
          planned_start_date?: string | null
          progress_percentage?: number | null
          site_progress_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_milestones_site_progress_id_fkey"
            columns: ["site_progress_id"]
            isOneToOne: false
            referencedRelation: "site_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      site_progress: {
        Row: {
          actual_completion_date: string | null
          approval_status: string | null
          architect_name: string | null
          building_permit_date: string | null
          building_permit_number: string | null
          city: string
          construction_type: string | null
          contractor_email: string | null
          contractor_name: string | null
          contractor_phone: string | null
          created_at: string | null
          engineer_name: string | null
          environmental_clearance: boolean | null
          expected_completion_date: string | null
          id: string
          notes: string | null
          number_of_floors: number | null
          number_of_units: number | null
          occupancy_certificate_date: string | null
          occupancy_certificate_number: string | null
          overall_progress_percentage: number | null
          pending_amount: number | null
          project_manager: string | null
          project_name: string
          project_status: string | null
          project_type: string
          property_id: string | null
          safety_compliance_status: string | null
          site_address: string
          spent_amount: number | null
          start_date: string
          state: string | null
          total_area_sqft: number | null
          total_budget: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_completion_date?: string | null
          approval_status?: string | null
          architect_name?: string | null
          building_permit_date?: string | null
          building_permit_number?: string | null
          city: string
          construction_type?: string | null
          contractor_email?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string | null
          engineer_name?: string | null
          environmental_clearance?: boolean | null
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          number_of_floors?: number | null
          number_of_units?: number | null
          occupancy_certificate_date?: string | null
          occupancy_certificate_number?: string | null
          overall_progress_percentage?: number | null
          pending_amount?: number | null
          project_manager?: string | null
          project_name: string
          project_status?: string | null
          project_type: string
          property_id?: string | null
          safety_compliance_status?: string | null
          site_address: string
          spent_amount?: number | null
          start_date: string
          state?: string | null
          total_area_sqft?: number | null
          total_budget?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_completion_date?: string | null
          approval_status?: string | null
          architect_name?: string | null
          building_permit_date?: string | null
          building_permit_number?: string | null
          city?: string
          construction_type?: string | null
          contractor_email?: string | null
          contractor_name?: string | null
          contractor_phone?: string | null
          created_at?: string | null
          engineer_name?: string | null
          environmental_clearance?: boolean | null
          expected_completion_date?: string | null
          id?: string
          notes?: string | null
          number_of_floors?: number | null
          number_of_units?: number | null
          occupancy_certificate_date?: string | null
          occupancy_certificate_number?: string | null
          overall_progress_percentage?: number | null
          pending_amount?: number | null
          project_manager?: string | null
          project_name?: string
          project_status?: string | null
          project_type?: string
          property_id?: string | null
          safety_compliance_status?: string | null
          site_address?: string
          spent_amount?: number | null
          start_date?: string
          state?: string | null
          total_area_sqft?: number | null
          total_budget?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_progress_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_management: {
        Row: {
          amenities: string[] | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          floor_number: number | null
          furnished_status: string | null
          id: string
          last_payment_date: string | null
          lease_end_date: string
          lease_renewal_date: string | null
          lease_start_date: string
          lease_status: string | null
          maintenance_responsibility: string | null
          move_in_date: string | null
          move_out_date: string | null
          next_payment_date: string | null
          notes: string | null
          parking_spaces: number | null
          payment_status: string | null
          pet_allowed: boolean | null
          property_id: string | null
          rent_due_day: number | null
          rental_amount: number
          security_deposit: number | null
          smoking_allowed: boolean | null
          special_terms: string | null
          square_feet: number | null
          tenant_id: string | null
          unit_number: string | null
          unit_type: string
          updated_at: string | null
          user_id: string | null
          utilities_included: string[] | null
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          floor_number?: number | null
          furnished_status?: string | null
          id?: string
          last_payment_date?: string | null
          lease_end_date: string
          lease_renewal_date?: string | null
          lease_start_date: string
          lease_status?: string | null
          maintenance_responsibility?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          parking_spaces?: number | null
          payment_status?: string | null
          pet_allowed?: boolean | null
          property_id?: string | null
          rent_due_day?: number | null
          rental_amount: number
          security_deposit?: number | null
          smoking_allowed?: boolean | null
          special_terms?: string | null
          square_feet?: number | null
          tenant_id?: string | null
          unit_number?: string | null
          unit_type: string
          updated_at?: string | null
          user_id?: string | null
          utilities_included?: string[] | null
        }
        Update: {
          amenities?: string[] | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          floor_number?: number | null
          furnished_status?: string | null
          id?: string
          last_payment_date?: string | null
          lease_end_date?: string
          lease_renewal_date?: string | null
          lease_start_date?: string
          lease_status?: string | null
          maintenance_responsibility?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          next_payment_date?: string | null
          notes?: string | null
          parking_spaces?: number | null
          payment_status?: string | null
          pet_allowed?: boolean | null
          property_id?: string | null
          rent_due_day?: number | null
          rental_amount?: number
          security_deposit?: number | null
          smoking_allowed?: boolean | null
          special_terms?: string | null
          square_feet?: number | null
          tenant_id?: string | null
          unit_number?: string | null
          unit_type?: string
          updated_at?: string | null
          user_id?: string | null
          utilities_included?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_management_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_management_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_logs: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string | null
          reference_number: string | null
          tenant_management_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          reference_number?: string | null
          tenant_management_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          reference_number?: string | null
          tenant_management_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_logs_tenant_management_id_fkey"
            columns: ["tenant_management_id"]
            isOneToOne: false
            referencedRelation: "tenant_management"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "viewer"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "negotiating"
        | "won"
        | "lost"
      maintenance_status: "pending" | "in_progress" | "completed" | "cancelled"
      payment_status: "pending" | "paid" | "overdue" | "cancelled"
      property_status:
        | "available"
        | "under_offer"
        | "sold"
        | "rented"
        | "off_market"
      property_type: "residential" | "commercial" | "land" | "industrial"
      transaction_type: "sale" | "lease" | "rent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agent", "viewer"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "negotiating",
        "won",
        "lost",
      ],
      maintenance_status: ["pending", "in_progress", "completed", "cancelled"],
      payment_status: ["pending", "paid", "overdue", "cancelled"],
      property_status: [
        "available",
        "under_offer",
        "sold",
        "rented",
        "off_market",
      ],
      property_type: ["residential", "commercial", "land", "industrial"],
      transaction_type: ["sale", "lease", "rent"],
    },
  },
} as const

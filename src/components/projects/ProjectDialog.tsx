import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onSuccess: () => void;
}

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    project_name: "",
    project_code: "",
    project_type: "construction",
    construction_type: "",
    project_manager: "",
    site_engineer: "",
    architect_name: "",
    engineer_name: "",
    contractor_name: "",
    contractor_phone: "",
    contractor_email: "",
    client_id: "",
    property_id: "",
    site_address: "",
    city: "",
    state: "",
    total_area_sqft: "",
    number_of_floors: "",
    number_of_units: "",
    start_date: "",
    expected_completion_date: "",
    total_budget: "",
    project_status: "planning",
    health_indicator: "green",
    notes: "",
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id, title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (project) {
      setFormData({
        project_name: project.project_name || "",
        project_code: project.project_code || "",
        project_type: project.project_type || "construction",
        construction_type: project.construction_type || "",
        project_manager: project.project_manager || "",
        site_engineer: project.site_engineer || "",
        architect_name: project.architect_name || "",
        engineer_name: project.engineer_name || "",
        contractor_name: project.contractor_name || "",
        contractor_phone: project.contractor_phone || "",
        contractor_email: project.contractor_email || "",
        client_id: project.client_id || "",
        property_id: project.property_id || "",
        site_address: project.site_address || "",
        city: project.city || "",
        state: project.state || "",
        total_area_sqft: project.total_area_sqft?.toString() || "",
        number_of_floors: project.number_of_floors?.toString() || "",
        number_of_units: project.number_of_units?.toString() || "",
        start_date: project.start_date || "",
        expected_completion_date: project.expected_completion_date || "",
        total_budget: project.total_budget?.toString() || "",
        project_status: project.project_status || "planning",
        health_indicator: project.health_indicator || "green",
        notes: project.notes || "",
      });
    } else {
      setFormData({
        project_name: "",
        project_code: "",
        project_type: "construction",
        construction_type: "",
        project_manager: "",
        site_engineer: "",
        architect_name: "",
        engineer_name: "",
        contractor_name: "",
        contractor_phone: "",
        contractor_email: "",
        client_id: "",
        property_id: "",
        site_address: "",
        city: "",
        state: "",
        total_area_sqft: "",
        number_of_floors: "",
        number_of_units: "",
        start_date: "",
        expected_completion_date: "",
        total_budget: "",
        project_status: "planning",
        health_indicator: "green",
        notes: "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const data: any = {
      ...formData,
      user_id: user.id,
      total_area_sqft: parseFloat(formData.total_area_sqft) || null,
      number_of_floors: parseInt(formData.number_of_floors) || null,
      number_of_units: parseInt(formData.number_of_units) || null,
      total_budget: parseFloat(formData.total_budget) || 0,
      client_id: formData.client_id || null,
      property_id: formData.property_id || null,
    };

    if (project) {
      const { error } = await supabase
        .from("site_projects")
        .update(data)
        .eq("id", project.id);

      if (error) {
        toast.error("Failed to update project");
        return;
      }
      toast.success("Project updated successfully");
    } else {
      const { error } = await supabase.from("site_projects").insert(data);

      if (error) {
        toast.error("Failed to create project");
        return;
      }
      toast.success("Project created successfully");
    }

    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["site_projects"] });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_name">Project Name *</Label>
              <Input
                id="project_name"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="project_code">Project Code</Label>
              <Input
                id="project_code"
                value={formData.project_code}
                onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_type">Project Type *</Label>
              <Select value={formData.project_type} onValueChange={(value) => setFormData({ ...formData, project_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="construction_type">Construction Type</Label>
              <Input
                id="construction_type"
                value={formData.construction_type}
                onChange={(e) => setFormData({ ...formData, construction_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client_id">Client</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="property_id">Property</Label>
              <Select value={formData.property_id} onValueChange={(value) => setFormData({ ...formData, property_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property: any) => (
                    <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="site_address">Site Address *</Label>
            <Input
              id="site_address"
              value={formData.site_address}
              onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_area_sqft">Total Area (sqft)</Label>
              <Input
                id="total_area_sqft"
                type="number"
                value={formData.total_area_sqft}
                onChange={(e) => setFormData({ ...formData, total_area_sqft: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="number_of_floors">Number of Floors</Label>
              <Input
                id="number_of_floors"
                type="number"
                value={formData.number_of_floors}
                onChange={(e) => setFormData({ ...formData, number_of_floors: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="number_of_units">Number of Units</Label>
              <Input
                id="number_of_units"
                type="number"
                value={formData.number_of_units}
                onChange={(e) => setFormData({ ...formData, number_of_units: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="project_manager">Project Manager</Label>
              <Input
                id="project_manager"
                value={formData.project_manager}
                onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="site_engineer">Site Engineer</Label>
              <Input
                id="site_engineer"
                value={formData.site_engineer}
                onChange={(e) => setFormData({ ...formData, site_engineer: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="architect_name">Architect</Label>
              <Input
                id="architect_name"
                value={formData.architect_name}
                onChange={(e) => setFormData({ ...formData, architect_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="engineer_name">Engineer</Label>
              <Input
                id="engineer_name"
                value={formData.engineer_name}
                onChange={(e) => setFormData({ ...formData, engineer_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="contractor_name">Contractor Name</Label>
              <Input
                id="contractor_name"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contractor_phone">Contractor Phone</Label>
              <Input
                id="contractor_phone"
                value={formData.contractor_phone}
                onChange={(e) => setFormData({ ...formData, contractor_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contractor_email">Contractor Email</Label>
              <Input
                id="contractor_email"
                type="email"
                value={formData.contractor_email}
                onChange={(e) => setFormData({ ...formData, contractor_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="expected_completion_date">Expected Completion Date</Label>
              <Input
                id="expected_completion_date"
                type="date"
                value={formData.expected_completion_date}
                onChange={(e) => setFormData({ ...formData, expected_completion_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_budget">Total Budget</Label>
              <Input
                id="total_budget"
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="project_status">Project Status</Label>
              <Select value={formData.project_status} onValueChange={(value) => setFormData({ ...formData, project_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="health_indicator">Health Indicator</Label>
              <Select value={formData.health_indicator} onValueChange={(value) => setFormData({ ...formData, health_indicator: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{project ? "Update" : "Create"} Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

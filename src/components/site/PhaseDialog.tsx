import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PhaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function PhaseDialog({ open, onOpenChange, projectId }: PhaseDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phase_name: "",
    phase_code: "",
    description: "",
    status: "not_started",
    phase_order: 0,
    budget_allocated: "",
    planned_start_date: "",
    planned_end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("site_phases").insert({
      project_id: projectId,
      ...formData,
      budget_allocated: parseFloat(formData.budget_allocated) || 0,
    });

    if (error) {
      toast.error("Failed to add phase");
      return;
    }

    toast.success("Phase added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_phases", projectId] });
    onOpenChange(false);
    setFormData({
      phase_name: "",
      phase_code: "",
      description: "",
      status: "not_started",
      phase_order: 0,
      budget_allocated: "",
      planned_start_date: "",
      planned_end_date: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Project Phase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phase_name">Phase Name *</Label>
              <Input
                id="phase_name"
                value={formData.phase_name}
                onChange={(e) => setFormData({ ...formData, phase_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="phase_code">Phase Code</Label>
              <Input
                id="phase_code"
                value={formData.phase_code}
                onChange={(e) => setFormData({ ...formData, phase_code: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget_allocated">Budget Allocated</Label>
              <Input
                id="budget_allocated"
                type="number"
                value={formData.budget_allocated}
                onChange={(e) => setFormData({ ...formData, budget_allocated: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planned_start_date">Planned Start Date</Label>
              <Input
                id="planned_start_date"
                type="date"
                value={formData.planned_start_date}
                onChange={(e) => setFormData({ ...formData, planned_start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="planned_end_date">Planned End Date</Label>
              <Input
                id="planned_end_date"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Phase</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
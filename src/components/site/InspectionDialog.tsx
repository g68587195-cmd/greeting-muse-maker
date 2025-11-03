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

interface InspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InspectionDialog({ open, onOpenChange, projectId }: InspectionDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    inspection_type: "",
    inspected_by: "",
    inspection_date: new Date().toISOString().split('T')[0],
    inspection_area: "",
    observations: "",
    issues_found: "",
    quality_rating: "",
    approval_status: "pending",
    corrective_actions: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("site_inspections").insert({
      project_id: projectId,
      ...formData,
    });

    if (error) {
      toast.error("Failed to add inspection");
      return;
    }

    toast.success("Inspection added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_inspections", projectId] });
    onOpenChange(false);
    setFormData({
      inspection_type: "",
      inspected_by: "",
      inspection_date: new Date().toISOString().split('T')[0],
      inspection_area: "",
      observations: "",
      issues_found: "",
      quality_rating: "",
      approval_status: "pending",
      corrective_actions: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inspection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspection_type">Inspection Type</Label>
              <Input
                id="inspection_type"
                value={formData.inspection_type}
                onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                placeholder="Quality, Safety, Progress, etc."
              />
            </div>
            <div>
              <Label htmlFor="inspection_date">Inspection Date *</Label>
              <Input
                id="inspection_date"
                type="date"
                value={formData.inspection_date}
                onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="inspected_by">Inspected By *</Label>
              <Input
                id="inspected_by"
                value={formData.inspected_by}
                onChange={(e) => setFormData({ ...formData, inspected_by: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="inspection_area">Inspection Area</Label>
              <Input
                id="inspection_area"
                value={formData.inspection_area}
                onChange={(e) => setFormData({ ...formData, inspection_area: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="observations">Observations</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="issues_found">Issues Found</Label>
            <Textarea
              id="issues_found"
              value={formData.issues_found}
              onChange={(e) => setFormData({ ...formData, issues_found: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quality_rating">Quality Rating</Label>
              <Select value={formData.quality_rating} onValueChange={(value) => setFormData({ ...formData, quality_rating: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="satisfactory">Satisfactory</SelectItem>
                  <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="approval_status">Approval Status</Label>
              <Select value={formData.approval_status} onValueChange={(value) => setFormData({ ...formData, approval_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="corrective_actions">Corrective Actions</Label>
            <Textarea
              id="corrective_actions"
              value={formData.corrective_actions}
              onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
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
            <Button type="submit">Add Inspection</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
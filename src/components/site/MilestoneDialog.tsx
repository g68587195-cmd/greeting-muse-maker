import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteProgressId: string;
  milestone?: any;
  onSuccess: () => void;
}

export function MilestoneDialog({ open, onOpenChange, siteProgressId, milestone, onSuccess }: MilestoneDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: any = {
      site_progress_id: siteProgressId,
      milestone_name: formData.get("milestone_name"),
      milestone_description: formData.get("milestone_description"),
      status: formData.get("status"),
      planned_start_date: formData.get("planned_start_date") || null,
      planned_end_date: formData.get("planned_end_date") || null,
      actual_start_date: formData.get("actual_start_date") || null,
      actual_end_date: formData.get("actual_end_date") || null,
      progress_percentage: parseFloat(formData.get("progress_percentage") as string) || 0,
      budget_allocated: parseFloat((formData.get("budget_allocated") as string).replace(/,/g, '')) || null,
      budget_spent: parseFloat((formData.get("budget_spent") as string).replace(/,/g, '')) || null,
      dependencies: formData.get("dependencies") || null,
      notes: formData.get("notes") || null,
    };

    try {
      if (milestone) {
        const { error } = await supabase
          .from("site_milestones")
          .update(data)
          .eq("id", milestone.id);
        if (error) throw error;
        toast.success("Milestone updated successfully");
      } else {
        const { error } = await supabase
          .from("site_milestones")
          .insert(data);
        if (error) throw error;
        toast.success("Milestone created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save milestone");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? "Edit" : "Add"} Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="milestone_name">Milestone Name *</Label>
            <Input
              id="milestone_name"
              name="milestone_name"
              defaultValue={milestone?.milestone_name}
              required
            />
          </div>

          <div>
            <Label htmlFor="milestone_description">Description</Label>
            <Textarea
              id="milestone_description"
              name="milestone_description"
              defaultValue={milestone?.milestone_description}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={milestone?.status || "not_started"}>
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
              <Label htmlFor="progress_percentage">Progress %</Label>
              <Input
                type="number"
                id="progress_percentage"
                name="progress_percentage"
                min="0"
                max="100"
                defaultValue={milestone?.progress_percentage || 0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="planned_start_date">Planned Start Date</Label>
              <Input
                type="date"
                id="planned_start_date"
                name="planned_start_date"
                defaultValue={milestone?.planned_start_date}
              />
            </div>

            <div>
              <Label htmlFor="planned_end_date">Planned End Date</Label>
              <Input
                type="date"
                id="planned_end_date"
                name="planned_end_date"
                defaultValue={milestone?.planned_end_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="actual_start_date">Actual Start Date</Label>
              <Input
                type="date"
                id="actual_start_date"
                name="actual_start_date"
                defaultValue={milestone?.actual_start_date}
              />
            </div>

            <div>
              <Label htmlFor="actual_end_date">Actual End Date</Label>
              <Input
                type="date"
                id="actual_end_date"
                name="actual_end_date"
                defaultValue={milestone?.actual_end_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_allocated">Budget Allocated (₹)</Label>
              <NumberInput
                id="budget_allocated"
                name="budget_allocated"
                value={milestone?.budget_allocated || ""}
              />
            </div>

            <div>
              <Label htmlFor="budget_spent">Budget Spent (₹)</Label>
              <NumberInput
                id="budget_spent"
                name="budget_spent"
                value={milestone?.budget_spent || ""}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dependencies">Dependencies</Label>
            <Input
              id="dependencies"
              name="dependencies"
              defaultValue={milestone?.dependencies}
              placeholder="e.g., Foundation work must be completed"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={milestone?.notes}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : milestone ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

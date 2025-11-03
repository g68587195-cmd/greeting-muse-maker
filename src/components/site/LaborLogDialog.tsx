import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface LaborLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function LaborLogDialog({ open, onOpenChange, projectId }: LaborLogDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    labor_type: "",
    total_count: "",
    wage_per_person: "",
    hours_worked: "",
    log_date: new Date().toISOString().split('T')[0],
    contractor_name: "",
    work_completed: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalCount = parseInt(formData.total_count) || 0;
    const wagePerPerson = parseFloat(formData.wage_per_person) || 0;
    const totalWages = totalCount * wagePerPerson;

    const { error } = await supabase.from("site_labor_log").insert({
      project_id: projectId,
      ...formData,
      total_count: totalCount,
      wage_per_person: wagePerPerson,
      total_wages: totalWages,
      hours_worked: parseFloat(formData.hours_worked) || null,
    });

    if (error) {
      toast.error("Failed to add labor log");
      return;
    }

    toast.success("Labor log added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_labor_log", projectId] });
    onOpenChange(false);
    setFormData({
      labor_type: "",
      total_count: "",
      wage_per_person: "",
      hours_worked: "",
      log_date: new Date().toISOString().split('T')[0],
      contractor_name: "",
      work_completed: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Labor Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labor_type">Labor Type *</Label>
              <Input
                id="labor_type"
                value={formData.labor_type}
                onChange={(e) => setFormData({ ...formData, labor_type: e.target.value })}
                placeholder="Mason, Carpenter, Helper, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="log_date">Date *</Label>
              <Input
                id="log_date"
                type="date"
                value={formData.log_date}
                onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="total_count">Total Count *</Label>
              <Input
                id="total_count"
                type="number"
                value={formData.total_count}
                onChange={(e) => setFormData({ ...formData, total_count: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="wage_per_person">Wage Per Person</Label>
              <Input
                id="wage_per_person"
                type="number"
                step="0.01"
                value={formData.wage_per_person}
                onChange={(e) => setFormData({ ...formData, wage_per_person: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hours_worked">Hours Worked</Label>
              <Input
                id="hours_worked"
                type="number"
                step="0.5"
                value={formData.hours_worked}
                onChange={(e) => setFormData({ ...formData, hours_worked: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contractor_name">Contractor Name</Label>
            <Input
              id="contractor_name"
              value={formData.contractor_name}
              onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="work_completed">Work Completed</Label>
            <Textarea
              id="work_completed"
              value={formData.work_completed}
              onChange={(e) => setFormData({ ...formData, work_completed: e.target.value })}
            />
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
            <Button type="submit">Add Labor Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
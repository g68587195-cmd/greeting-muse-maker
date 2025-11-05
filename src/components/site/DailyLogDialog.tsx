import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";

interface DailyLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function DailyLogDialog({ open, onOpenChange, projectId }: DailyLogDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    phase_id: "",
    work_completed: "",
    labor_count: "",
    weather_conditions: "",
    issues_reported: "",
    materials_used: "",
    equipment_used: "",
    notes: "",
  });

  const { data: phases = [] } = useQuery({
    queryKey: ["site_phases", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("phase_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("site_daily_logs").insert({
      project_id: projectId,
      phase_id: formData.phase_id || null,
      ...formData,
      labor_count: parseInt(formData.labor_count) || 0,
    });

    if (error) {
      toast.error("Failed to add daily log");
      return;
    }

    toast.success("Daily log added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_daily_logs", projectId] });
    onOpenChange(false);
    setFormData({
      log_date: new Date().toISOString().split('T')[0],
      phase_id: "",
      work_completed: "",
      labor_count: "",
      weather_conditions: "",
      issues_reported: "",
      materials_used: "",
      equipment_used: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Daily Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <Label htmlFor="phase_id">Project Phase</Label>
            <Select value={formData.phase_id} onValueChange={(value) => setFormData({ ...formData, phase_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select phase (optional)" />
              </SelectTrigger>
              <SelectContent>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.phase_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="work_completed">Work Completed *</Label>
            <Textarea
              id="work_completed"
              value={formData.work_completed}
              onChange={(e) => setFormData({ ...formData, work_completed: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labor_count">Labor Count</Label>
              <Input
                id="labor_count"
                type="number"
                value={formData.labor_count}
                onChange={(e) => setFormData({ ...formData, labor_count: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weather_conditions">Weather Conditions</Label>
              <Input
                id="weather_conditions"
                value={formData.weather_conditions}
                onChange={(e) => setFormData({ ...formData, weather_conditions: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="materials_used">Materials Used</Label>
            <Textarea
              id="materials_used"
              value={formData.materials_used}
              onChange={(e) => setFormData({ ...formData, materials_used: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="equipment_used">Equipment Used</Label>
            <Textarea
              id="equipment_used"
              value={formData.equipment_used}
              onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="issues_reported">Issues Reported</Label>
            <Textarea
              id="issues_reported"
              value={formData.issues_reported}
              onChange={(e) => setFormData({ ...formData, issues_reported: e.target.value })}
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
            <Button type="submit">Add Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
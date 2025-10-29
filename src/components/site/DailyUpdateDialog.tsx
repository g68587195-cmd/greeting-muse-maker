import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DailyUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteProgressId: string;
  update?: any;
  onSuccess: () => void;
}

export function DailyUpdateDialog({ open, onOpenChange, siteProgressId, update, onSuccess }: DailyUpdateDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const data: any = {
      site_progress_id: siteProgressId,
      update_date: formData.get("update_date"),
      work_completed: formData.get("work_completed"),
      materials_used: formData.get("materials_used") || null,
      equipment_used: formData.get("equipment_used") || null,
      labor_count: parseInt(formData.get("labor_count") as string) || null,
      weather_conditions: formData.get("weather_conditions") || null,
      delays_encountered: formData.get("delays_encountered") || null,
      safety_incidents: formData.get("safety_incidents") || null,
      supervisor_name: formData.get("supervisor_name") || null,
      next_day_plan: formData.get("next_day_plan") || null,
      progress_percentage: parseFloat(formData.get("progress_percentage") as string) || null,
      created_by: user.id,
    };

    try {
      if (update) {
        const { error } = await supabase
          .from("site_daily_updates")
          .update(data)
          .eq("id", update.id);
        if (error) throw error;
        toast.success("Update saved successfully");
      } else {
        const { error } = await supabase
          .from("site_daily_updates")
          .insert(data);
        if (error) throw error;
        toast.success("Daily update added successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{update ? "Edit" : "Add"} Daily Update</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="update_date">Date *</Label>
              <Input
                type="date"
                id="update_date"
                name="update_date"
                defaultValue={update?.update_date || new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <Label htmlFor="progress_percentage">Progress %</Label>
              <Input
                type="number"
                id="progress_percentage"
                name="progress_percentage"
                min="0"
                max="100"
                step="0.1"
                defaultValue={update?.progress_percentage}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="work_completed">Work Completed *</Label>
            <Textarea
              id="work_completed"
              name="work_completed"
              defaultValue={update?.work_completed}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="materials_used">Materials Used</Label>
            <Textarea
              id="materials_used"
              name="materials_used"
              defaultValue={update?.materials_used}
              rows={2}
              placeholder="e.g., 10 bags cement, 1000 bricks"
            />
          </div>

          <div>
            <Label htmlFor="equipment_used">Equipment Used</Label>
            <Input
              id="equipment_used"
              name="equipment_used"
              defaultValue={update?.equipment_used}
              placeholder="e.g., Excavator, Concrete mixer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="labor_count">Labor Count</Label>
              <Input
                type="number"
                id="labor_count"
                name="labor_count"
                min="0"
                defaultValue={update?.labor_count}
              />
            </div>

            <div>
              <Label htmlFor="supervisor_name">Supervisor Name</Label>
              <Input
                id="supervisor_name"
                name="supervisor_name"
                defaultValue={update?.supervisor_name}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="weather_conditions">Weather Conditions</Label>
            <Input
              id="weather_conditions"
              name="weather_conditions"
              defaultValue={update?.weather_conditions}
              placeholder="e.g., Sunny, Rainy"
            />
          </div>

          <div>
            <Label htmlFor="delays_encountered">Delays Encountered</Label>
            <Textarea
              id="delays_encountered"
              name="delays_encountered"
              defaultValue={update?.delays_encountered}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="safety_incidents">Safety Incidents</Label>
            <Textarea
              id="safety_incidents"
              name="safety_incidents"
              defaultValue={update?.safety_incidents}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="next_day_plan">Next Day Plan</Label>
            <Textarea
              id="next_day_plan"
              name="next_day_plan"
              defaultValue={update?.next_day_plan}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : update ? "Update" : "Add Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

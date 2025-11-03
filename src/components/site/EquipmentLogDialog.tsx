import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EquipmentLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function EquipmentLogDialog({ open, onOpenChange, projectId }: EquipmentLogDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    equipment_name: "",
    equipment_type: "",
    usage_duration: "",
    rental_cost: "",
    fuel_cost: "",
    operator_name: "",
    log_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("site_equipment_log").insert({
      project_id: projectId,
      ...formData,
      usage_duration: parseFloat(formData.usage_duration) || 0,
      rental_cost: parseFloat(formData.rental_cost) || 0,
      fuel_cost: parseFloat(formData.fuel_cost) || 0,
    });

    if (error) {
      toast.error("Failed to add equipment log");
      return;
    }

    toast.success("Equipment log added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_equipment_log", projectId] });
    onOpenChange(false);
    setFormData({
      equipment_name: "",
      equipment_type: "",
      usage_duration: "",
      rental_cost: "",
      fuel_cost: "",
      operator_name: "",
      log_date: new Date().toISOString().split('T')[0],
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Equipment Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment_name">Equipment Name *</Label>
              <Input
                id="equipment_name"
                value={formData.equipment_name}
                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="equipment_type">Equipment Type</Label>
              <Input
                id="equipment_type"
                value={formData.equipment_type}
                onChange={(e) => setFormData({ ...formData, equipment_type: e.target.value })}
                placeholder="Excavator, Crane, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="usage_duration">Usage Duration (hrs)</Label>
              <Input
                id="usage_duration"
                type="number"
                step="0.5"
                value={formData.usage_duration}
                onChange={(e) => setFormData({ ...formData, usage_duration: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="rental_cost">Rental Cost</Label>
              <Input
                id="rental_cost"
                type="number"
                step="0.01"
                value={formData.rental_cost}
                onChange={(e) => setFormData({ ...formData, rental_cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="fuel_cost">Fuel Cost</Label>
              <Input
                id="fuel_cost"
                type="number"
                step="0.01"
                value={formData.fuel_cost}
                onChange={(e) => setFormData({ ...formData, fuel_cost: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operator_name">Operator Name</Label>
              <Input
                id="operator_name"
                value={formData.operator_name}
                onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
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
            <Button type="submit">Add Equipment Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
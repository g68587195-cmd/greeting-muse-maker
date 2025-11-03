import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface MaterialLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function MaterialLogDialog({ open, onOpenChange, projectId }: MaterialLogDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    material_name: "",
    material_category: "",
    quantity_issued: "",
    unit: "",
    cost_per_unit: "",
    supplier_name: "",
    log_date: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantityIssued = parseFloat(formData.quantity_issued) || 0;
    const costPerUnit = parseFloat(formData.cost_per_unit) || 0;
    const totalCost = quantityIssued * costPerUnit;

    const { error } = await supabase.from("site_materials_log").insert({
      project_id: projectId,
      ...formData,
      quantity_issued: quantityIssued,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
    });

    if (error) {
      toast.error("Failed to add material log");
      return;
    }

    toast.success("Material log added successfully");
    queryClient.invalidateQueries({ queryKey: ["site_materials_log", projectId] });
    onOpenChange(false);
    setFormData({
      material_name: "",
      material_category: "",
      quantity_issued: "",
      unit: "",
      cost_per_unit: "",
      supplier_name: "",
      log_date: new Date().toISOString().split('T')[0],
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Material Log</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="material_name">Material Name *</Label>
              <Input
                id="material_name"
                value={formData.material_name}
                onChange={(e) => setFormData({ ...formData, material_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="material_category">Category</Label>
              <Input
                id="material_category"
                value={formData.material_category}
                onChange={(e) => setFormData({ ...formData, material_category: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity_issued">Quantity Issued *</Label>
              <Input
                id="quantity_issued"
                type="number"
                step="0.01"
                value={formData.quantity_issued}
                onChange={(e) => setFormData({ ...formData, quantity_issued: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="kg, pcs, m³, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="cost_per_unit">Cost Per Unit</Label>
              <Input
                id="cost_per_unit"
                type="number"
                step="0.01"
                value={formData.cost_per_unit}
                onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_name">Supplier Name</Label>
              <Input
                id="supplier_name"
                value={formData.supplier_name}
                onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
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
            <Button type="submit">Add Material Log</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
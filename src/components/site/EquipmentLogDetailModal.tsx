import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Truck, DollarSign, Fuel, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface EquipmentLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function EquipmentLogDetailModal({ open, onOpenChange, log, onEdit, onDelete }: EquipmentLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Equipment Log Details</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="mt-1 font-medium">{format(new Date(log.log_date), "PPP")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Equipment
              </p>
              <p className="mt-1 font-medium">{log.equipment_name}</p>
            </div>
          </div>

          {(log.equipment_id || log.equipment_type) && (
            <div className="grid grid-cols-2 gap-4">
              {log.equipment_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Equipment ID</p>
                  <Badge variant="outline">{log.equipment_id}</Badge>
                </div>
              )}
              {log.equipment_type && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge>{log.equipment_type}</Badge>
                </div>
              )}
            </div>
          )}

          {log.condition_status && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Condition Status</p>
              <Badge variant={
                log.condition_status === "good" ? "default" : 
                log.condition_status === "maintenance" ? "secondary" : 
                "destructive"
              }>
                {log.condition_status}
              </Badge>
            </div>
          )}

          {log.usage_duration && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Usage Duration
              </p>
              <p className="mt-1 font-medium">{log.usage_duration} hours</p>
            </div>
          )}

          {(log.fuel_used || log.fuel_cost) && (
            <div className="grid grid-cols-2 gap-4">
              {log.fuel_used && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    Fuel Used
                  </p>
                  <p className="mt-1 font-medium">{log.fuel_used} liters</p>
                </div>
              )}
              {log.fuel_cost && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fuel Cost</p>
                  <p className="mt-1 font-medium">₹{formatIndianNumber(log.fuel_cost)}</p>
                </div>
              )}
            </div>
          )}

          {log.rental_cost && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Rental Cost
              </p>
              <p className="mt-1 font-medium text-primary">₹{formatIndianNumber(log.rental_cost)}</p>
            </div>
          )}

          {log.operator_name && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Operator Name</p>
              <p className="mt-1">{log.operator_name}</p>
            </div>
          )}

          {log.maintenance_notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Maintenance Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{log.maintenance_notes}</p>
            </div>
          )}

          {log.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Additional Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{log.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

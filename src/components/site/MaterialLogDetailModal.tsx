import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Package, DollarSign, User } from "lucide-react";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface MaterialLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function MaterialLogDetailModal({ open, onOpenChange, log, onEdit, onDelete }: MaterialLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Material Log Details</span>
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
                <Package className="h-4 w-4" />
                Material
              </p>
              <p className="mt-1 font-medium">{log.material_name}</p>
            </div>
          </div>

          {log.material_code && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Material Code</p>
              <Badge variant="outline">{log.material_code}</Badge>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity Issued</p>
              <p className="mt-1 font-medium">{log.quantity_issued} {log.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quantity Used</p>
              <p className="mt-1 font-medium">{log.quantity_used || 0} {log.unit}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className="mt-1 font-medium">{log.quantity_remaining || 0} {log.unit}</p>
            </div>
          </div>

          {log.cost_per_unit && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Cost per Unit
                </p>
                <p className="mt-1 font-medium">₹{formatIndianNumber(log.cost_per_unit)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="mt-1 font-medium text-primary">₹{formatIndianNumber(log.total_cost || 0)}</p>
              </div>
            </div>
          )}

          {log.supplier_name && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="mt-1">{log.supplier_name}</p>
              </div>
              {log.source && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <p className="mt-1">{log.source}</p>
                </div>
              )}
            </div>
          )}

          {log.issued_to && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Issued To
              </p>
              <p className="mt-1">{log.issued_to}</p>
            </div>
          )}

          {log.material_category && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <Badge>{log.material_category}</Badge>
            </div>
          )}

          {log.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{log.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

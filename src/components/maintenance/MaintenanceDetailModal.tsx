import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, DollarSign, AlertCircle } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface MaintenanceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onEdit: () => void;
  onDelete: () => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "critical": return "destructive";
    case "high": return "destructive";
    case "medium": return "default";
    case "low": return "secondary";
    default: return "outline";
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed": return "default";
    case "in_progress": return "secondary";
    case "pending": return "outline";
    case "cancelled": return "destructive";
    default: return "outline";
  }
};

export function MaintenanceDetailModal({
  open,
  onOpenChange,
  request,
  onEdit,
  onDelete,
}: MaintenanceDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl pr-4">{request.title}</DialogTitle>
            <div className="flex gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Status:</span>
                <Badge variant={getStatusColor(request.status)}>
                  {request.status?.replace("_", " ")}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Priority:</span>
                <Badge variant={getPriorityColor(request.priority)}>
                  {request.priority}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Created:</span>
                <span>{new Date(request.created_at).toLocaleDateString()}</span>
              </div>

              {request.scheduled_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Scheduled:</span>
                  <span>{new Date(request.scheduled_date).toLocaleDateString()}</span>
                </div>
              )}

              {request.completed_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Completed:</span>
                  <span>{new Date(request.completed_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {request.properties && (
                <div className="text-sm">
                  <span className="font-semibold">Property:</span>
                  <div className="mt-1 text-muted-foreground">{request.properties.title}</div>
                </div>
              )}

              {request.estimated_cost && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Estimated Cost:</span>
                  <span>₹{formatIndianNumber(request.estimated_cost)}</span>
                </div>
              )}

              {request.actual_cost && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">Actual Cost:</span>
                  <span className="font-bold text-primary">₹{formatIndianNumber(request.actual_cost)}</span>
                </div>
              )}

              {request.assigned_to && (
                <div className="text-sm">
                  <span className="font-semibold">Assigned To:</span>
                  <div className="mt-1 text-muted-foreground">{request.assigned_to}</div>
                </div>
              )}
            </div>
          </div>

          {request.description && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.description}
              </p>
            </div>
          )}

          {request.notes && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {request.notes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

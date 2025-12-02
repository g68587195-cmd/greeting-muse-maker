import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface InspectionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspection: any;
  onEdit: () => void;
  onDelete: () => void;
  projectId: string;
}

export function InspectionDetailModal({ open, onOpenChange, inspection, onEdit, onDelete, projectId }: InspectionDetailModalProps) {
  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!inspection) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    const { error } = await supabase
      .from("site_inspections")
      .update({ approval_status: newStatus })
      .eq("id", inspection.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["site_inspections", projectId] });
    }
    setIsUpdatingStatus(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Inspection Details</span>
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
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="mt-1 font-medium">{inspection.inspection_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date</p>
              <p className="mt-1 font-medium">{format(new Date(inspection.inspection_date), "PPP")}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Approval Status</p>
            <Select 
              value={inspection.approval_status} 
              onValueChange={handleStatusUpdate}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inspected By</p>
              <p className="mt-1">{inspection.inspected_by}</p>
            </div>
            {inspection.inspector_designation && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Designation</p>
                <p className="mt-1">{inspection.inspector_designation}</p>
              </div>
            )}
          </div>

          {inspection.inspection_area && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Inspection Area</p>
              <p className="mt-1">{inspection.inspection_area}</p>
            </div>
          )}

          {inspection.observations && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Observations</p>
              <p className="mt-1 whitespace-pre-wrap">{inspection.observations}</p>
            </div>
          )}

          {inspection.quality_rating && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Quality Rating</p>
              <Badge className="mt-1">{inspection.quality_rating}</Badge>
            </div>
          )}

          {inspection.issues_found && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Issues Found</p>
              <p className="mt-1 text-destructive whitespace-pre-wrap">{inspection.issues_found}</p>
            </div>
          )}

          {inspection.corrective_actions && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Corrective Actions</p>
              <p className="mt-1 whitespace-pre-wrap">{inspection.corrective_actions}</p>
            </div>
          )}

          {inspection.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap">{inspection.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

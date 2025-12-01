import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, DollarSign, Clock } from "lucide-react";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface LaborLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function LaborLogDetailModal({ open, onOpenChange, log, onEdit, onDelete }: LaborLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Labor Log Details</span>
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
                <Users className="h-4 w-4" />
                Total Count
              </p>
              <p className="mt-1 font-medium text-primary">{log.total_count} workers</p>
            </div>
          </div>

          {log.labor_type && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Labor Type</p>
              <Badge>{log.labor_type}</Badge>
            </div>
          )}

          {log.hours_worked && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Hours Worked
                </p>
                <p className="mt-1 font-medium">{log.hours_worked} hours</p>
              </div>
              {log.attendance_status && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                  <Badge variant={log.attendance_status === "present" ? "default" : "secondary"}>
                    {log.attendance_status}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {(log.wage_per_person || log.total_wages) && (
            <div className="grid grid-cols-2 gap-4">
              {log.wage_per_person && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Wage per Person
                  </p>
                  <p className="mt-1 font-medium">₹{formatIndianNumber(log.wage_per_person)}</p>
                </div>
              )}
              {log.total_wages && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Wages</p>
                  <p className="mt-1 font-medium text-primary">₹{formatIndianNumber(log.total_wages)}</p>
                </div>
              )}
            </div>
          )}

          {log.supervisor_name && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supervisor</p>
                <p className="mt-1">{log.supervisor_name}</p>
              </div>
              {log.contractor_name && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contractor</p>
                  <p className="mt-1">{log.contractor_name}</p>
                </div>
              )}
            </div>
          )}

          {log.work_completed && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Work Completed</p>
              <p className="mt-1 whitespace-pre-wrap">{log.work_completed}</p>
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

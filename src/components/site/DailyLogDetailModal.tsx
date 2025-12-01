import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface DailyLogDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: any;
  onEdit: () => void;
  onDelete: () => void;
}

export function DailyLogDetailModal({ open, onOpenChange, log, onEdit, onDelete }: DailyLogDetailModalProps) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Daily Log Details</span>
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
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date
              </p>
              <p className="mt-1 font-medium">{format(new Date(log.log_date), "PPP")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Labor Count
              </p>
              <p className="mt-1 font-medium">{log.labor_count || 0} workers</p>
            </div>
          </div>

          {log.supervisor_name && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Supervisor</p>
              <p className="mt-1">{log.supervisor_name}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-muted-foreground">Work Completed</p>
            <p className="mt-1 whitespace-pre-wrap">{log.work_completed}</p>
          </div>

          {log.progress_summary && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Progress Summary</p>
              <p className="mt-1 whitespace-pre-wrap">{log.progress_summary}</p>
            </div>
          )}

          {log.weather_conditions && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weather</p>
                <p className="mt-1">{log.weather_conditions}</p>
              </div>
              {log.temperature && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                  <p className="mt-1">{log.temperature}</p>
                </div>
              )}
            </div>
          )}

          {log.issues_reported && (
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Issues Reported
              </p>
              <p className="mt-1 whitespace-pre-wrap text-destructive">{log.issues_reported}</p>
            </div>
          )}

          {log.delays_encountered && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delays Encountered</p>
              <p className="mt-1 whitespace-pre-wrap">{log.delays_encountered}</p>
            </div>
          )}

          {log.safety_incidents && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Safety Incidents</p>
              <p className="mt-1 whitespace-pre-wrap">{log.safety_incidents}</p>
            </div>
          )}

          {log.next_day_plan && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Next Day Plan</p>
              <p className="mt-1 whitespace-pre-wrap">{log.next_day_plan}</p>
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

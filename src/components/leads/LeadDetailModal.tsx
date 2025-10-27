import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Building2, User, Calendar, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface LeadDetailModalProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (lead: any) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-purple-500",
  negotiating: "bg-orange-500",
  converted: "bg-green-500",
  lost: "bg-red-500",
};

export function LeadDetailModal({
  lead,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: LeadDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Lead Details</DialogTitle>
              <DialogDescription>View and manage lead information</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(lead)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(lead.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Badge className={statusColors[lead.status]}>
              {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4">
            {(lead.lead_name || lead.lead_email || lead.lead_phone) && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  {lead.lead_name && <p className="font-medium">{lead.lead_name}</p>}
                  {lead.lead_email && (
                    <p className="text-sm text-muted-foreground">{lead.lead_email}</p>
                  )}
                  {lead.lead_phone && (
                    <p className="text-sm text-muted-foreground">{lead.lead_phone}</p>
                  )}
                </div>
              </div>
            )}

            {lead.properties && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium">{lead.properties.title}</p>
                  <p className="text-sm text-muted-foreground">{lead.properties.address}</p>
                </div>
              </div>
            )}

            {lead.source && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{lead.source.replace('_', ' ')}</p>
                </div>
              </div>
            )}

            {lead.follow_up_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Follow-up Date</p>
                  <p className="font-medium">
                    {new Date(lead.follow_up_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {lead.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(lead.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

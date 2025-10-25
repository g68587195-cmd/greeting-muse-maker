import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Mail, Phone, MapPin, Briefcase, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ClientDetailModalProps {
  client: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: any) => void;
  onDelete: (id: string) => void;
}

export function ClientDetailModal({
  client,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ClientDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Client Details</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(client)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(client.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-bold">{client.full_name}</h3>
            <Badge className="mt-2" variant="secondary">
              {client.client_type || "General"}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{client.phone}</p>
              </div>
            </div>
            {client.address && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{client.address}</p>
                </div>
              </div>
            )}
          </div>

          {client.preferences && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-4">Preferences & Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.preferences.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Occupation</p>
                        <p className="font-medium">{client.preferences.occupation}</p>
                      </div>
                    </div>
                  )}
                  {client.preferences.annual_income && (
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Income</p>
                        <p className="font-medium">{client.preferences.annual_income}</p>
                      </div>
                    </div>
                  )}
                  {(client.preferences.budget_min || client.preferences.budget_max) && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Budget Range</p>
                      <p className="font-medium">
                        {client.preferences.budget_min || "N/A"} - {client.preferences.budget_max || "N/A"}
                      </p>
                    </div>
                  )}
                  {client.preferences.preferred_locations && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Preferred Locations</p>
                      <p className="font-medium">{client.preferences.preferred_locations}</p>
                    </div>
                  )}
                  {client.preferences.property_purpose && (
                    <div>
                      <p className="text-sm text-muted-foreground">Property Purpose</p>
                      <p className="font-medium capitalize">{client.preferences.property_purpose}</p>
                    </div>
                  )}
                  {client.preferences.source && (
                    <div>
                      <p className="text-sm text-muted-foreground">Source</p>
                      <p className="font-medium capitalize">{client.preferences.source.replace('_', ' ')}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {client.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{client.notes}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(client.created_at).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(client.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

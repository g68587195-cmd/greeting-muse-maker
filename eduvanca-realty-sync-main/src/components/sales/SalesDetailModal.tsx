import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Building2, User, IndianRupee, Calendar, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SalesDetailModalProps {
  sale: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (sale: any) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export function SalesDetailModal({
  sale,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: SalesDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Sale Details</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onEdit(sale)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(sale.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Badge className={statusColors[sale.status]}>
              {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
            </Badge>
            <Badge variant="outline">
              {sale.transaction_type === "sale" ? "Sale" : "Lease"}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sale.properties && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="font-medium">{sale.properties.title}</p>
                  <p className="text-sm text-muted-foreground">{sale.properties.address}</p>
                </div>
              </div>
            )}

            {sale.clients && (
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{sale.clients.full_name}</p>
                  {sale.clients.email && (
                    <p className="text-sm text-muted-foreground">{sale.clients.email}</p>
                  )}
                  {sale.clients.phone && (
                    <p className="text-sm text-muted-foreground">{sale.clients.phone}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Sale Price</p>
                <p className="font-semibold text-lg">₹{Number(sale.sale_price).toLocaleString()}</p>
              </div>
            </div>

            {sale.commission_rate && (
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="font-medium">{sale.commission_rate}%</p>
                </div>
              </div>
            )}

            {sale.commission_amount && (
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Commission Amount</p>
                  <p className="font-medium">₹{Number(sale.commission_amount).toLocaleString()}</p>
                </div>
              </div>
            )}

            {sale.contract_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contract Date</p>
                  <p className="font-medium">{new Date(sale.contract_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {sale.closing_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Closing Date</p>
                  <p className="font-medium">{new Date(sale.closing_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>

          {sale.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Notes</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{sale.notes}</p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(sale.created_at).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(sale.updated_at).toLocaleDateString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

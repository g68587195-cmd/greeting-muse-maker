import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, DollarSign, Calendar, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface PaymentDetailModalProps {
  payment: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (payment: any) => void;
  onDelete: (id: string) => void;
}

export function PaymentDetailModal({
  payment,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: PaymentDetailModalProps) {
  if (!payment) return null;

  const statusColors: Record<string, string> = {
    paid: "bg-success text-success-foreground",
    pending: "bg-warning text-warning-foreground",
    overdue: "bg-destructive text-destructive-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex-1">Payment Details</DialogTitle>
            <div className="flex gap-3 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => onEdit(payment)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this payment?")) {
                    onDelete(payment.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    ₹{formatIndianNumber(payment.amount)}
                  </p>
                </div>
              </div>
              <Badge className={statusColors[payment.status] || "bg-muted"}>
                {payment.status}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-semibold">Client</p>
                <p className="text-sm text-muted-foreground">
                  {payment.clients?.full_name || "N/A"}
                </p>
                {payment.clients?.email && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {payment.clients.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm font-semibold">Payment Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(payment.payment_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>

            {payment.due_date && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-semibold">Due Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.due_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            )}

            {payment.payment_method && (
              <div>
                <p className="text-sm font-semibold">Payment Method</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {payment.payment_method.replace("_", " ")}
                </p>
              </div>
            )}

            {payment.reference_number && (
              <div>
                <p className="text-sm font-semibold">Reference Number</p>
                <p className="text-sm text-muted-foreground">
                  {payment.reference_number}
                </p>
              </div>
            )}
          </div>

          {payment.notes && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {payment.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground">
            <p>Created: {format(new Date(payment.created_at), "dd MMM yyyy, HH:mm")}</p>
            <p>Updated: {format(new Date(payment.updated_at), "dd MMM yyyy, HH:mm")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

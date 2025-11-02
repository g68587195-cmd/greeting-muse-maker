import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format, differenceInDays } from "date-fns";
import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TenantPendingPaymentsProps {
  tenantId: string;
}

export function TenantPendingPayments({ tenantId }: TenantPendingPaymentsProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_management")
        .select("*")
        .eq("id", tenantId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["tenant-payment-logs", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_payment_logs")
        .select("*")
        .eq("tenant_management_id", tenantId)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tenant_payment_logs").insert([{
        tenant_management_id: tenantId,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method,
        reference_number: paymentData.reference_number,
        notes: paymentData.notes,
        created_by: user.id,
      }]);

      if (error) throw error;

      // Update tenant's last payment date and status
      await supabase
        .from("tenant_management")
        .update({
          last_payment_date: paymentData.payment_date,
          payment_status: "current",
        })
        .eq("id", tenantId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["tenant-payment-logs", tenantId] });
      toast.success("Payment recorded successfully");
      setPaymentDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const handleRecordPayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    recordPaymentMutation.mutate({
      amount: parseFloat(formData.get("amount") as string),
      payment_date: formData.get("payment_date") as string,
      payment_method: formData.get("payment_method") as string,
      reference_number: formData.get("reference_number") as string,
      notes: formData.get("notes") as string,
    });
  };

  if (tenantLoading) {
    return <div className="animate-pulse h-32 bg-muted rounded-lg" />;
  }

  if (!tenant) {
    return null;
  }

  const today = new Date();
  const nextPaymentDate = tenant.next_payment_date ? new Date(tenant.next_payment_date) : null;
  const daysUntilPayment = nextPaymentDate ? differenceInDays(nextPaymentDate, today) : null;
  const isOverdue = daysUntilPayment !== null && daysUntilPayment < 0;
  const isDueSoon = daysUntilPayment !== null && daysUntilPayment >= 0 && daysUntilPayment <= 5;

  return (
    <>
      <Card className={isOverdue ? "border-red-500" : isDueSoon ? "border-yellow-500" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Payment Status</CardTitle>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Rent</p>
              <p className="text-2xl font-bold text-primary">
                ₹{formatIndianNumber(tenant.rental_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <Badge
                className={
                  tenant.payment_status === "current"
                    ? "bg-green-500"
                    : tenant.payment_status === "late"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }
              >
                {tenant.payment_status}
              </Badge>
            </div>
          </div>

          {nextPaymentDate && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted">
              {isOverdue ? (
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              ) : isDueSoon ? (
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">
                  {isOverdue
                    ? "Payment Overdue!"
                    : isDueSoon
                    ? "Payment Due Soon"
                    : "Next Payment"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(nextPaymentDate, "dd MMM yyyy")} 
                  {daysUntilPayment !== null && (
                    <span className={isOverdue ? "text-red-500 font-medium ml-1" : "ml-1"}>
                      ({Math.abs(daysUntilPayment)} day{Math.abs(daysUntilPayment) !== 1 ? "s" : ""} {isOverdue ? "overdue" : "left"})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {tenant.last_payment_date && (
            <div>
              <p className="text-sm text-muted-foreground">Last Payment</p>
              <p className="text-sm font-medium">
                {format(new Date(tenant.last_payment_date), "dd MMM yyyy")}
              </p>
            </div>
          )}

          <Button
            onClick={() => {
              setSelectedTenant(tenant);
              setPaymentDialogOpen(true);
            }}
            className="w-full"
          >
            Record Payment
          </Button>

          {/* Payment History */}
          {paymentLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Payments</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {paymentLogs.slice(0, 10).map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        ₹{formatIndianNumber(log.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(log.payment_date), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      {log.payment_method && (
                        <p className="text-xs font-medium">{log.payment_method}</p>
                      )}
                      {log.reference_number && (
                        <p className="text-xs text-muted-foreground">Ref: {log.reference_number}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a new rent payment for this tenant
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                defaultValue={tenant?.rental_amount}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                required
                defaultValue={format(new Date(), "yyyy-MM-dd")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                name="payment_method"
                placeholder="Cash, Bank Transfer, Cheque, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                name="reference_number"
                placeholder="Transaction ID, Cheque No., etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={recordPaymentMutation.isPending}
              >
                {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

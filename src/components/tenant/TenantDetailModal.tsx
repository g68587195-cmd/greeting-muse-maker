import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

interface TenantDetailModalProps {
  tenant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}

export function TenantDetailModal({ tenant, open, onOpenChange, onEdit }: TenantDetailModalProps) {
  const [paymentForm, setPaymentForm] = useState({
    payment_date: "",
    amount: "",
    payment_method: "cash",
    reference_number: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data: paymentLogs = [] } = useQuery({
    queryKey: ["tenant-payments", tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from("tenant_payment_logs")
        .select("*")
        .eq("tenant_management_id", tenant.id)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!tenant?.id,
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("tenant_payment_logs").insert([{
        ...data,
        tenant_management_id: tenant.id,
        amount: parseFloat(data.amount),
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments", tenant.id] });
      toast.success("Payment recorded");
      setPaymentForm({ payment_date: "", amount: "", payment_method: "cash", reference_number: "", notes: "" });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_payment_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-payments", tenant.id] });
      toast.success("Payment deleted");
    },
  });

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tenant Details - {tenant.clients?.full_name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="payments">Payment Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Property</p>
                <p className="font-medium">{tenant.properties?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unit Type</p>
                <p className="font-medium">{tenant.unit_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">₹{tenant.rental_amount?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{tenant.lease_status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lease Period</p>
                <p className="font-medium">
                  {format(new Date(tenant.lease_start_date), "dd MMM yyyy")} - {format(new Date(tenant.lease_end_date), "dd MMM yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{tenant.clients?.phone}</p>
                <p className="text-sm text-muted-foreground">{tenant.clients?.email}</p>
              </div>
            </div>
            <Button onClick={onEdit}>Edit Tenant</Button>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Record New Payment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentForm.payment_date}
                      onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Amount *</Label>
                    <Input
                      type="number"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentForm.payment_method}
                      onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reference Number</Label>
                    <Input
                      value={paymentForm.reference_number}
                      onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                      placeholder="Transaction/Ref ID"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  className="mt-4"
                  onClick={() => addPaymentMutation.mutate(paymentForm)}
                  disabled={!paymentForm.payment_date || !paymentForm.amount}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold">Payment History</h3>
              {paymentLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No payments recorded yet</p>
              ) : (
                paymentLogs.map((log: any) => (
                  <Card key={log.id}>
                    <CardContent className="p-4 flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium">₹{log.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.payment_date), "dd MMM yyyy")} • {log.payment_method}
                        </p>
                        {log.reference_number && (
                          <p className="text-xs text-muted-foreground">Ref: {log.reference_number}</p>
                        )}
                        {log.notes && <p className="text-sm">{log.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePaymentMutation.mutate(log.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

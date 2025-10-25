import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PaymentDialog } from "@/components/finance/PaymentDialog";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Finance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          clients(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      const { data: allPayments } = await supabase.from("payments").select("amount, status");
      const total = allPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const paid = allPayments?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const pending = allPayments?.filter(p => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const overdue = allPayments?.filter(p => p.status === "overdue").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      return { total, paid, pending, overdue };
    },
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      paid: "bg-green-500",
      pending: "bg-yellow-500",
      overdue: "bg-red-500",
      cancelled: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance & Payments</h1>
          <p className="text-muted-foreground mt-1">Track all financial transactions</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{stats?.total.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₹{stats?.paid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">₹{stats?.pending.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₹{stats?.overdue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {payments.map((payment) => (
            <Card key={payment.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedPayment(payment); setIsDialogOpen(true); }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Payment</CardTitle>
                  </div>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{payment.clients?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-primary">₹{payment.amount?.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Payment Date</p>
                    <p>{format(new Date(payment.payment_date), "dd MMM yyyy")}</p>
                  </div>
                  {payment.due_date && (
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p>{format(new Date(payment.due_date), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PaymentDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["payments"] });
          queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
          setIsDialogOpen(false);
          setSelectedPayment(null);
        }}
      />
    </div>
  );
}

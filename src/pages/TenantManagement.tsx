import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { TenantDialog } from "@/components/tenant/TenantDialog";
import { TenantDetailModal } from "@/components/tenant/TenantDetailModal";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format, addMonths, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function TenantManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [viewTenant, setViewTenant] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("tenant_management")
        .select(`
          *,
          properties(title),
          clients:tenant_id(full_name, phone, email)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Generate month options from earliest lease to latest + 6 months
  const monthOptions = useMemo(() => {
    if (tenants.length === 0) return [];
    
    const today = new Date();
    const earliestDate = tenants.reduce((earliest, tenant) => {
      const leaseStart = new Date(tenant.lease_start_date);
      return leaseStart < earliest ? leaseStart : earliest;
    }, today);
    
    const latestDate = tenants.reduce((latest, tenant) => {
      const leaseEnd = new Date(tenant.lease_end_date);
      return leaseEnd > latest ? leaseEnd : latest;
    }, today);
    
    const options = [];
    let current = startOfMonth(earliestDate);
    const end = addMonths(startOfMonth(latestDate), 6);
    
    while (current <= end) {
      options.push({
        value: format(current, "yyyy-MM"),
        label: format(current, "MMMM yyyy"),
      });
      current = addMonths(current, 1);
    }
    
    return options;
  }, [tenants]);

  // Create payment log mutation
  const logPaymentMutation = useMutation({
    mutationFn: async ({ tenantId, monthDate }: { tenantId: string; monthDate: Date }) => {
      const tenant = tenants.find((t: any) => t.id === tenantId);
      if (!tenant) throw new Error("Tenant not found");

      // Check if payment already exists
      const { data: existing } = await supabase
        .from("tenant_payment_logs")
        .select("id")
        .eq("tenant_management_id", tenantId)
        .gte("payment_date", format(startOfMonth(monthDate), "yyyy-MM-dd"))
        .lte("payment_date", format(endOfMonth(monthDate), "yyyy-MM-dd"))
        .maybeSingle();

      if (existing) {
        throw new Error("Payment already logged for this month");
      }

      const { error } = await supabase.from("tenant_payment_logs").insert({
        tenant_management_id: tenantId,
        amount: tenant.rental_amount,
        payment_date: format(monthDate, "yyyy-MM-dd"),
        payment_method: "Manual Entry",
        notes: `Payment for ${format(monthDate, "MMMM yyyy")}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant_payments"] });
      toast.success("Payment logged successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      active: "bg-green-500",
      expired: "bg-red-500",
      terminated: "bg-gray-500",
      renewed: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  // Check if payment exists for a specific month
  const { data: paymentLogs = [] } = useQuery({
    queryKey: ["tenant_payments", selectedMonth],
    queryFn: async () => {
      if (!selectedMonth) return [];
      const monthDate = new Date(selectedMonth + "-01");
      const { data, error } = await supabase
        .from("tenant_payment_logs")
        .select("*")
        .gte("payment_date", format(startOfMonth(monthDate), "yyyy-MM-dd"))
        .lte("payment_date", format(endOfMonth(monthDate), "yyyy-MM-dd"));
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedMonth,
  });

  const getPaymentStatus = (tenantId: string) => {
    return paymentLogs.some((log: any) => log.tenant_management_id === tenantId) ? "paid" : "unpaid";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground mt-1">Manage rental units and tenants</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Payment Tracking</CardTitle>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant: any) => {
              const leaseStart = new Date(tenant.lease_start_date);
              const leaseEnd = new Date(tenant.lease_end_date);
              const selectedMonthDate = new Date(selectedMonth + "-01");
              
              // Check if selected month is within lease period
              const isWithinLease = !isBefore(selectedMonthDate, startOfMonth(leaseStart)) && 
                                   !isAfter(selectedMonthDate, startOfMonth(leaseEnd));
              
              if (!isWithinLease) return null;

              const paymentStatus = getPaymentStatus(tenant.id);

              return (
                <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{tenant.clients?.full_name}</h3>
                      <Badge className={getStatusColor(tenant.lease_status)}>
                        {tenant.lease_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{tenant.properties?.title} - {tenant.unit_number}</p>
                    <p className="text-sm font-medium mt-1">₹{formatIndianNumber(tenant.rental_amount)}/month</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {paymentStatus === "paid" ? (
                      <Badge className="bg-green-500">Paid</Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => logPaymentMutation.mutate({ tenantId: tenant.id, monthDate: selectedMonthDate })}
                        disabled={logPaymentMutation.isPending}
                      >
                        Log Payment
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            {tenants.filter((tenant: any) => {
              const leaseStart = new Date(tenant.lease_start_date);
              const leaseEnd = new Date(tenant.lease_end_date);
              const selectedMonthDate = new Date(selectedMonth + "-01");
              return !isBefore(selectedMonthDate, startOfMonth(leaseStart)) && 
                     !isAfter(selectedMonthDate, startOfMonth(leaseEnd));
            }).length === 0 && (
              <p className="text-center text-muted-foreground py-8">No active tenants for this month</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : tenants.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              No tenants yet. Add your first tenant to get started!
            </CardContent>
          </Card>
        ) : (
          tenants.map((tenant: any) => (
            <Card
              key={tenant.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setViewTenant(tenant)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{tenant.clients?.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tenant.properties?.title}</p>
                  </div>
                  <Badge className={getStatusColor(tenant.lease_status)}>
                    {tenant.lease_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit:</span>
                  <span className="font-medium">{tenant.unit_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rent:</span>
                  <span className="font-medium">₹{formatIndianNumber(tenant.rental_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lease End:</span>
                  <span className="font-medium">{new Date(tenant.lease_end_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <TenantDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tenant={selectedTenant}
        onSuccess={() => {
          setIsDialogOpen(false);
          setSelectedTenant(null);
        }}
      />

      {viewTenant && (
        <TenantDetailModal
          tenant={viewTenant}
          open={!!viewTenant}
          onOpenChange={(open) => !open && setViewTenant(null)}
          onEdit={(tenant) => {
            setSelectedTenant(tenant);
            setViewTenant(null);
            setIsDialogOpen(true);
          }}
          onDelete={(tenant) => setViewTenant(null)}
        />
      )}
    </div>
  );
}

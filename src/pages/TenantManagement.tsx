import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TenantDialog } from "@/components/tenant/TenantDialog";
import { TenantDetailModal } from "@/components/tenant/TenantDetailModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addMonths, startOfMonth, endOfMonth, isBefore, isAfter } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { toast } from "sonner";

export default function TenantManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tenant_management").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success("Tenant deleted successfully");
      setDetailModalOpen(false);
    },
  });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("tenant_management")
        .select(`
          *,
          properties(title, address),
          clients:tenant_id(full_name, email, phone)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false});
      if (error) throw error;
      return data;
    },
  });

  // Generate month options based on lease periods
  const generateMonthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const today = new Date();
    
    // Get all unique lease periods from tenants
    tenants.forEach((tenant: any) => {
      const leaseStart = new Date(tenant.lease_start_date);
      const leaseEnd = new Date(tenant.lease_end_date);
      
      let currentMonth = startOfMonth(leaseStart);
      while (isBefore(currentMonth, leaseEnd) || currentMonth.getTime() === startOfMonth(leaseEnd).getTime()) {
        const monthKey = format(currentMonth, "yyyy-MM");
        if (!options.find(opt => opt.value === monthKey)) {
          options.push({
            value: monthKey,
            label: format(currentMonth, "MMMM yyyy")
          });
        }
        currentMonth = addMonths(currentMonth, 1);
      }
    });

    // Sort by date
    options.sort((a, b) => b.value.localeCompare(a.value));
    return options;
  };

  const monthOptions = generateMonthOptions();

  // Update payment status mutation
  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ tenantId, month, status }: { tenantId: string; month: string; status: string }) => {
      // Check if payment log exists for this month
      const monthDate = new Date(month + "-01");
      const { data: existing } = await supabase
        .from("tenant_payment_logs")
        .select("id")
        .eq("tenant_management_id", tenantId)
        .gte("payment_date", format(startOfMonth(monthDate), "yyyy-MM-dd"))
        .lte("payment_date", format(endOfMonth(monthDate), "yyyy-MM-dd"))
        .maybeSingle();

      if (status === "paid" && !existing) {
        // Create payment log
        const tenant = tenants.find((t: any) => t.id === tenantId);
        const { error } = await supabase.from("tenant_payment_logs").insert({
          tenant_management_id: tenantId,
          amount: tenant.rental_amount,
          payment_date: format(monthDate, "yyyy-MM-dd"),
          payment_method: "Manual Entry",
          notes: `Payment for ${format(monthDate, "MMMM yyyy")}`,
        });
        if (error) throw error;
      } else if (status === "unpaid" && existing) {
        // Delete payment log
        const { error } = await supabase
          .from("tenant_payment_logs")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant_payments"] });
      toast.success("Payment status updated");
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
                  <div className="flex items-center gap-4">
                    <Home className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{tenant.clients?.full_name || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">{tenant.properties?.title || "N/A"} - {tenant.unit_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">₹{formatIndianNumber(tenant.rental_amount)}</p>
                    <Select
                      value={paymentStatus}
                      onValueChange={(value) => updatePaymentStatusMutation.mutate({
                        tenantId: tenant.id,
                        month: selectedMonth,
                        status: value,
                      })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => { 
                setSelectedTenant(tenant); 
                setDetailModalOpen(true); 
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Home className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-base md:text-lg truncate">{tenant.unit_type}</CardTitle>
                  </div>
                  <Badge className={`${getStatusColor(tenant.lease_status)} flex-shrink-0`}>
                    {tenant.lease_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="font-medium truncate">{tenant.clients?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="text-sm truncate">{tenant.properties?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="font-bold text-lg text-primary">₹{formatIndianNumber(tenant.rental_amount)}/mo</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="truncate">{format(new Date(tenant.lease_start_date), "dd MMM yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">End Date</p>
                    <p className="truncate">{format(new Date(tenant.lease_end_date), "dd MMM yyyy")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TenantDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedTenant(null);
        }}
        tenant={selectedTenant}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["tenants"] });
          setIsDialogOpen(false);
          setSelectedTenant(null);
        }}
      />

      {selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onEdit={() => {
            setIsDialogOpen(true);
            setDetailModalOpen(false);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}
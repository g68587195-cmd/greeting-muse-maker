import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TenantDialog } from "@/components/tenant/TenantDialog";
import { TenantDetailModal } from "@/components/tenant/TenantDetailModal";
import { format } from "date-fns";

export default function TenantManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenant_management")
        .select(`
          *,
          properties(title, address),
          clients:tenant_id(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{tenant.unit_type}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(tenant.lease_status)}>
                    {tenant.lease_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Tenant</p>
                  <p className="font-medium">{tenant.clients?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Property</p>
                  <p className="text-sm truncate">{tenant.properties?.title || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rent</p>
                  <p className="font-bold text-lg text-primary">₹{tenant.rental_amount?.toLocaleString()}/mo</p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p>{format(new Date(tenant.lease_start_date), "dd MMM yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">End Date</p>
                    <p>{format(new Date(tenant.lease_end_date), "dd MMM yyyy")}</p>
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
        />
      )}
    </div>
  );
}

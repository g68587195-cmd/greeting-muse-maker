import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText, LayoutGrid, Kanban } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesCard } from "@/components/sales/SalesCard";
import { SalesDialog } from "@/components/sales/SalesDialog";
import { SalesDetailModal } from "@/components/sales/SalesDetailModal";
import { QuotationDialog } from "@/components/quotations/QuotationDialog";
import { SalesPipelineView } from "@/components/sales/SalesPipelineView";
import { toast } from "sonner";

export default function Sales() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "pipeline">("grid");
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_transactions")
        .select(`
          *,
          clients(full_name, email, phone),
          properties(title, address, price)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Sale deleted successfully");
      setDetailModalOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales & Transactions</h1>
          <p className="text-muted-foreground mt-1">Manage property sales and transactions</p>
        </div>
        <div className="flex gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Grid
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="gap-2">
                <Kanban className="h-4 w-4" />
                Pipeline
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsQuotationOpen(true)} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Create Quotation
          </Button>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Sale
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : viewMode === "pipeline" ? (
        <SalesPipelineView
          sales={sales}
          onSaleClick={(sale) => {
            setSelectedSale(sale);
            setDetailModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sales.map((sale) => (
            <SalesCard
              key={sale.id}
              sale={sale}
              onClick={() => {
                setSelectedSale(sale);
                setDetailModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <SalesDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedSale(null);
        }}
        sale={selectedSale}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sales"] });
          setIsDialogOpen(false);
          setSelectedSale(null);
        }}
      />

      <QuotationDialog
        open={isQuotationOpen}
        onOpenChange={setIsQuotationOpen}
        onSuccess={() => {
          setIsQuotationOpen(false);
        }}
      />

      {selectedSale && (
        <SalesDetailModal
          sale={selectedSale}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onEdit={(sale) => {
            setSelectedSale(sale);
            setIsDialogOpen(true);
            setDetailModalOpen(false);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}

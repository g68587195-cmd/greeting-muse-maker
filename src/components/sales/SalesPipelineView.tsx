import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { SortableCard } from "./SortableCard";

interface SalesPipelineViewProps {
  sales: any[];
  onSaleClick: (sale: any) => void;
}

const stages = [
  { id: "pending", label: "Pending", color: "bg-yellow-500" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { id: "completed", label: "Completed", color: "bg-green-500" },
  { id: "cancelled", label: "Cancelled", color: "bg-gray-500" },
];

export function SalesPipelineView({ sales, onSaleClick }: SalesPipelineViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const saleByStage = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    stages.forEach(stage => { grouped[stage.id] = []; });
    sales.forEach(sale => {
      if (grouped[sale.status]) grouped[sale.status].push(sale);
    });
    return grouped;
  }, [sales]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("sales_transactions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast.success("Status updated");
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const saleId = active.id as string;
    const newStatus = over.id as string;

    // Check if dropped on a valid stage
    if (stages.find(s => s.id === newStatus)) {
      updateStatusMutation.mutate({ id: saleId, status: newStatus });
    }
  };

  const activeSale = useMemo(() => 
    activeId ? sales.find(s => s.id === activeId) : null,
    [activeId, sales]
  );

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => (
          <Card key={stage.id} className="flex flex-col h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
                <Badge variant="secondary">{saleByStage[stage.id].length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
              <SortableContext
                id={stage.id}
                items={saleByStage[stage.id].map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 min-h-[200px]">
                  {saleByStage[stage.id].map(sale => (
                    <SortableCard
                      key={sale.id}
                      sale={sale}
                      onClick={() => onSaleClick(sale)}
                      stageColor={stage.color}
                    />
                  ))}
                </div>
              </SortableContext>
            </CardContent>
          </Card>
        ))}
      </div>

      <DragOverlay>
        {activeSale && (
          <Card className="cursor-grabbing opacity-90 rotate-3 shadow-lg">
            <CardContent className="p-3">
              <p className="font-medium text-sm">{activeSale.properties?.title}</p>
              <p className="text-xs text-muted-foreground">{activeSale.clients?.full_name}</p>
              <p className="text-sm font-bold mt-1">₹{activeSale.sale_price?.toLocaleString()}</p>
            </CardContent>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical } from "lucide-react";

interface SortableCardProps {
  sale: any;
  onClick: () => void;
  stageColor: string;
}

export function SortableCard({ sale, onClick, stageColor }: SortableCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sale.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`h-1 w-full rounded-full mb-2 ${stageColor}`} />
            <p className="font-medium text-sm truncate">{sale.properties?.title || "N/A"}</p>
            <p className="text-xs text-muted-foreground truncate">{sale.clients?.full_name || "N/A"}</p>
            <p className="text-sm font-bold text-primary mt-1">
              ₹{sale.sale_price?.toLocaleString()}
            </p>
            {sale.transaction_type && (
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {sale.transaction_type}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

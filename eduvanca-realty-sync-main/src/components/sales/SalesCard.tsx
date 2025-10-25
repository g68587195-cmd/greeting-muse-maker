import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User, IndianRupee, Calendar } from "lucide-react";

interface SalesCardProps {
  sale: any;
  onClick: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  completed: "bg-green-500",
  cancelled: "bg-red-500",
};

export function SalesCard({ sale, onClick }: SalesCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Badge className={statusColors[sale.status] || "bg-gray-500"}>
            {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
          </Badge>
          <Badge variant="outline">
            {sale.transaction_type === "sale" ? "Sale" : "Lease"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {sale.properties && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium truncate">{sale.properties.title}</span>
          </div>
        )}
        {sale.clients && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{sale.clients.full_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">₹{Number(sale.sale_price).toLocaleString()}</span>
        </div>
        {sale.closing_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Closing: {new Date(sale.closing_date).toLocaleDateString()}</span>
          </div>
        )}
        {sale.commission_amount && (
          <div className="text-sm text-muted-foreground">
            Commission: ₹{Number(sale.commission_amount).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

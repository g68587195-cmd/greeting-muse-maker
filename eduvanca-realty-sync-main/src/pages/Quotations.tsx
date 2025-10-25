import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuotationDialog } from "@/components/quotations/QuotationDialog";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Quotations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          clients(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      draft: "bg-gray-500",
      sent: "bg-blue-500",
      accepted: "bg-green-500",
      rejected: "bg-red-500",
      expired: "bg-orange-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground mt-1">Create and manage quotations</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Quotation
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
          {quotations.map((quotation) => (
            <Card key={quotation.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{quotation.quotation_number}</CardTitle>
                  </div>
                  <Badge className={getStatusColor(quotation.status)}>
                    {quotation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{quotation.clients?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-primary">₹{quotation.total_amount?.toLocaleString()}</p>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{format(new Date(quotation.quotation_date), "dd MMM yyyy")}</p>
                  </div>
                  {quotation.valid_until && (
                    <div>
                      <p className="text-muted-foreground">Valid Until</p>
                      <p>{format(new Date(quotation.valid_until), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuotationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        quotation={selectedQuotation}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
          setIsDialogOpen(false);
          setSelectedQuotation(null);
        }}
      />
    </div>
  );
}

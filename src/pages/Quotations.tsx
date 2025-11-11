import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Eye, Edit, FileSpreadsheet } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuotationDialog } from "@/components/quotations/QuotationDialog";
import { QuotationViewerModal } from "@/components/quotations/QuotationViewerModal";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

export default function Quotations() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [isInvoiceMode, setIsInvoiceMode] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("company_name, company_logo_url")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setCompanyInfo({
          name: data.company_name || "Your Company",
          logo: data.company_logo_url
        });
      }
    };
    fetchCompanyInfo();
  }, []);

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ["quotations", isInvoiceMode],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          clients(full_name, email, phone)
        `)
        .eq("user_id", user.id)
        .eq("document_type", isInvoiceMode ? "invoice" : "quotation")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Status updated");
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
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isInvoiceMode ? "Invoices" : "Quotations"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create and manage {isInvoiceMode ? "invoices" : "quotations"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <Switch checked={isInvoiceMode} onCheckedChange={setIsInvoiceMode} />
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Create {isInvoiceMode ? "Invoice" : "Quotation"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotations.map((quotation) => (
            <Card key={quotation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-base md:text-lg truncate">{quotation.quotation_number}</CardTitle>
                  </div>
                  <Select
                    value={quotation.status}
                    onValueChange={(value) => updateStatusMutation.mutate({ id: quotation.id, status: value })}
                  >
                    <SelectTrigger className="w-[110px] h-8" onClick={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium truncate">{quotation.clients?.full_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg text-primary">₹{formatIndianNumber(quotation.total_amount)}</p>
                </div>
                <div className="flex justify-between text-sm flex-wrap gap-2">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="text-xs md:text-sm">{format(new Date(quotation.quotation_date), "dd MMM yyyy")}</p>
                  </div>
                  {quotation.valid_until && (
                    <div className="text-right">
                      <p className="text-muted-foreground">Valid Until</p>
                      <p className="text-xs md:text-sm">{format(new Date(quotation.valid_until), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedQuotation(quotation);
                      setViewerOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedQuotation(quotation);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <QuotationDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedQuotation(null);
        }}
        quotation={selectedQuotation}
        isInvoiceMode={isInvoiceMode}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["quotations"] });
          setIsDialogOpen(false);
          setSelectedQuotation(null);
        }}
      />

      {selectedQuotation && (
        <QuotationViewerModal
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          quotation={selectedQuotation}
          companyInfo={companyInfo}
          isInvoiceMode={isInvoiceMode}
        />
      )}
    </div>
  );
}

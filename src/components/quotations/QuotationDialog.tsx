import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: any;
  isInvoiceMode?: boolean;
  onSuccess: () => void;
}

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
  amount: number;
}

export function QuotationDialog({ open, onOpenChange, quotation, isInvoiceMode = false, onSuccess }: QuotationDialogProps) {
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, tax_rate: 18, amount: 0 }
  ]);
  const [sgstRate, setSgstRate] = useState("9");
  const [cgstRate, setCgstRate] = useState("9");
  const queryClient = useQueryClient();

  // Load quotation data when editing
  useEffect(() => {
    if (quotation && open) {
      setClientId(quotation.client_id || "");
      // Fetch quotation items
      const fetchItems = async () => {
        const { data, error } = await supabase
          .from("quotation_items")
          .select("*")
          .eq("quotation_id", quotation.id)
          .order("display_order");
        
        if (!error && data) {
          const loadedItems = data.map((item: any) => ({
            id: item.id,
            description: item.item_description,
            quantity: item.quantity,
            rate: item.rate,
            tax_rate: item.notes?.includes("Tax Rate:") ? parseInt(item.notes.split(":")[1]) : 18,
            amount: item.amount,
          }));
          setItems(loadedItems.length > 0 ? loadedItems : [{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, tax_rate: 18, amount: 0 }]);
        }
      };
      fetchItems();
    } else if (!quotation) {
      // Reset for new quotation
      setClientId("");
      setItems([{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, tax_rate: 18, amount: 0 }]);
    }
  }, [quotation, open]);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, email, phone")
        .eq("user_id", user.id)
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data;
    },
  });

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, tax_rate: 18, amount: 0 }]);
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate SGST and CGST per item based on their individual tax rates
  const sgstAmount = items.reduce((sum, item) => sum + (item.amount * item.tax_rate / 2 / 100), 0);
  const cgstAmount = items.reduce((sum, item) => sum + (item.amount * item.tax_rate / 2 / 100), 0);
  const total = subtotal + sgstAmount + cgstAmount;

  const saveQuotationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const quotationData = {
        user_id: user.id,
        client_id: clientId || null,
        subtotal,
        sgst_rate: 9,
        sgst_amount: sgstAmount,
        cgst_rate: 9,
        cgst_amount: cgstAmount,
        total_amount: total,
        created_by: user.id,
        status: quotation?.status || "draft",
      };

      let quotationResult;

      if (quotation) {
        // Update existing quotation
        const { data, error: quotationError } = await supabase
          .from("quotations")
          .update(quotationData)
          .eq("id", quotation.id)
          .select()
          .single();

        if (quotationError) throw quotationError;
        quotationResult = data;

        // Delete old items
        await supabase.from("quotation_items").delete().eq("quotation_id", quotation.id);
      } else {
        // Create new quotation
        const { data, error: quotationError } = await supabase
          .from("quotations")
          .insert([{ ...quotationData, quotation_number: "" }])
          .select()
          .single();

        if (quotationError) throw quotationError;
        quotationResult = data;
      }

      // Insert items
      const itemsData = items.map((item, index) => ({
        quotation_id: quotationResult.id,
        item_description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        display_order: index,
        notes: `Tax Rate: ${item.tax_rate}%`,
      }));

      const { error: itemsError } = await supabase
        .from("quotation_items")
        .insert(itemsData);

      if (itemsError) throw itemsError;

      return quotationResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success(quotation ? "Quotation updated successfully" : "Quotation saved successfully");
      generatePDF(data);
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save quotation");
    },
  });

  const generatePDF = (quotationData?: any) => {
    if (!profile) {
      toast.error("Profile information not loaded");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;

    // Company Logo (if available)
    if (profile.company_logo_url) {
      // Note: For actual logo rendering, you'd need to convert the image to base64
      doc.setFontSize(10);
      doc.text("[Company Logo]", 20, yPos);
      yPos += 10;
    }

    // Company Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(profile.company_name || "Company Name", 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (profile.company_address) doc.text(profile.company_address, 20, yPos);
    
    yPos += 5;
    if (profile.company_phone) doc.text(`Phone: ${profile.company_phone}`, 20, yPos);
    
    yPos += 5;
    if (profile.company_email) doc.text(`Email: ${profile.company_email}`, 20, yPos);
    
    yPos += 5;
    if (profile.company_gstin) doc.text(`GSTIN: ${profile.company_gstin}`, 20, yPos);

    // Quotation Title
    yPos += 15;
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", pageWidth / 2, yPos, { align: "center" });

    // Client Info & Date
    yPos += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, yPos);
    
    const selectedClient = clients.find((c: any) => c.id === clientId);
    if (selectedClient) {
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.text(selectedClient.full_name, 20, yPos);
      if (selectedClient.email) {
        yPos += 5;
        doc.text(selectedClient.email, 20, yPos);
      }
      if (selectedClient.phone) {
        yPos += 5;
        doc.text(selectedClient.phone, 20, yPos);
      }
    }

    // Date and Quotation Number on right
    const rightX = pageWidth - 20;
    doc.setFont("helvetica", "bold");
    doc.text("Date:", rightX - 40, yPos - 12);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleDateString(), rightX, yPos - 12, { align: "right" });
    
    if (quotationData?.quotation_number) {
      doc.setFont("helvetica", "bold");
      doc.text("Quotation #:", rightX - 40, yPos - 6);
      doc.setFont("helvetica", "normal");
      doc.text(quotationData.quotation_number, rightX, yPos - 6, { align: "right" });
    }

    // Items Table
    yPos += 15;
    
    // Table Header with borders
    doc.setFillColor(240, 240, 240);
    doc.rect(20, yPos - 5, pageWidth - 40, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Sr.", 22, yPos);
    doc.text("Description", 35, yPos);
    doc.text("Qty", 115, yPos, { align: "right" });
    doc.text("Rate", 135, yPos, { align: "right" });
    doc.text("Tax%", 155, yPos, { align: "right" });
    doc.text("Amount", 185, yPos, { align: "right" });
    
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    items.forEach((item, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.text(`${index + 1}`, 22, yPos);
      doc.text(item.description || "-", 35, yPos);
      doc.text(item.quantity.toString(), 115, yPos, { align: "right" });
      doc.text(`₹${formatIndianNumber(item.rate)}`, 135, yPos, { align: "right" });
      doc.text(`${item.tax_rate}%`, 155, yPos, { align: "right" });
      doc.text(`₹${formatIndianNumber(item.amount)}`, 185, yPos, { align: "right" });
      yPos += 7;
    });

    // Totals Section
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.line(110, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Subtotal:", 120, yPos);
    doc.text(`₹${formatIndianNumber(subtotal)}`, 185, yPos, { align: "right" });
    
    yPos += 7;
    doc.text("SGST:", 120, yPos);
    doc.text(`₹${formatIndianNumber(sgstAmount)}`, 185, yPos, { align: "right" });
    
    yPos += 7;
    doc.text("CGST:", 120, yPos);
    doc.text(`₹${formatIndianNumber(cgstAmount)}`, 185, yPos, { align: "right" });
    
    yPos += 5;
    doc.setLineWidth(0.7);
    doc.line(110, yPos, pageWidth - 20, yPos);
    yPos += 9;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 120, yPos);
    doc.text(`₹${formatIndianNumber(total)}`, 185, yPos, { align: "right" });

    // Footer
    yPos = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });
    
    // Signature section
    yPos += 10;
    doc.setFont("helvetica", "normal");
    doc.text("For " + (profile.company_name || "Company"), 20, yPos);
    doc.text("Customer Signature", pageWidth - 60, yPos);
    
    yPos += 15;
    doc.line(20, yPos, 70, yPos);
    doc.line(pageWidth - 60, yPos, pageWidth - 20, yPos);
    
    yPos += 5;
    doc.text("Authorized Signatory", 20, yPos);
    doc.text("Date:", pageWidth - 60, yPos);

    doc.save(`Quotation_${quotationData?.quotation_number || new Date().getTime()}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  const handleSaveAndDownload = () => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }
    if (items.length === 0 || items.every(item => !item.description)) {
      toast.error("Please add at least one item");
      return;
    }
    saveQuotationMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Quotation</DialogTitle>
          <DialogDescription>Generate a professional quotation for your client</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
            <h3 className="font-semibold text-lg mb-3">From:</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg">{profile?.company_name || "Company Name"}</p>
              {profile?.company_address && <p className="text-sm text-muted-foreground">{profile.company_address}</p>}
              <div className="flex gap-4 text-sm">
                {profile?.company_phone && <p>📞 {profile.company_phone}</p>}
                {profile?.company_email && <p className="text-muted-foreground">✉️ {profile.company_email}</p>}
              </div>
              {profile?.company_gstin && <p className="text-sm font-medium mt-2">GSTIN: {profile.company_gstin}</p>}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="text-base font-semibold">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Items</h3>
              <Button onClick={addItem} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[35%] font-semibold">Description</TableHead>
                    <TableHead className="w-[12%] font-semibold">Qty</TableHead>
                    <TableHead className="w-[15%] font-semibold">Rate (₹)</TableHead>
                    <TableHead className="w-[12%] font-semibold">Tax %</TableHead>
                    <TableHead className="w-[18%] font-semibold text-right">Amount (₹)</TableHead>
                    <TableHead className="w-[8%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={item.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell className="p-2">
                        <Input 
                          value={item.description} 
                          onChange={(e) => updateItem(item.id, "description", e.target.value)}
                          placeholder="Item description"
                          className="border-0 focus-visible:ring-1"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="border-0 focus-visible:ring-1"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                          className="border-0 focus-visible:ring-1"
                          min="0"
                          step="0.01"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input 
                          type="number" 
                          value={item.tax_rate} 
                          onChange={(e) => updateItem(item.id, "tax_rate", parseFloat(e.target.value) || 0)}
                          className="border-0 focus-visible:ring-1"
                          min="0"
                          max="100"
                        />
                      </TableCell>
                      <TableCell className="p-2 text-right font-medium">
                        {formatIndianNumber(item.amount)}
                      </TableCell>
                      <TableCell className="p-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(item.id)} 
                          disabled={items.length === 1}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted/20">
            <div className="space-y-3">
              <div className="flex justify-between text-base border-b pb-2">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono">₹{formatIndianNumber(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>SGST (Split by item tax rates):</span>
                <span className="font-mono">₹{formatIndianNumber(sgstAmount)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground border-b pb-3">
                <span>CGST (Split by item tax rates):</span>
                <span className="font-mono">₹{formatIndianNumber(cgstAmount)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total:</span>
                <span className="font-mono text-primary">₹{formatIndianNumber(total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveAndDownload} disabled={saveQuotationMutation.isPending} size="lg">
              {saveQuotationMutation.isPending ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save & Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

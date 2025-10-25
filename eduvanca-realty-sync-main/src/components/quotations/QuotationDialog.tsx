import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Download, Save } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: any;
  onSuccess: () => void;
}

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export function QuotationDialog({ open, onOpenChange, quotation, onSuccess }: QuotationDialogProps) {
  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<QuotationItem[]>([{ id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 }]);
  const [sgstRate, setSgstRate] = useState("9");
  const [cgstRate, setCgstRate] = useState("9");
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name, email, phone");
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
    setItems([...items, { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0, amount: 0 }]);
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
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const sgstAmount = (subtotal * parseFloat(sgstRate)) / 100;
  const cgstAmount = (subtotal * parseFloat(cgstRate)) / 100;
  const total = subtotal + sgstAmount + cgstAmount;

  const saveQuotationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const quotationData = {
        client_id: clientId || null,
        subtotal,
        sgst_rate: parseFloat(sgstRate),
        sgst_amount: sgstAmount,
        cgst_rate: parseFloat(cgstRate),
        cgst_amount: cgstAmount,
        total_amount: total,
        created_by: user.id,
        status: "draft",
        quotation_number: "",
      };

      const { data: quotationResult, error: quotationError } = await supabase
        .from("quotations")
        .insert([quotationData])
        .select()
        .single();

      if (quotationError) throw quotationError;

      const itemsData = items.map((item, index) => ({
        quotation_id: quotationResult.id,
        item_description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        display_order: index,
      }));

      const { error: itemsError } = await supabase
        .from("quotation_items")
        .insert(itemsData);

      if (itemsError) throw itemsError;

      return quotationResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Quotation saved successfully");
      generatePDF(data);
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
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("QUOTATION", pageWidth / 2, yPos, { align: "center" });

    // Client Info
    yPos += 10;
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

    // Date
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, yPos - 12, { align: "right" });
    if (quotationData?.quotation_number) {
      doc.text(`Quotation #: ${quotationData.quotation_number}`, pageWidth - 20, yPos - 6, { align: "right" });
    }

    // Items Table
    yPos += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, yPos);
    doc.text("Qty", 120, yPos, { align: "right" });
    doc.text("Rate", 145, yPos, { align: "right" });
    doc.text("Amount", 180, yPos, { align: "right" });
    
    yPos += 2;
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 6;

    doc.setFont("helvetica", "normal");
    items.forEach(item => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item.description || "-", 20, yPos);
      doc.text(item.quantity.toString(), 120, yPos, { align: "right" });
      doc.text(`₹${item.rate.toFixed(2)}`, 145, yPos, { align: "right" });
      doc.text(`₹${item.amount.toFixed(2)}`, 180, yPos, { align: "right" });
      yPos += 7;
    });

    // Totals
    yPos += 5;
    doc.line(120, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    doc.text("Subtotal:", 120, yPos);
    doc.text(`₹${subtotal.toFixed(2)}`, 180, yPos, { align: "right" });
    
    yPos += 7;
    doc.text(`SGST (${sgstRate}%):`, 120, yPos);
    doc.text(`₹${sgstAmount.toFixed(2)}`, 180, yPos, { align: "right" });
    
    yPos += 7;
    doc.text(`CGST (${cgstRate}%):`, 120, yPos);
    doc.text(`₹${cgstAmount.toFixed(2)}`, 180, yPos, { align: "right" });
    
    yPos += 5;
    doc.line(120, yPos, pageWidth - 20, yPos);
    yPos += 8;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 120, yPos);
    doc.text(`₹${total.toFixed(2)}`, 180, yPos, { align: "right" });

    // Footer
    yPos += 20;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });

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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-card p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">From:</h3>
            <p className="font-bold">{profile?.company_name || "Company Name"}</p>
            {profile?.company_address && <p className="text-sm">{profile.company_address}</p>}
            {profile?.company_phone && <p className="text-sm">{profile.company_phone}</p>}
            {profile?.company_email && <p className="text-sm text-muted-foreground">{profile.company_email}</p>}
            {profile?.company_gstin && <p className="text-sm">GSTIN: {profile.company_gstin}</p>}
          </div>

          <div>
            <Label>Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Items</h3>
              <Button onClick={addItem} size="sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead className="w-[15%]">Qty</TableHead>
                  <TableHead className="w-[20%]">Rate</TableHead>
                  <TableHead className="w-[20%]">Amount</TableHead>
                  <TableHead className="w-[5%]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} disabled={items.length === 1}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-end gap-8 text-sm">
              <span className="font-medium">Subtotal:</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-end gap-8 text-sm items-center">
              <span className="font-medium">SGST:</span>
              <Input type="number" value={sgstRate} onChange={(e) => setSgstRate(e.target.value)} className="w-20" />
              <span>₹{sgstAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-end gap-8 text-sm items-center">
              <span className="font-medium">CGST:</span>
              <Input type="number" value={cgstRate} onChange={(e) => setCgstRate(e.target.value)} className="w-20" />
              <span>₹{cgstAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-end gap-8 text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleSaveAndDownload} disabled={saveQuotationMutation.isPending}>
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PhasePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string;
  projectId: string;
}

export function PhasePaymentDialog({ open, onOpenChange, phaseId, projectId }: PhasePaymentDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: "",
    expense_category: "phase_payment",
    expense_description: "",
    vendor_name: "",
    payment_method: "bank_transfer",
    payment_status: "paid",
    invoice_number: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("site_financial_log").insert({
      project_id: projectId,
      phase_id: phaseId,
      ...formData,
      amount: parseFloat(formData.amount),
    });

    if (error) {
      toast.error("Failed to add payment");
      return;
    }

    // Update phase budget_spent
    const { data: phase } = await supabase
      .from("site_phases")
      .select("budget_spent")
      .eq("id", phaseId)
      .single();

    if (phase) {
      await supabase
        .from("site_phases")
        .update({ 
          budget_spent: Number(phase.budget_spent || 0) + parseFloat(formData.amount) 
        })
        .eq("id", phaseId);
    }

    toast.success("Payment logged successfully");
    queryClient.invalidateQueries({ queryKey: ["site_financial_log"] });
    queryClient.invalidateQueries({ queryKey: ["site_phases"] });
    onOpenChange(false);
    setFormData({
      transaction_date: new Date().toISOString().split('T')[0],
      amount: "",
      expense_category: "phase_payment",
      expense_description: "",
      vendor_name: "",
      payment_method: "bank_transfer",
      payment_status: "paid",
      invoice_number: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Phase Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transaction_date">Date *</Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expense_description">Description *</Label>
            <Input
              id="expense_description"
              value={formData.expense_description}
              onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vendor_name">Vendor Name</Label>
              <Input
                id="vendor_name"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="invoice_number">Invoice Number</Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_status">Status</Label>
              <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Payment</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

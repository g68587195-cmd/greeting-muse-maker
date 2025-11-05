import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

export default function ProjectExpenses() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    phase_id: "",
    expense_category: "",
    expense_description: "",
    amount: "",
    vendor_name: "",
    notes: "",
  });

  const { data: project } = useQuery({
    queryKey: ["site_project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: phases = [] } = useQuery({
    queryKey: ["site_phases", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_phases")
        .select("*")
        .eq("project_id", id)
        .order("phase_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["site_financial_log", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_financial_log")
        .select("*, site_phases(phase_name)")
        .eq("project_id", id)
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_financial_log").insert({
        project_id: id,
        ...data,
        transaction_date: new Date().toISOString().split("T")[0],
        payment_status: "pending",
        approval_status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_financial_log", id] });
      queryClient.invalidateQueries({ queryKey: ["site_phases", id] });
      toast.success("Expense added");
      setDialogOpen(false);
      setFormData({
        phase_id: "",
        expense_category: "",
        expense_description: "",
        amount: "",
        vendor_name: "",
        notes: "",
      });
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, phaseId, amount }: { expenseId: string; phaseId?: string; amount: number }) => {
      await supabase
        .from("site_financial_log")
        .update({ approval_status: "approved" })
        .eq("id", expenseId);

      if (phaseId) {
        const { data: phase } = await supabase
          .from("site_phases")
          .select("budget_spent")
          .eq("id", phaseId)
          .single();

        if (phase) {
          await supabase
            .from("site_phases")
            .update({ budget_spent: (phase.budget_spent || 0) + amount })
            .eq("id", phaseId);
        }
      }

      const { data: projectData } = await supabase
        .from("site_projects")
        .select("spent_amount")
        .eq("id", id)
        .single();

      if (projectData) {
        await supabase
          .from("site_projects")
          .update({ spent_amount: (projectData.spent_amount || 0) + amount })
          .eq("id", id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_financial_log", id] });
      queryClient.invalidateQueries({ queryKey: ["site_phases", id] });
      queryClient.invalidateQueries({ queryKey: ["site_project", id] });
      toast.success("Expense approved");
    },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from("site_financial_log")
        .update({ approval_status: "rejected" })
        .eq("id", expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_financial_log", id] });
      toast.success("Expense rejected");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      phase_id: formData.phase_id || null,
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      rejected: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => navigate(`/site-progress/${id}`)} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Expense Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">{project?.project_name}</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-4">
        {expenses.map((expense: any) => (
          <Card key={expense.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg truncate">{expense.expense_description}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">{expense.expense_category}</p>
                </div>
                <Badge className={getStatusColor(expense.approval_status)}>
                  {expense.approval_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-bold text-lg">₹{formatIndianNumber(expense.amount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(expense.transaction_date), "dd MMM yyyy")}</p>
                </div>
                {expense.site_phases && (
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-muted-foreground">Phase</p>
                    <p className="font-medium truncate">{expense.site_phases.phase_name}</p>
                  </div>
                )}
              </div>
              {expense.vendor_name && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Vendor</p>
                  <p className="font-medium">{expense.vendor_name}</p>
                </div>
              )}
              {expense.approval_status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() =>
                      approveExpenseMutation.mutate({
                        expenseId: expense.id,
                        phaseId: expense.phase_id,
                        amount: expense.amount,
                      })
                    }
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => rejectExpenseMutation.mutate(expense.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {expenses.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No expenses recorded yet. Click "Add Expense" to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Phase (Optional)</Label>
              <Select value={formData.phase_id} onValueChange={(value) => setFormData({ ...formData, phase_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Expense</SelectItem>
                  {phases.map((phase: any) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.phase_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.expense_category}
                onValueChange={(value) => setFormData({ ...formData, expense_category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Materials">Materials</SelectItem>
                  <SelectItem value="Labor">Labor</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Permits">Permits</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input
                value={formData.expense_description}
                onChange={(e) => setFormData({ ...formData, expense_description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Vendor Name</Label>
              <Input
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Add Expense
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

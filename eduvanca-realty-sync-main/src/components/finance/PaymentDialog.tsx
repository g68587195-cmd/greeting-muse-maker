import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

const formSchema = z.object({
  client_id: z.string().min(1, "Client is required"),
  amount: z.string().min(1, "Amount is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  due_date: z.string().optional(),
  status: z.string(),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: any;
  onSuccess: () => void;
}

export function PaymentDialog({ open, onOpenChange, payment, onSuccess }: PaymentDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: "pending" },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        client_id: payment.client_id || "",
        amount: payment.amount?.toString() || "",
        payment_date: payment.payment_date || "",
        due_date: payment.due_date || "",
        status: payment.status || "pending",
        payment_method: payment.payment_method || "",
        reference_number: payment.reference_number || "",
        notes: payment.notes || "",
      });
    } else {
      form.reset({ status: "pending" });
    }
  }, [payment, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const paymentData: any = {
      client_id: values.client_id,
      amount: parseFloat(values.amount),
      payment_date: values.payment_date,
      due_date: values.due_date || null,
      status: values.status,
      payment_method: values.payment_method || null,
      reference_number: values.reference_number || null,
      notes: values.notes,
    };

    const { error } = payment
      ? await supabase.from("payments").update(paymentData).eq("id", payment.id)
      : await supabase.from("payments").insert([paymentData]);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(payment ? "Payment updated" : "Payment created");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Payment" : "Add Payment"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="client_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                    <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Amount *</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="payment_date" render={({ field }) => (
                <FormItem><FormLabel>Payment Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="due_date" render={({ field }) => (
                <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="payment_method" render={({ field }) => (
                <FormItem><FormLabel>Payment Method</FormLabel><FormControl><Input {...field} placeholder="Cash, Bank Transfer, etc." /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="reference_number" render={({ field }) => (
                <FormItem><FormLabel>Reference Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{payment ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

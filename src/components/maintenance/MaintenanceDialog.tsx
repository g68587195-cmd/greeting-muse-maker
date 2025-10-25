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
  property_id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string().optional(),
  estimated_cost: z.string().optional(),
  actual_cost: z.string().optional(),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
});

interface MaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: any;
  onSuccess: () => void;
}

export function MaintenanceDialog({ open, onOpenChange, request, onSuccess }: MaintenanceDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { status: "pending", priority: "medium" },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-rental"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, category")
        .in("category", ["for_rent", "for_lease"]);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        property_id: request.property_id || "",
        title: request.title || "",
        description: request.description || "",
        status: request.status || "pending",
        priority: request.priority || "medium",
        estimated_cost: request.estimated_cost?.toString() || "",
        actual_cost: request.actual_cost?.toString() || "",
        scheduled_date: request.scheduled_date || "",
        notes: request.notes || "",
      });
    }
  }, [request, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const data: any = {
      ...values,
      estimated_cost: values.estimated_cost ? parseFloat(values.estimated_cost) : null,
      actual_cost: values.actual_cost ? parseFloat(values.actual_cost) : null,
      scheduled_date: values.scheduled_date || null,
    };

    const { error } = request
      ? await supabase.from("maintenance_requests").update(data).eq("id", request.id)
      : await supabase.from("maintenance_requests").insert([data]);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(request ? "Request updated" : "Request created");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{request ? "Edit Request" : "Add Request"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="property_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Property *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{request ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

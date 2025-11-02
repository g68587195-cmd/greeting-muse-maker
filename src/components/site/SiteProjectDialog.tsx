import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  project_code: z.string().optional(),
  project_type: z.string().min(1, "Project type is required"),
  project_status: z.string().optional(),
  client_id: z.string().optional(),
  property_id: z.string().optional(),
  site_address: z.string().min(1, "Site address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  start_date: z.string().min(1, "Start date is required"),
  expected_completion_date: z.string().optional(),
  total_budget: z.string().optional(),
  project_manager: z.string().optional(),
  site_engineer: z.string().optional(),
  contractor_name: z.string().optional(),
  contractor_phone: z.string().optional(),
  notes: z.string().optional(),
});

interface SiteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: any;
  onSuccess: () => void;
}

export function SiteProjectDialog({ open, onOpenChange, project, onSuccess }: SiteProjectDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_status: "planning",
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("properties").select("id, title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        project_name: project.project_name || "",
        project_code: project.project_code || "",
        project_type: project.project_type || "",
        project_status: project.project_status || "planning",
        client_id: project.client_id || "",
        property_id: project.property_id || "",
        site_address: project.site_address || "",
        city: project.city || "",
        state: project.state || "",
        start_date: project.start_date || "",
        expected_completion_date: project.expected_completion_date || "",
        total_budget: project.total_budget?.toString() || "",
        project_manager: project.project_manager || "",
        site_engineer: project.site_engineer || "",
        contractor_name: project.contractor_name || "",
        contractor_phone: project.contractor_phone || "",
        notes: project.notes || "",
      });
    } else {
      form.reset({ project_status: "planning" });
    }
  }, [project, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const projectData: any = {
      ...values,
      total_budget: values.total_budget ? parseFloat(values.total_budget) : null,
      user_id: user.id,
    };

    const { error } = project
      ? await supabase.from("site_projects").update(projectData).eq("id", project.id)
      : await supabase.from("site_projects").insert([projectData]);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(project ? "Project updated" : "Project created");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="project_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="project_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Code</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g., PRJ-2025-001" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="project_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Industrial">Industrial</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="project_status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="client_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="property_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {properties.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="site_address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Address *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="expected_completion_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Completion</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="total_budget" render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Budget (₹)</FormLabel>
                  <FormControl><Input type="number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="project_manager" render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Manager</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="site_engineer" render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Engineer</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contractor_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="contractor_phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contractor Phone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{project ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

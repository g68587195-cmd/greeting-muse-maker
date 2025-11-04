import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useEffect, useState } from "react";

const formSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").or(z.literal("")),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  address: z.string().optional(),
  client_type: z.string(),
  site_project_id: z.string().optional(),
  occupation: z.string().optional(),
  annual_income: z.string().optional(),
  preferred_locations: z.string().optional(),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  property_purpose: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onSuccess: () => void;
}

export function ClientDialog({ open, onOpenChange, client, onSuccess }: ClientDialogProps) {
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [siteProjects, setSiteProjects] = useState<any[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      address: "",
      client_type: "buyer",
      site_project_id: "",
      occupation: "",
      annual_income: "",
      preferred_locations: "",
      budget_min: "",
      budget_max: "",
      property_purpose: "",
      source: "",
      notes: "",
    },
  });

  const clientType = form.watch("client_type");

  useEffect(() => {
    const fetchProperties = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !clientType) return;

      let query = supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("title");

      // Filter based on client type
      if (clientType === "seller") {
        query = query.eq("status", "sold");
      } else if (clientType === "tenant") {
        query = query.or("status.eq.rented,category.eq.for_rent,category.eq.for_lease");
      }

      const { data } = await query;
      setProperties(data || []);
    };

    const fetchSiteProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || clientType !== "site_client") return;

      const { data } = await supabase
        .from("site_projects")
        .select("id, project_name, project_code")
        .eq("user_id", user.id)
        .order("project_name");

      setSiteProjects(data || []);
    };

    if (open) {
      fetchProperties();
      fetchSiteProjects();
    }
  }, [clientType, open]);

  useEffect(() => {
    if (client) {
      form.reset({
        full_name: client.full_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        client_type: client.client_type || "buyer",
        site_project_id: client.preferences?.site_project_id || "",
        occupation: client.preferences?.occupation || "",
        annual_income: client.preferences?.annual_income || "",
        preferred_locations: client.preferences?.preferred_locations || "",
        budget_min: client.preferences?.budget_min || "",
        budget_max: client.preferences?.budget_max || "",
        property_purpose: client.preferences?.property_purpose || "",
        source: client.preferences?.source || "",
        notes: client.notes || "",
      });
    } else {
      form.reset();
    }
  }, [client, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const preferences = {
      site_project_id: values.site_project_id,
      occupation: values.occupation,
      annual_income: values.annual_income,
      preferred_locations: values.preferred_locations,
      budget_min: values.budget_min,
      budget_max: values.budget_max,
      property_purpose: values.property_purpose,
      source: values.source,
    };

    const clientData: any = {
      full_name: values.full_name,
      email: values.email || null,
      phone: values.phone,
      address: values.address || null,
      client_type: values.client_type,
      notes: values.notes || null,
      preferences,
    };

    if (!client) {
      clientData.user_id = user.id;
    }

    const { error } = client
      ? await supabase.from("clients").update(clientData).eq("id", client.id)
      : await supabase.from("clients").insert([clientData]);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(client ? "Client updated successfully" : "Client created successfully");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Edit Client" : "Add New Client"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="client_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="seller">Seller</SelectItem>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="landlord">Landlord</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="site_client">Site Client</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {clientType === "site_client" && (
                <FormField
                  control={form.control}
                  name="site_project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {siteProjects.map((project: any) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.project_name} {project.project_code && `(${project.project_code})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="annual_income"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Income</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ₹10,00,000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Min</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ₹50,00,000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget Max</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., ₹1,00,00,000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="property_purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Purpose</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residence">Residence</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="vacation">Vacation Home</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How did they find us?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="referral">Referral</SelectItem>
                        <SelectItem value="social_media">Social Media</SelectItem>
                        <SelectItem value="advertisement">Advertisement</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(clientType === "seller" || clientType === "tenant") && properties.length > 0 && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">
                  {clientType === "seller" ? "Properties Owned" : "Rented/Leased Properties"}
                </label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={`Select ${clientType === "seller" ? "owned" : "rented"} property`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title} - ₹{property.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="preferred_locations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Locations</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Downtown, Suburbs, Coastal areas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{client ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TenantDialog({ open, onOpenChange, tenant, onSuccess }: any) {
  const [formData, setFormData] = useState(tenant || {});

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("*");
      return data || [];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-rental"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .in("category", ["for_rent", "for_lease"]);
      return data || [];
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const dataToSave = tenant ? formData : { ...formData, user_id: user.id };

    const { error } = tenant
      ? await supabase.from("tenant_management").update(dataToSave).eq("id", tenant.id)
      : await supabase.from("tenant_management").insert([dataToSave]);
    if (error) return toast.error(error.message);
    toast.success(tenant ? "Updated" : "Created");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{tenant ? "Edit" : "Add"} Tenant</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Tenant *</Label>
              <Select value={formData.tenant_id} onValueChange={(v) => setFormData({...formData, tenant_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Property *</Label>
              <Select value={formData.property_id} onValueChange={(v) => setFormData({...formData, property_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{properties.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Unit Type *</Label>
              <Select value={formData.unit_type || "apartment"} onValueChange={(v) => setFormData({...formData, unit_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Monthly Rent (₹) *</Label><Input type="number" value={formData.rental_amount || ""} onChange={(e) => setFormData({...formData, rental_amount: e.target.value})} required /></div>
            <div><Label>Start Date *</Label><Input type="date" value={formData.lease_start_date || ""} onChange={(e) => setFormData({...formData, lease_start_date: e.target.value})} required /></div>
            <div><Label>End Date *</Label><Input type="date" value={formData.lease_end_date || ""} onChange={(e) => setFormData({...formData, lease_end_date: e.target.value})} required /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

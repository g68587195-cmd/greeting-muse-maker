import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function SiteProgressDialog({ open, onOpenChange, site, onSuccess }: any) {
  const [formData, setFormData] = useState(site || {});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    const dataToSave = site ? formData : { ...formData, user_id: user.id };

    const { error } = site
      ? await supabase.from("site_progress").update(dataToSave).eq("id", site.id)
      : await supabase.from("site_progress").insert([dataToSave]);
    if (error) return toast.error(error.message);
    toast.success(site ? "Updated" : "Created");
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{site ? "Edit" : "Add"} Site Progress</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>Project Name *</Label><Input value={formData.project_name || ""} onChange={(e) => setFormData({...formData, project_name: e.target.value})} required /></div>
            <div><Label>Project Type *</Label>
              <Select value={formData.project_type || "residential"} onValueChange={(v) => setFormData({...formData, project_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Site Address *</Label><Input value={formData.site_address || ""} onChange={(e) => setFormData({...formData, site_address: e.target.value})} required /></div>
            <div><Label>City *</Label><Input value={formData.city || ""} onChange={(e) => setFormData({...formData, city: e.target.value})} required /></div>
            <div><Label>Start Date *</Label><Input type="date" value={formData.start_date || ""} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required /></div>
            <div><Label>Budget (₹)</Label><Input type="number" value={formData.total_budget || ""} onChange={(e) => setFormData({...formData, total_budget: e.target.value})} /></div>
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

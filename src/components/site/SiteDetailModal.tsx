import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2, Upload, FileText } from "lucide-react";

interface SiteDetailModalProps {
  site: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}

export function SiteDetailModal({ site, open, onOpenChange, onEdit, onDelete }: SiteDetailModalProps) {
  const [dailyUpdateForm, setDailyUpdateForm] = useState({
    update_date: "",
    work_completed: "",
    labor_count: "",
    materials_used: "",
    notes: "",
  });
  const queryClient = useQueryClient();

  const { data: dailyUpdates = [] } = useQuery({
    queryKey: ["site-daily-updates", site?.id],
    queryFn: async () => {
      if (!site?.id) return [];
      const { data, error } = await supabase
        .from("site_daily_updates")
        .select("*")
        .eq("site_progress_id", site.id)
        .order("update_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!site?.id,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["site-milestones", site?.id],
    queryFn: async () => {
      if (!site?.id) return [];
      const { data, error } = await supabase
        .from("site_milestones")
        .select("*")
        .eq("site_progress_id", site.id)
        .order("planned_start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!site?.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["site-documents", site?.id],
    queryFn: async () => {
      if (!site?.id) return [];
      const { data, error } = await supabase
        .from("site_documents")
        .select("*")
        .eq("site_progress_id", site.id)
        .order("upload_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!site?.id,
  });

  const addDailyUpdateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("site_daily_updates").insert([{
        ...data,
        site_progress_id: site.id,
        labor_count: data.labor_count ? parseInt(data.labor_count) : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-daily-updates", site.id] });
      toast.success("Daily update added");
      setDailyUpdateForm({ update_date: "", work_completed: "", labor_count: "", materials_used: "", notes: "" });
    },
  });

  const deleteDailyUpdateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_daily_updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-daily-updates", site.id] });
      toast.success("Update deleted");
    },
  });

  if (!site) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{site.project_name}</DialogTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onEdit}>
                Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(site.id)}>
                Delete
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="daily">Daily Logs</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Project Type</p>
                <p className="font-medium">{site.project_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium">{site.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium">{site.project_status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-medium">{site.overall_progress_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">₹{site.total_budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(new Date(site.start_date), "dd MMM yyyy")}</p>
              </div>
            </div>
            <Button onClick={onEdit}>Edit Project</Button>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Add Daily Update</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={dailyUpdateForm.update_date}
                      onChange={(e) => setDailyUpdateForm({ ...dailyUpdateForm, update_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Labor Count</Label>
                    <Input
                      type="number"
                      value={dailyUpdateForm.labor_count}
                      onChange={(e) => setDailyUpdateForm({ ...dailyUpdateForm, labor_count: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Work Completed *</Label>
                    <Textarea
                      value={dailyUpdateForm.work_completed}
                      onChange={(e) => setDailyUpdateForm({ ...dailyUpdateForm, work_completed: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Materials Used</Label>
                    <Textarea
                      value={dailyUpdateForm.materials_used}
                      onChange={(e) => setDailyUpdateForm({ ...dailyUpdateForm, materials_used: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  className="mt-4"
                  onClick={() => addDailyUpdateMutation.mutate(dailyUpdateForm)}
                  disabled={!dailyUpdateForm.update_date || !dailyUpdateForm.work_completed}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Update
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <h3 className="font-semibold">Daily Updates</h3>
              {dailyUpdates.length === 0 ? (
                <p className="text-muted-foreground text-sm">No updates recorded yet</p>
              ) : (
                dailyUpdates.map((update: any) => (
                  <Card key={update.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{format(new Date(update.update_date), "dd MMM yyyy")}</p>
                          {update.labor_count && <p className="text-sm text-muted-foreground">Labor: {update.labor_count}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDailyUpdateMutation.mutate(update.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-sm mb-1"><strong>Work:</strong> {update.work_completed}</p>
                      {update.materials_used && <p className="text-sm"><strong>Materials:</strong> {update.materials_used}</p>}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <h3 className="font-semibold">Project Milestones</h3>
            {milestones.length === 0 ? (
              <p className="text-muted-foreground text-sm">No milestones defined yet</p>
            ) : (
              milestones.map((milestone: any) => (
                <Card key={milestone.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{milestone.milestone_name}</p>
                        <p className="text-sm text-muted-foreground">{milestone.status}</p>
                        <p className="text-sm mt-2">Progress: {milestone.progress_percentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <h3 className="font-semibold">Project Documents</h3>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">No documents uploaded yet</p>
            ) : (
              documents.map((doc: any) => (
                <Card key={doc.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.upload_date), "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

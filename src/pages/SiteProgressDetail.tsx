import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, DollarSign, Users, FileText, TrendingUp, AlertCircle, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { SiteProgressDialog } from "@/components/site/SiteProgressDialog";

export default function SiteProgressDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_progress")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ["site-milestones", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_milestones")
        .select("*")
        .eq("site_progress_id", id)
        .order("planned_start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: dailyUpdates = [] } = useQuery({
    queryKey: ["site-daily-updates", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_daily_updates")
        .select("*")
        .eq("site_progress_id", id)
        .order("update_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_progress").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Project deleted successfully");
      navigate("/site-progress");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Project not found</p>
        <Button onClick={() => navigate("/site-progress")}>Back to Projects</Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      planning: "bg-blue-500",
      in_progress: "bg-yellow-500",
      on_hold: "bg-orange-500",
      completed: "bg-green-500",
      cancelled: "bg-gray-500",
      not_started: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const budgetUtilization = site.total_budget > 0 
    ? parseFloat(((site.spent_amount / site.total_budget) * 100).toFixed(1))
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/site-progress")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{site.project_name}</h1>
            <p className="text-muted-foreground mt-1">
              {site.site_address}, {site.city}, {site.state}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => deleteMutation.mutate(site.id)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{site.overall_progress_percentage}%</div>
            <Progress value={site.overall_progress_percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetUtilization}%</div>
            <p className="text-sm text-muted-foreground mt-1">
              ₹{formatIndianNumber(site.spent_amount)} / ₹{formatIndianNumber(site.total_budget)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">
              {format(new Date(site.start_date), "MMM dd, yyyy")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {site.expected_completion_date && `Target: ${format(new Date(site.expected_completion_date), "MMM dd, yyyy")}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(site.project_status)}>
              {site.project_status?.replace("_", " ").toUpperCase()}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              {site.project_type}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="updates">Daily Updates</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Project Type</p>
                <p className="font-medium">{site.project_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Construction Type</p>
                <p className="font-medium">{site.construction_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Area</p>
                <p className="font-medium">{site.total_area_sqft ? `${formatIndianNumber(site.total_area_sqft)} sqft` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Floors</p>
                <p className="font-medium">{site.number_of_floors || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Number of Units</p>
                <p className="font-medium">{site.number_of_units || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project Manager</p>
                <p className="font-medium">{site.project_manager || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contractor</p>
                <p className="font-medium">{site.contractor_name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Architect</p>
                <p className="font-medium">{site.architect_name || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {site.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{site.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          {milestones.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No milestones added yet
              </CardContent>
            </Card>
          ) : (
            milestones.map((milestone: any) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{milestone.milestone_name}</CardTitle>
                    <Badge className={getStatusColor(milestone.status)}>
                      {milestone.status?.replace("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {milestone.milestone_description && (
                    <p className="text-sm text-muted-foreground">{milestone.milestone_description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p className="font-medium">
                        {milestone.planned_start_date ? format(new Date(milestone.planned_start_date), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {milestone.planned_end_date ? format(new Date(milestone.planned_end_date), "MMM dd, yyyy") : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium">
                        ₹{milestone.budget_allocated ? formatIndianNumber(milestone.budget_allocated) : "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Progress</p>
                      <p className="font-medium">{milestone.progress_percentage || 0}%</p>
                    </div>
                  </div>
                  {milestone.progress_percentage !== null && (
                    <Progress value={milestone.progress_percentage} className="mt-2" />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="updates" className="space-y-4">
          {dailyUpdates.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No daily updates recorded yet
              </CardContent>
            </Card>
          ) : (
            dailyUpdates.map((update: any) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {format(new Date(update.update_date), "MMMM dd, yyyy")}
                    </CardTitle>
                    {update.progress_percentage && (
                      <Badge variant="outline">{update.progress_percentage}% Progress</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">Work Completed</p>
                    <p className="text-sm text-muted-foreground">{update.work_completed}</p>
                  </div>
                  {update.materials_used && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Materials Used</p>
                      <p className="text-sm text-muted-foreground">{update.materials_used}</p>
                    </div>
                  )}
                  {update.labor_count && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span><strong>Labor Count:</strong> {update.labor_count}</span>
                    </div>
                  )}
                  {update.supervisor_name && (
                    <div className="text-sm">
                      <strong>Supervisor:</strong> {update.supervisor_name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">₹{formatIndianNumber(site.total_budget || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Amount Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-500">₹{formatIndianNumber(site.spent_amount || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Pending Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-500">
                  ₹{formatIndianNumber(site.pending_amount || (site.total_budget - site.spent_amount) || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Budget Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={Number(budgetUtilization)} className="h-3" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Utilized: {budgetUtilization.toFixed(1)}%</span>
                  <span className="text-muted-foreground">
                    Remaining: {site.total_budget > 0 ? (100 - budgetUtilization).toFixed(1) : "0"}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Milestone-wise Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone: any) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{milestone.milestone_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Allocated: ₹{milestone.budget_allocated ? formatIndianNumber(milestone.budget_allocated) : "0"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          Spent: ₹{milestone.budget_spent ? formatIndianNumber(milestone.budget_spent) : "0"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.budget_allocated > 0 
                            ? `${((milestone.budget_spent / milestone.budget_allocated) * 100).toFixed(1)}%`
                            : "0%"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <SiteProgressDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        site={site}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["site", id] });
          setIsEditDialogOpen(false);
        }}
      />
    </div>
  );
}

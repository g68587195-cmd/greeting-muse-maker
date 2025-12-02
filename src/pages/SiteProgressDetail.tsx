import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, DollarSign, Receipt, Edit, Trash2 } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { useState, useEffect } from "react";
import { PhaseDialog } from "@/components/site/PhaseDialog";
import { DailyLogDialog } from "@/components/site/DailyLogDialog";
import { MaterialLogDialog } from "@/components/site/MaterialLogDialog";
import { LaborLogDialog } from "@/components/site/LaborLogDialog";
import { EquipmentLogDialog } from "@/components/site/EquipmentLogDialog";
import { InspectionDialog } from "@/components/site/InspectionDialog";
import { PhasePaymentDialog } from "@/components/site/PhasePaymentDialog";
import { DailyLogDetailModal } from "@/components/site/DailyLogDetailModal";
import { MaterialLogDetailModal } from "@/components/site/MaterialLogDetailModal";
import { LaborLogDetailModal } from "@/components/site/LaborLogDetailModal";
import { EquipmentLogDetailModal } from "@/components/site/EquipmentLogDetailModal";
import { InspectionDetailModal } from "@/components/site/InspectionDetailModal";
import { SiteDocumentsTab } from "@/components/site/SiteDocumentsTab";
import { ProjectTimeline } from "@/components/site/ProjectTimeline";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { format, isBefore, isAfter, startOfDay } from "date-fns";

export default function SiteProgressDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [dailyLogDialogOpen, setDailyLogDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [laborDialogOpen, setLaborDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [phasePaymentDialogOpen, setPhasePaymentDialogOpen] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>("");
  const [viewPhaseDetails, setViewPhaseDetails] = useState<any>(null);
  
  const [dailyLogDetail, setDailyLogDetail] = useState<any>(null);
  const [materialDetail, setMaterialDetail] = useState<any>(null);
  const [laborDetail, setLaborDetail] = useState<any>(null);
  const [equipmentDetail, setEquipmentDetail] = useState<any>(null);
  const [inspectionDetail, setInspectionDetail] = useState<any>(null);
  const [editingLog, setEditingLog] = useState<any>(null);
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");
  
  // Delete mutations
  const deleteLogMutation = useMutation({
    mutationFn: async ({ table, id: logId }: { table: string; id: string }) => {
      const { error } = await supabase.from(table as any).delete().eq("id", logId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`site_${variables.table}`, id] as any });
      toast.success("Deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["site_project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_projects")
        .select(`
          *,
          clients(full_name),
          properties(title)
        `)
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
      
      // Check and update overdue statuses
      const today = startOfDay(new Date());
      const updates = data?.map(async (phase) => {
        if (phase.status !== "completed" && phase.status !== "overdue") {
          const expectedEnd = phase.planned_end_date ? new Date(phase.planned_end_date) : null;
          if (expectedEnd && isBefore(expectedEnd, today)) {
            await supabase
              .from("site_phases")
              .update({ status: "overdue" })
              .eq("id", phase.id);
            return { ...phase, status: "overdue" };
          }
        }
        return phase;
      });
      
      return updates ? await Promise.all(updates) : data;
    },
    enabled: !!id,
  });

  const { data: dailyLogs = [] } = useQuery({
    queryKey: ["site_daily_logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_daily_logs")
        .select("*")
        .eq("project_id", id)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["site_materials_log", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_materials_log")
        .select("*")
        .eq("project_id", id)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: labor = [] } = useQuery({
    queryKey: ["site_labor_log", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_labor_log")
        .select("*")
        .eq("project_id", id)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ["site_equipment_log", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_equipment_log")
        .select("*")
        .eq("project_id", id)
        .order("log_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ["site_inspections", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_inspections")
        .select("*")
        .eq("project_id", id)
        .order("inspection_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/site-progress")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate("/site-progress")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
        <Button onClick={() => navigate(`/site-progress/${id}/expenses`)} variant="outline" size="sm">
          <Receipt className="h-4 w-4 mr-2" />
          Expenses
        </Button>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{project.project_name}</h1>
        <p className="text-muted-foreground">{project.project_code}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">₹{formatIndianNumber(project.total_budget || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm">Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">₹{formatIndianNumber(project.spent_amount || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {((project.spent_amount / project.total_budget) * 100).toFixed(1)}% used
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold">₹{formatIndianNumber((project.total_budget || 0) - (project.spent_amount || 0))}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg sm:text-2xl font-bold mb-2">{project.overall_progress_percentage || 0}%</p>
            <Progress value={project.overall_progress_percentage || 0} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <ProjectTimeline phases={phases} />

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-7 gap-2">
          <TabsTrigger value="phases" className="text-xs sm:text-sm">Phases</TabsTrigger>
          <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily</TabsTrigger>
          <TabsTrigger value="materials" className="text-xs sm:text-sm">Materials</TabsTrigger>
          <TabsTrigger value="labor" className="text-xs sm:text-sm">Labor</TabsTrigger>
          <TabsTrigger value="equipment" className="text-xs sm:text-sm">Equipment</TabsTrigger>
          <TabsTrigger value="inspections" className="text-xs sm:text-sm">Inspect</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Project Phases</h2>
            <Button onClick={() => setPhaseDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Phase
            </Button>
          </div>
          <div className="grid gap-4">
            {phases.map((phase: any) => {
              const getPhaseStatusColor = (status: string) => {
                const colors: Record<string, string> = {
                  not_started: "bg-gray-500 text-white",
                  in_progress: "bg-blue-500 text-white",
                  completed: "bg-green-500 text-white",
                  on_hold: "bg-yellow-500 text-white",
                  overdue: "bg-red-500 text-white",
                };
                return colors[status] || "bg-gray-500 text-white";
              };

              return (
              <Card key={phase.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewPhaseDetails(phase)}>
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg">{phase.phase_name}</CardTitle>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{phase.phase_code}</p>
                      </div>
                      <Badge className={getPhaseStatusColor(phase.status)}>
                        {phase.status?.replace("_", " ")}
                      </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Progress:</span>
                      <span className="font-semibold">{phase.progress_percentage}%</span>
                    </div>
                    <Progress value={phase.progress_percentage} />
                    <div className="grid grid-cols-2 gap-4 mt-4 text-xs sm:text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget Allocated</p>
                        <p className="font-semibold truncate">₹{formatIndianNumber(phase.budget_allocated)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget Spent</p>
                        <p className="font-semibold text-primary truncate">₹{formatIndianNumber(phase.budget_spent)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhaseId(phase.id);
                          setPhasePaymentDialogOpen(true);
                        }}
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Add Payment</span>
                        <span className="sm:hidden">Payment</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
            {phases.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No phases added yet. Click "Add Phase" to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Daily Progress Logs</h2>
            <Button onClick={() => { setEditingLog(null); setDailyLogDialogOpen(true); }} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search daily logs..."
            className="max-w-md"
          />
          <div className="grid gap-4">
            {dailyLogs.filter((log: any) => 
              !searchQuery || 
              log.work_completed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              log.issues_reported?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((log: any) => (
              <Card key={log.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDailyLogDetail(log)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{new Date(log.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingLog(log); setDailyLogDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Work Completed:</span> {log.work_completed}</div>
                    <div><span className="font-semibold">Labor Count:</span> {log.labor_count}</div>
                    <div><span className="font-semibold">Weather:</span> {log.weather_conditions}</div>
                    {log.issues_reported && <div className="text-destructive"><span className="font-semibold">Issues:</span> {log.issues_reported}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {dailyLogs.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No daily logs recorded yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Material Logs</h2>
            <Button onClick={() => setMaterialDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search materials..."
            className="max-w-md"
          />
          <div className="grid gap-4">
            {materials.filter((material: any) =>
              !searchQuery ||
              material.material_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              material.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((material: any) => (
              <Card key={material.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setMaterialDetail(material)}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-base">{material.material_name}</CardTitle>
                      {material.material_category && <Badge variant="outline" className="mt-1">{material.material_category}</Badge>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantity Issued</p>
                      <p className="font-semibold">{material.quantity_issued} {material.unit}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Cost</p>
                      <p className="font-semibold text-primary">₹{formatIndianNumber(material.total_cost || 0)}</p>
                    </div>
                    {material.supplier_name && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Supplier</p>
                        <p className="font-medium">{material.supplier_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {materials.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No material logs recorded yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="labor" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Labor Logs</h2>
            <Button onClick={() => setLaborDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Labor
            </Button>
          </div>
          <div className="grid gap-4">
            {labor.map((log: any) => (
              <Card key={log.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-base">{log.labor_type}</CardTitle>
                    <span className="text-sm text-muted-foreground">{new Date(log.log_date).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Count</p>
                      <p className="font-semibold">{log.total_count}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Wages</p>
                      <p className="font-semibold">₹{formatIndianNumber(log.total_wages)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {labor.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No labor logs recorded yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="equipment" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Equipment Logs</h2>
            <Button onClick={() => setEquipmentDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </div>
          <div className="grid gap-4">
            {equipment.map((eq: any) => (
              <Card key={eq.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-base">{eq.equipment_name}</CardTitle>
                    <Badge variant="outline">{eq.equipment_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Usage Duration</p>
                      <p className="font-semibold">{eq.usage_duration} hrs</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Cost</p>
                      <p className="font-semibold">₹{formatIndianNumber(eq.rental_cost + eq.fuel_cost)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {equipment.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No equipment logs recorded yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg md:text-xl font-semibold">Inspections</h2>
            <Button onClick={() => setInspectionDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Inspection
            </Button>
          </div>
          <div className="grid gap-4">
            {inspections.map((inspection: any) => (
              <Card 
                key={inspection.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setInspectionDetail(inspection)}
              >
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-base">{inspection.inspection_type}</CardTitle>
                    <Badge className={
                      inspection.approval_status === 'approved' ? 'bg-green-500' :
                      inspection.approval_status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                    }>{inspection.approval_status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Inspector:</span> {inspection.inspected_by}</div>
                    <div><span className="font-semibold">Date:</span> {new Date(inspection.inspection_date).toLocaleDateString()}</div>
                    {inspection.quality_rating && <div><span className="font-semibold">Quality:</span> {inspection.quality_rating}</div>}
                    {inspection.issues_found && <div><span className="font-semibold">Issues:</span> {inspection.issues_found}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {inspections.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No inspections recorded yet.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <SiteDocumentsTab projectId={id!} />
        </TabsContent>
      </Tabs>

      <PhaseDialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen} projectId={id!} />
      <DailyLogDialog open={dailyLogDialogOpen} onOpenChange={setDailyLogDialogOpen} projectId={id!} />
      <MaterialLogDialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen} projectId={id!} />
      <LaborLogDialog open={laborDialogOpen} onOpenChange={setLaborDialogOpen} projectId={id!} />
      <EquipmentLogDialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen} projectId={id!} />
      <InspectionDialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen} projectId={id!} />
      
      {selectedPhaseId && (
        <PhasePaymentDialog
          open={phasePaymentDialogOpen}
          onOpenChange={setPhasePaymentDialogOpen}
          phaseId={selectedPhaseId}
          projectId={id!}
        />
      )}
      
      {viewPhaseDetails && (
        <Dialog open={!!viewPhaseDetails} onOpenChange={(open) => !open && setViewPhaseDetails(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewPhaseDetails.phase_name} - Details</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="logs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="logs">Daily Logs</TabsTrigger>
                <TabsTrigger value="payments">Phase Info</TabsTrigger>
              </TabsList>
              <TabsContent value="logs" className="space-y-4">
                <div className="space-y-4">
                  {Object.entries(
                    dailyLogs
                      .filter((log: any) => log.phase_id === viewPhaseDetails.id)
                      .reduce((acc: any, log: any) => {
                        const month = format(new Date(log.log_date), "MMMM yyyy");
                        if (!acc[month]) acc[month] = [];
                        acc[month].push(log);
                        return acc;
                      }, {})
                  ).map(([month, logs]: [string, any]) => (
                    <div key={month}>
                      <h3 className="font-semibold mb-2">{month}</h3>
                      <div className="space-y-2">
                        {logs.map((log: any) => (
                          <Card key={log.id}>
                            <CardHeader className="py-3">
                              <CardTitle className="text-sm">
                                {format(new Date(log.log_date), "MMM dd, yyyy")}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-3 space-y-2">
                              <div>
                                <p className="text-xs font-semibold">Work Completed:</p>
                                <p className="text-xs text-muted-foreground">{log.work_completed}</p>
                              </div>
                              {log.labor_count > 0 && (
                                <p className="text-xs">Labor: {log.labor_count} workers</p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                  {dailyLogs.filter((log: any) => log.phase_id === viewPhaseDetails.id).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No daily logs for this phase yet</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="payments" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Allocated</p>
                    <p className="text-2xl font-bold">₹{formatIndianNumber(viewPhaseDetails.budget_allocated)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Spent</p>
                    <p className="text-2xl font-bold text-primary">₹{formatIndianNumber(viewPhaseDetails.budget_spent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Budget</p>
                    <p className="text-2xl font-bold">
                      ₹{formatIndianNumber((viewPhaseDetails.budget_allocated || 0) - (viewPhaseDetails.budget_spent || 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold">{viewPhaseDetails.progress_percentage}%</p>
                  </div>
                </div>
                <Button onClick={() => {
                  setSelectedPhaseId(viewPhaseDetails.id);
                  setPhasePaymentDialogOpen(true);
                  setViewPhaseDetails(null);
                }} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment to Phase
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Detail Modals */}
      <DailyLogDetailModal
        open={!!dailyLogDetail}
        onOpenChange={(open) => !open && setDailyLogDetail(null)}
        log={dailyLogDetail}
        onEdit={() => {
          setEditingLog(dailyLogDetail);
          setDailyLogDetail(null);
          setDailyLogDialogOpen(true);
        }}
        onDelete={() => {
          if (dailyLogDetail) {
            deleteLogMutation.mutate({ table: "daily_logs", id: dailyLogDetail.id });
            setDailyLogDetail(null);
          }
        }}
      />
      
      <MaterialLogDetailModal
        open={!!materialDetail}
        onOpenChange={(open) => !open && setMaterialDetail(null)}
        log={materialDetail}
        onEdit={() => {
          setMaterialDetail(null);
          setMaterialDialogOpen(true);
        }}
        onDelete={() => {
          if (materialDetail) {
            deleteLogMutation.mutate({ table: "materials_log", id: materialDetail.id });
            setMaterialDetail(null);
          }
        }}
      />
      
      <LaborLogDetailModal
        open={!!laborDetail}
        onOpenChange={(open) => !open && setLaborDetail(null)}
        log={laborDetail}
        onEdit={() => {
          setLaborDetail(null);
          setLaborDialogOpen(true);
        }}
        onDelete={() => {
          if (laborDetail) {
            deleteLogMutation.mutate({ table: "labor_log", id: laborDetail.id });
            setLaborDetail(null);
          }
        }}
      />
      
      <EquipmentLogDetailModal
        open={!!equipmentDetail}
        onOpenChange={(open) => !open && setEquipmentDetail(null)}
        log={equipmentDetail}
        onEdit={() => {
          setEquipmentDetail(null);
          setEquipmentDialogOpen(true);
        }}
        onDelete={() => {
          if (equipmentDetail) {
            deleteLogMutation.mutate({ table: "equipment_log", id: equipmentDetail.id });
            setEquipmentDetail(null);
          }
        }}
      />
      
      <InspectionDetailModal
        open={!!inspectionDetail}
        onOpenChange={(open) => !open && setInspectionDetail(null)}
        inspection={inspectionDetail}
        projectId={id!}
        onEdit={() => {
          setInspectionDetail(null);
          setInspectionDialogOpen(true);
        }}
        onDelete={() => {
          if (inspectionDetail) {
            deleteLogMutation.mutate({ table: "inspections", id: inspectionDetail.id });
            setInspectionDetail(null);
          }
        }}
      />
    </div>
  );
}
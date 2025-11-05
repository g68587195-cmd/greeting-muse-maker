import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, DollarSign } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { useState, useEffect } from "react";
import { PhaseDialog } from "@/components/site/PhaseDialog";
import { DailyLogDialog } from "@/components/site/DailyLogDialog";
import { MaterialLogDialog } from "@/components/site/MaterialLogDialog";
import { LaborLogDialog } from "@/components/site/LaborLogDialog";
import { EquipmentLogDialog } from "@/components/site/EquipmentLogDialog";
import { InspectionDialog } from "@/components/site/InspectionDialog";
import { PhasePaymentDialog } from "@/components/site/PhasePaymentDialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <Button variant="ghost" onClick={() => navigate("/site-progress")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>

      <div>
        <h1 className="text-3xl font-bold">{project.project_name}</h1>
        <p className="text-muted-foreground">{project.project_code}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{formatIndianNumber(project.total_budget || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spent Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">₹{formatIndianNumber(project.spent_amount || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">₹{formatIndianNumber((project.total_budget || 0) - (project.spent_amount || 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold mb-2">{project.overall_progress_percentage || 0}%</p>
            <Progress value={project.overall_progress_percentage || 0} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="phases" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="phases">Phases</TabsTrigger>
          <TabsTrigger value="daily">Daily Logs</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="phases" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Project Phases</h2>
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
                <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle>{phase.phase_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{phase.phase_code}</p>
                      </div>
                      <Badge className={getPhaseStatusColor(phase.status)}>
                        {phase.status?.replace("_", " ")}
                      </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress:</span>
                      <span className="font-semibold">{phase.progress_percentage}%</span>
                    </div>
                    <Progress value={phase.progress_percentage} />
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget Allocated</p>
                        <p className="font-semibold">₹{formatIndianNumber(phase.budget_allocated)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Budget Spent</p>
                        <p className="font-semibold text-primary">₹{formatIndianNumber(phase.budget_spent)}</p>
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
                        Add Payment
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Daily Progress Logs</h2>
            <Button onClick={() => setDailyLogDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Log
            </Button>
          </div>
          <div className="grid gap-4">
            {dailyLogs.map((log: any) => (
              <Card key={log.id}>
                <CardHeader>
                  <CardTitle className="text-base">{new Date(log.log_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Work Completed:</span> {log.work_completed}</div>
                    <div><span className="font-semibold">Labor Count:</span> {log.labor_count}</div>
                    <div><span className="font-semibold">Weather:</span> {log.weather_conditions}</div>
                    {log.issues_reported && <div><span className="font-semibold">Issues:</span> {log.issues_reported}</div>}
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Material Logs</h2>
            <Button onClick={() => setMaterialDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Material
            </Button>
          </div>
          <div className="grid gap-4">
            {materials.map((material: any) => (
              <Card key={material.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle className="text-base">{material.material_name}</CardTitle>
                    <Badge variant="outline">{material.material_category}</Badge>
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
                      <p className="font-semibold">₹{formatIndianNumber(material.total_cost)}</p>
                    </div>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Labor Logs</h2>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Equipment Logs</h2>
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
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Inspections</h2>
            <Button onClick={() => setInspectionDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Inspection
            </Button>
          </div>
          <div className="grid gap-4">
            {inspections.map((inspection: any) => (
              <Card key={inspection.id}>
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
                  {dailyLogs
                    .filter((log: any) => log.phase_id === viewPhaseDetails.id)
                    .reduce((acc: any, log: any) => {
                      const month = format(new Date(log.log_date), "MMMM yyyy");
                      if (!acc[month]) acc[month] = [];
                      acc[month].push(log);
                      return acc;
                    }, {})}
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
    </div>
  );
}
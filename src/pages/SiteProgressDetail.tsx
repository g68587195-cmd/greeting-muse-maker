import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { useState } from "react";
import { PhaseDialog } from "@/components/site/PhaseDialog";
import { DailyLogDialog } from "@/components/site/DailyLogDialog";
import { MaterialLogDialog } from "@/components/site/MaterialLogDialog";
import { LaborLogDialog } from "@/components/site/LaborLogDialog";
import { EquipmentLogDialog } from "@/components/site/EquipmentLogDialog";
import { InspectionDialog } from "@/components/site/InspectionDialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function SiteProgressDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [dailyLogDialogOpen, setDailyLogDialogOpen] = useState(false);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [laborDialogOpen, setLaborDialogOpen] = useState(false);
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);

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
      return data;
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
            {phases.map((phase: any) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{phase.phase_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{phase.phase_code}</p>
                    </div>
                    <Badge>{phase.status}</Badge>
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
                        <p className="font-semibold">₹{formatIndianNumber(phase.budget_spent)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
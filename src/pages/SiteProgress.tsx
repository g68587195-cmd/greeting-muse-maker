import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Building2, TrendingUp, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { SearchInput } from "@/components/ui/search-input";
import { SiteProjectDialog } from "@/components/site/SiteProjectDialog";
import { toast } from "sonner";

export default function SiteProgress() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["site_projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("site_projects")
        .select(`
          *,
          clients(full_name),
          properties(title)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredProjects = projects.filter(project =>
    project.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.project_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-500 text-white",
      in_progress: "bg-yellow-500 text-white",
      on_hold: "bg-orange-500 text-white",
      completed: "bg-green-500 text-white",
      cancelled: "bg-red-500 text-white",
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getHealthColor = (health: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-500 text-white",
      yellow: "bg-yellow-500 text-white",
      red: "bg-red-500 text-white",
    };
    return colors[health] || "bg-gray-500 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Progress</h1>
          <p className="text-muted-foreground mt-1">Track and manage construction projects</p>
        </div>
        <Button onClick={() => { setSelectedProject(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search projects by name, code, or city..."
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Start tracking your first construction project</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-all cursor-pointer"
              onClick={() => navigate(`/site-progress/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{project.project_name}</CardTitle>
                    {project.project_code && (
                      <p className="text-sm text-muted-foreground">{project.project_code}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(project.project_status)}>
                      {project.project_status?.replace("_", " ")}
                    </Badge>
                    <Badge className={getHealthColor(project.health_indicator)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{project.overall_progress_percentage || 0}%</span>
                  </div>
                  <Progress value={project.overall_progress_percentage || 0} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold">₹{(project.total_budget || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Spent</p>
                    <p className="font-semibold">₹{(project.spent_amount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                    <span>{new Date(project.start_date).toLocaleDateString()}</span>
                  </div>
                  {project.expected_completion_date && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Target:</span>
                      <span>{new Date(project.expected_completion_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground truncate">
                    {project.site_address}, {project.city}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SiteProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
}

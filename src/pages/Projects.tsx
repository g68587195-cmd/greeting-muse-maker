import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

  const filteredProjects = projects.filter((project: any) =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.project_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: any = {
      planning: "bg-blue-500",
      in_progress: "bg-yellow-500",
      completed: "bg-green-500",
      on_hold: "bg-gray-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getHealthColor = (health: string) => {
    const colors: any = {
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colors[health] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage all your construction and service projects</p>
        </div>
        <Button onClick={() => { setSelectedProject(null); setIsDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : filteredProjects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchTerm ? "No projects found matching your search" : "No projects yet. Create your first project to get started!"}
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project: any) => (
            <Card key={project.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setSelectedProject(project); setIsDialogOpen(true); }}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{project.project_name}</CardTitle>
                    {project.project_code && (
                      <p className="text-sm text-muted-foreground">{project.project_code}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(project.project_status)}>
                    {project.project_status?.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{project.project_type}</span>
                </div>
                {project.clients && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-medium">{project.clients.full_name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">₹{formatIndianNumber(project.total_budget || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress:</span>
                  <span className="font-medium">{project.overall_progress_percentage || 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Health:</span>
                  <Badge variant="outline" className={getHealthColor(project.health_indicator)}>
                    {project.health_indicator}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={selectedProject}
        onSuccess={() => {
          setIsDialogOpen(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
}

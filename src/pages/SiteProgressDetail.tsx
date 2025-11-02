import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SiteProgressDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Type:</span> {project.project_type}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {project.project_status}
            </div>
            <div>
              <span className="font-semibold">Start Date:</span> {new Date(project.start_date).toLocaleDateString()}
            </div>
            {project.expected_completion_date && (
              <div>
                <span className="font-semibold">Expected Completion:</span>{" "}
                {new Date(project.expected_completion_date).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Total Budget:</span> ₹{(project.total_budget || 0).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Spent:</span> ₹{(project.spent_amount || 0).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Remaining:</span> ₹{((project.total_budget || 0) - (project.spent_amount || 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {project.project_manager && (
              <div>
                <span className="font-semibold">Project Manager:</span> {project.project_manager}
              </div>
            )}
            {project.site_engineer && (
              <div>
                <span className="font-semibold">Site Engineer:</span> {project.site_engineer}
              </div>
            )}
            {project.contractor_name && (
              <div>
                <span className="font-semibold">Contractor:</span> {project.contractor_name}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed project tracking features including phases, daily logs, materials, labor, equipment, inspections, and more will be available here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

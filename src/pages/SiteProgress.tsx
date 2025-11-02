import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Construction } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SiteProgressDialog } from "@/components/site/SiteProgressDialog";
import { SiteDetailModal } from "@/components/site/SiteDetailModal";
import { format } from "date-fns";

export default function SiteProgress() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("site_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false});
      if (error) throw error;
      return data;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: any = {
      planning: "bg-blue-500",
      in_progress: "bg-yellow-500",
      on_hold: "bg-orange-500",
      completed: "bg-green-500",
      cancelled: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getHealthColor = (health: string) => {
    const colors: any = {
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      red: "bg-red-500",
    };
    return colors[health] || "bg-green-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Progress</h1>
          <p className="text-muted-foreground mt-1">Track construction projects</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = `/site-progress/${site.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Construction className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-base md:text-lg truncate">{site.project_name}</CardTitle>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Badge className={`${getStatusColor(site.project_status)} text-xs`}>
                      {site.project_status}
                    </Badge>
                    <Badge className={`${getHealthColor(site.health_indicator)} text-xs`}>
                      {site.health_indicator}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm truncate">{site.city}, {site.state || ""}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{site.overall_progress_percentage}%</span>
                  </div>
                  <Progress value={site.overall_progress_percentage} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="truncate">{format(new Date(site.start_date), "dd MMM yyyy")}</p>
                  </div>
                  {site.expected_completion_date && (
                    <div className="text-right">
                      <p className="text-muted-foreground">Expected End</p>
                      <p className="truncate">{format(new Date(site.expected_completion_date), "dd MMM yyyy")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SiteProgressDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedSite(null);
        }}
        site={selectedSite}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["sites"] });
          setIsDialogOpen(false);
          setSelectedSite(null);
        }}
      />
    </div>
  );
}

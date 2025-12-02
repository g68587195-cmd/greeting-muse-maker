import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";

interface ProjectTimelineProps {
  phases: any[];
}

export function ProjectTimeline({ phases }: ProjectTimelineProps) {
  const sortedPhases = [...phases].sort((a, b) => a.phase_order - b.phase_order);

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-primary" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

          <div className="space-y-6">
            {sortedPhases.map((phase, index) => (
              <div key={phase.id} className="relative pl-12">
                {/* Icon */}
                <div className="absolute left-3.5 top-0 flex items-center justify-center w-5 h-5 bg-card rounded-full">
                  {getPhaseIcon(phase.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-semibold">{phase.phase_name}</h4>
                    <Badge className={getStatusColor(phase.status)}>
                      {phase.status?.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {phase.planned_start_date && (
                      <p>
                        Start: {format(new Date(phase.planned_start_date), "MMM dd, yyyy")}
                      </p>
                    )}
                    {phase.planned_end_date && (
                      <p>
                        End: {format(new Date(phase.planned_end_date), "MMM dd, yyyy")}
                      </p>
                    )}
                    {phase.description && (
                      <p className="line-clamp-2">{phase.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Progress: <span className="font-medium text-foreground">{phase.progress_percentage}%</span>
                    </span>
                    {phase.assigned_contractor && (
                      <span className="text-muted-foreground">
                        Contractor: <span className="font-medium text-foreground">{phase.assigned_contractor}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

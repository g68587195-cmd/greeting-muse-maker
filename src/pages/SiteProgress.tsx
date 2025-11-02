import { Construction, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SiteProgress() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Site Progress</h1>
          <p className="text-muted-foreground mt-1">Track construction projects</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Site Progress Module Being Rebuilt</AlertTitle>
        <AlertDescription>
          The site progress module has been restructured with a comprehensive new database schema. 
          Please refresh the page in a few moments to allow the system to regenerate the type definitions.
          The new module will include:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Project Master Data with client & team tracking</li>
            <li>Phase/Milestone Management</li>
            <li>Daily Progress Logs</li>
            <li>Material, Labor & Equipment Tracking</li>
            <li>Quality Inspections</li>
            <li>Financial Logs</li>
            <li>Issues & Change Requests</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Coming Soon</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Comprehensive project tracking with phases, daily logs, and resource management.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

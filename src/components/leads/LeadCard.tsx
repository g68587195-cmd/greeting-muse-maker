import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Calendar, User } from "lucide-react";

interface LeadCardProps {
  lead: any;
  onClick: () => void;
  onStatusChange: (status: string) => void;
}

const statusColors: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-purple-500",
  negotiating: "bg-orange-500",
  converted: "bg-green-500",
  lost: "bg-red-500",
};

export function LeadCard({ lead, onClick, onStatusChange }: LeadCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge className={statusColors[lead.status]}>
            {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
          </Badge>
          <div onClick={(e) => e.stopPropagation()}>
            <Select value={lead.status} onValueChange={onStatusChange}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {lead.lead_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-base font-bold">{lead.lead_name}</span>
          </div>
        )}
        {lead.lead_email && (
          <div className="text-sm text-muted-foreground truncate">
            {lead.lead_email}
          </div>
        )}
        {lead.lead_phone && (
          <div className="text-sm text-muted-foreground">
            {lead.lead_phone}
          </div>
        )}
        {lead.properties && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{lead.properties.title}</span>
          </div>
        )}
        {lead.source && (
          <div className="text-sm text-muted-foreground">
            Source: <span className="capitalize">{lead.source.replace('_', ' ')}</span>
          </div>
        )}
        {lead.follow_up_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Follow-up: {new Date(lead.follow_up_date).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

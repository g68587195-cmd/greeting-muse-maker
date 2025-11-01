import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadDialog } from "@/components/leads/LeadDialog";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";

export default function Leads() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          clients(full_name, email, phone),
          properties(title, address)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredLeads = searchQuery
    ? leads.filter(lead =>
        lead.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lead_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.lead_phone?.includes(searchQuery) ||
        lead.clients?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : leads;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead deleted successfully");
      setDetailModalOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
          <p className="text-muted-foreground mt-1">Track and convert leads to clients</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <SearchInput 
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search leads by name, email, or phone..."
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => {
                setSelectedLead(lead);
                setDetailModalOpen(true);
              }}
              onStatusChange={(status) =>
                updateStatusMutation.mutate({ id: lead.id, status })
              }
            />
          ))}
        </div>
      )}

      <LeadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        lead={selectedLead}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
          setIsDialogOpen(false);
          setSelectedLead(null);
        }}
      />

      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onEdit={(lead) => {
            setSelectedLead(lead);
            setIsDialogOpen(true);
            setDetailModalOpen(false);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}

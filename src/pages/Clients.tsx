import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientDialog } from "@/components/clients/ClientDialog";
import { ClientDetailModal } from "@/components/clients/ClientDetailModal";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";

export default function Clients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredClients = searchQuery
    ? clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone?.includes(searchQuery)
      )
    : clients;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client deleted successfully");
      setDetailModalOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients Management</h1>
          <p className="text-muted-foreground mt-1">Manage all client information and interactions</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <SearchInput 
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search clients by name, email, or phone..."
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
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={() => {
                setSelectedClient(client);
                setDetailModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <ClientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        client={selectedClient}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          setIsDialogOpen(false);
          setSelectedClient(null);
        }}
      />

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          onEdit={(client) => {
            setSelectedClient(client);
            setIsDialogOpen(true);
            setDetailModalOpen(false);
          }}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}

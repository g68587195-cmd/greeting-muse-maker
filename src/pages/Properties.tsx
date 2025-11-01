import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { PropertyDialog } from "@/components/properties/PropertyDialog";
import { PropertyCard } from "@/components/properties/PropertyCard";
import { PropertyDetailModal } from "@/components/properties/PropertyDetailModal";
import { SearchInput } from "@/components/ui/search-input";
import { toast } from "sonner";

export interface Property {
  id: string;
  title: string;
  description: string | null;
  property_type: string;
  status: string;
  category?: string;
  address: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  country: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  year_built: number | null;
  amenities: string[] | null;
  area_cents: number | null;
  area_acres: number | null;
  dtcp_approved: boolean | null;
  facing: string | null;
  plot_dimensions: string | null;
  road_width_feet: number | null;
  corner_plot: boolean | null;
  electricity_available: boolean | null;
  water_source: string | null;
  boundary_wall: boolean | null;
  created_at: string;
  property_images?: { id: string; image_url: string; is_primary: boolean }[];
}

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = properties.filter(property =>
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [searchQuery, properties]);

  const fetchProperties = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("properties")
      .select(`
        *,
        property_images(id, image_url, is_primary, display_order)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching properties");
      console.error(error);
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setDetailOpen(true);
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setDialogOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async (propertyId: string) => {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) {
      toast.error("Error deleting property");
    } else {
      toast.success("Property deleted successfully");
      fetchProperties();
      setDetailOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <Button onClick={() => { setSelectedProperty(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <SearchInput 
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search properties by title, city, or address..."
        className="max-w-md"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : filteredProperties.length === 0 && searchQuery ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No properties found</h3>
          <p className="mb-4 text-sm text-muted-foreground">Try adjusting your search</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No properties yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Get started by adding your first property</p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => handlePropertyClick(property)}
            />
          ))}
        </div>
      )}

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={selectedProperty}
        onSuccess={fetchProperties}
      />

      {selectedProperty && (
        <PropertyDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          property={selectedProperty}
          onEdit={() => handleEdit(selectedProperty)}
          onDelete={() => handleDelete(selectedProperty.id)}
        />
      )}
    </div>
  );
}

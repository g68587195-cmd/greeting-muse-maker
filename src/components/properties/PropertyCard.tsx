import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Bed, Bath, Maximize } from "lucide-react";
import { Property } from "@/pages/Properties";

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const primaryImage = property.property_images?.find(img => img.is_primary)?.image_url;
  const statusColors: Record<string, string> = {
    available: "bg-success text-success-foreground",
    under_offer: "bg-warning text-warning-foreground",
    sold: "bg-destructive text-destructive-foreground",
    rented: "bg-primary text-primary-foreground",
    off_market: "bg-muted text-muted-foreground",
  };

  return (
    <Card 
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={property.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        <Badge className={`absolute right-2 top-2 shadow-md ${statusColors[property.status] || 'bg-muted text-muted-foreground'}`}>
          {property.status.replace("_", " ")}
        </Badge>
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 text-lg font-semibold line-clamp-1">{property.title}</h3>
        
        <div className="mb-3 flex items-center text-sm text-muted-foreground">
          <MapPin className="mr-1 h-4 w-4" />
          <span className="line-clamp-1">{property.city}, {property.state}</span>
        </div>

        <div className="mb-3 text-2xl font-bold text-primary">
          ₹{property.price.toLocaleString()}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span>{property.bedrooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span>{property.bathrooms}</span>
            </div>
          )}
          {property.square_feet && (
            <div className="flex items-center gap-1">
              <Maximize className="h-4 w-4" />
              <span>{property.square_feet} sqft</span>
            </div>
          )}
        </div>

        <Badge variant="outline" className="mt-3">
          {property.property_type}
        </Badge>
      </CardContent>
    </Card>
  );
}

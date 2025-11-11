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
    available: "bg-green-500 text-white",
    under_offer: "bg-yellow-500 text-white",
    sold: "bg-red-500 text-white",
    rented: "bg-blue-500 text-white",
    off_market: "bg-gray-500 text-white",
  };

  const isSold = property.status === 'sold';
  const isRented = property.status === 'rented';

  return (
    <Card 
      className={`group cursor-pointer overflow-hidden transition-all hover:shadow-lg ${(isSold || isRented) ? 'opacity-60' : ''}`}
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
        <Badge className={`absolute right-2 top-2 shadow-md uppercase ${statusColors[property.status] || 'bg-gray-500 text-white'}`}>
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

        <div className="flex gap-2 mt-3">
          <Badge variant="outline">
            {property.property_type}
          </Badge>
          <Badge 
            variant="secondary" 
            className={property.category === 'for_sale' ? 'bg-blue-500/10 text-blue-700' : 'bg-purple-500/10 text-purple-700'}
          >
            {property.category.replace('_', ' ')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

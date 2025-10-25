import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Calendar, DollarSign } from "lucide-react";
import { Property } from "@/pages/Properties";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface PropertyDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  onEdit: () => void;
  onDelete: () => void;
}

export function PropertyDetailModal({
  open,
  onOpenChange,
  property,
  onEdit,
  onDelete,
}: PropertyDetailModalProps) {
  const images = property.property_images || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-2xl">{property.title}</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {images.length > 0 && (
            <Carousel className="w-full">
              <CarouselContent>
                {images.map((img) => (
                  <CarouselItem key={img.id}>
                    <div className="aspect-video overflow-hidden rounded-lg">
                      <img
                        src={img.image_url}
                        alt="Property"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Price:</span>
                <span className="text-xl font-bold text-primary">
                  ₹{property.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Location:</span>
                <span>{property.address}, {property.city}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Listed:</span>
                <span>{new Date(property.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Type:</span>
                <Badge variant="outline">{property.property_type}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Status:</span>
                <Badge>{property.status.replace("_", " ")}</Badge>
              </div>

              {property.bedrooms && (
                <div className="text-sm">
                  <span className="font-semibold">Bedrooms:</span> {property.bedrooms}
                </div>
              )}

              {property.bathrooms && (
                <div className="text-sm">
                  <span className="font-semibold">Bathrooms:</span> {property.bathrooms}
                </div>
              )}

              {property.square_feet && (
                <div className="text-sm">
                  <span className="font-semibold">Area:</span> {property.square_feet} sqft
                </div>
              )}
            </div>
          </div>

          {property.description && (
            <div>
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground">{property.description}</p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="mb-2 font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, i) => (
                  <Badge key={i} variant="secondary">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

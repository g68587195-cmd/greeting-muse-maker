import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Calendar, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { Property } from "@/pages/Properties";
import { formatIndianNumber } from "@/lib/formatIndianNumber";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl pr-4 flex-1">{property.title}</DialogTitle>
            <div className="flex gap-3 flex-shrink-0">
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
            <div className="relative w-full">
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={images[currentImageIndex].image_url}
                  alt="Property"
                  className="h-full w-full object-cover"
                />
              </div>
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Price:</span>
                <span className="text-xl font-bold text-primary">
                  ₹{formatIndianNumber(property.price)}
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

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Category:</span>
                <Badge variant="secondary">{property.category?.replace("_", " ")}</Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 border-t pt-4">
            {property.area_cents && (
              <div className="text-sm">
                <span className="font-semibold">Area (Cents):</span> {property.area_cents}
              </div>
            )}
            {property.area_acres && (
              <div className="text-sm">
                <span className="font-semibold">Area (Acres):</span> {property.area_acres}
              </div>
            )}
            {property.square_feet && (
              <div className="text-sm">
                <span className="font-semibold">Area:</span> {formatIndianNumber(property.square_feet)} sqft
              </div>
            )}
            {property.plot_dimensions && (
              <div className="text-sm">
                <span className="font-semibold">Dimensions:</span> {property.plot_dimensions}
              </div>
            )}
            {property.facing && (
              <div className="text-sm">
                <span className="font-semibold">Facing:</span> {property.facing.replace("_", " ")}
              </div>
            )}
            {property.road_width_feet && (
              <div className="text-sm">
                <span className="font-semibold">Road Width:</span> {property.road_width_feet} ft
              </div>
            )}
            {property.water_source && (
              <div className="text-sm">
                <span className="font-semibold">Water:</span> {property.water_source}
              </div>
            )}
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
            {property.year_built && (
              <div className="text-sm">
                <span className="font-semibold">Built:</span> {property.year_built}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {property.dtcp_approved && <Badge variant="secondary">DTCP Approved</Badge>}
            {property.corner_plot && <Badge variant="secondary">Corner Plot</Badge>}
            {property.electricity_available && <Badge variant="secondary">Electricity</Badge>}
            {property.boundary_wall && <Badge variant="secondary">Boundary Wall</Badge>}
          </div>

          {property.description && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          {property.amenities && property.amenities.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="mb-2 font-semibold">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity, i) => (
                  <Badge key={i} variant="outline">
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

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Property } from "@/pages/Properties";
import { Upload, X } from "lucide-react";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSuccess: () => void;
}

export function PropertyDialog({ open, onOpenChange, property, onSuccess }: PropertyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 15 * 1024 * 1024; // 15MB

    if (files.length + (property?.property_images?.length || 0) > 10) {
      toast.error("Maximum 10 images allowed");
      return;
    }

    if (totalSize > maxSize) {
      toast.error("Total image size must not exceed 15MB");
      return;
    }

    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: any = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      property_type: formData.get("property_type"),
      status: formData.get("status"),
      category: formData.get("category") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      state: formData.get("state") as string || null,
      zip_code: formData.get("zip_code") as string || null,
      country: formData.get("country") as string,
      price: parseFloat(formData.get("price") as string),
      bedrooms: parseInt(formData.get("bedrooms") as string) || null,
      bathrooms: parseInt(formData.get("bathrooms") as string) || null,
      square_feet: parseFloat(formData.get("square_feet") as string) || null,
      year_built: parseInt(formData.get("year_built") as string) || null,
      area_cents: parseFloat(formData.get("area_cents") as string) || null,
      area_acres: parseFloat(formData.get("area_acres") as string) || null,
      dtcp_approved: formData.get("dtcp_approved") === "on",
      facing: formData.get("facing") as string || null,
      plot_dimensions: formData.get("plot_dimensions") as string || null,
      road_width_feet: parseFloat(formData.get("road_width_feet") as string) || null,
      corner_plot: formData.get("corner_plot") === "on",
      electricity_available: formData.get("electricity_available") === "on",
      water_source: formData.get("water_source") as string || null,
      boundary_wall: formData.get("boundary_wall") === "on",
      user_id: user.id,
    };

    let result;
    let propertyId: string;

    if (property) {
      result = await supabase
        .from("properties")
        .update(data)
        .eq("id", property.id)
        .eq("user_id", user.id);
      propertyId = property.id;
    } else {
      const insertResult = await supabase.from("properties").insert([data]).select();
      result = insertResult;
      propertyId = insertResult.data?.[0]?.id;
    }

    if (result.error) {
      toast.error(`Error ${property ? "updating" : "creating"} property`);
      console.error(result.error);
      setLoading(false);
      return;
    }

    // Upload images if any
    if (imageFiles.length > 0 && propertyId) {
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${propertyId}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        await supabase.from('property_images').insert({
          property_id: propertyId,
          image_url: publicUrl,
          is_primary: i === 0,
          display_order: i,
        });
      }
    }

    setLoading(false);
    toast.success(`Property ${property ? "updated" : "created"} successfully`);
    onSuccess();
    onOpenChange(false);
    setImageFiles([]);
    setImagePreviews([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Edit Property" : "Add New Property"}</DialogTitle>
          <DialogDescription>
            {property ? "Update property details" : "Add a new property to your listings"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={property?.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_type">Property Type *</Label>
              <Select name="property_type" defaultValue={property?.property_type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select name="category" defaultValue={property?.category || "for_sale"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="for_sale">For Sale</SelectItem>
                  <SelectItem value="for_rent">For Rent</SelectItem>
                  <SelectItem value="for_lease">For Lease</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select name="status" defaultValue={property?.status || "available"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="under_offer">Under Offer</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="off_market">Off Market</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input id="price" name="price" type="number" step="0.01" defaultValue={property?.price} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_cents">Area (Cents)</Label>
              <Input id="area_cents" name="area_cents" type="number" step="0.01" defaultValue={property?.area_cents || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_acres">Area (Acres)</Label>
              <Input id="area_acres" name="area_acres" type="number" step="0.01" defaultValue={property?.area_acres || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input id="square_feet" name="square_feet" type="number" step="0.01" defaultValue={property?.square_feet || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plot_dimensions">Plot Dimensions</Label>
              <Input id="plot_dimensions" name="plot_dimensions" placeholder="e.g., 40x60 ft" defaultValue={property?.plot_dimensions || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facing">Facing</Label>
              <Select name="facing" defaultValue={property?.facing || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="east">East</SelectItem>
                  <SelectItem value="north">North</SelectItem>
                  <SelectItem value="north_east">North-East</SelectItem>
                  <SelectItem value="north_west">North-West</SelectItem>
                  <SelectItem value="south">South</SelectItem>
                  <SelectItem value="south_east">South-East</SelectItem>
                  <SelectItem value="south_west">South-West</SelectItem>
                  <SelectItem value="west">West</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="road_width_feet">Road Width (Feet)</Label>
              <Input id="road_width_feet" name="road_width_feet" type="number" step="0.01" defaultValue={property?.road_width_feet || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="water_source">Water Source</Label>
              <Input id="water_source" name="water_source" placeholder="e.g., Borewell, Corporation" defaultValue={property?.water_source || ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={property?.description || ""} rows={3} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" name="address" defaultValue={property?.address} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" name="city" defaultValue={property?.city} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={property?.state || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input id="zip_code" name="zip_code" defaultValue={property?.zip_code || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" defaultValue={property?.country || "India"} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" name="bathrooms" type="number" defaultValue={property?.bathrooms || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_built">Year Built</Label>
              <Input id="year_built" name="year_built" type="number" defaultValue={property?.year_built || ""} />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Additional Features</h3>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <Checkbox id="dtcp_approved" name="dtcp_approved" defaultChecked={property?.dtcp_approved} />
                <Label htmlFor="dtcp_approved" className="font-normal">DTCP Approved</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="corner_plot" name="corner_plot" defaultChecked={property?.corner_plot} />
                <Label htmlFor="corner_plot" className="font-normal">Corner Plot</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="electricity_available" name="electricity_available" defaultChecked={property?.electricity_available !== false} />
                <Label htmlFor="electricity_available" className="font-normal">Electricity Available</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="boundary_wall" name="boundary_wall" defaultChecked={property?.boundary_wall} />
                <Label htmlFor="boundary_wall" className="font-normal">Boundary Wall</Label>
              </div>
            </div>
          </div>

          {!property && (
            <div className="space-y-2">
              <Label>Property Images (Max 10, Total 15MB)</Label>
              <div className="flex items-center gap-2">
                <Input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" id="image-upload" />
                <Label htmlFor="image-upload" className="flex items-center gap-2 cursor-pointer px-4 py-2 border rounded-md hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  Choose Images
                </Label>
                <span className="text-sm text-muted-foreground">
                  {imageFiles.length} file(s) selected
                </span>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded" />
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => removeImage(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : property ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

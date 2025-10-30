import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import { NumberInput } from "@/components/ui/number-input";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onSuccess: () => void;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  property_type: z.string().min(1, "Property type is required"),
  status: z.string().min(1, "Status is required"),
  category: z.string().min(1, "Category is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  price: z.string().min(1, "Price is required"),
  bedrooms: z.string().optional(),
  bathrooms: z.string().optional(),
  square_feet: z.string().optional(),
  year_built: z.string().optional(),
  area_cents: z.string().optional(),
  area_acres: z.string().optional(),
  dtcp_approved: z.boolean().optional(),
  facing: z.string().optional(),
  plot_dimensions: z.string().optional(),
  road_width_feet: z.string().optional(),
  corner_plot: z.boolean().optional(),
  electricity_available: z.boolean().optional(),
  water_source: z.string().optional(),
  boundary_wall: z.boolean().optional(),
});

export function PropertyDialog({ open, onOpenChange, property, onSuccess }: PropertyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      property_type: "",
      status: "available",
      category: "for_sale",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "India",
      price: "",
      bedrooms: "",
      bathrooms: "",
      square_feet: "",
      year_built: "",
      area_cents: "",
      area_acres: "",
      dtcp_approved: false,
      facing: "",
      plot_dimensions: "",
      road_width_feet: "",
      corner_plot: false,
      electricity_available: true,
      water_source: "",
      boundary_wall: false,
    },
  });

  useEffect(() => {
    if (property && open) {
      form.reset({
        title: property.title || "",
        description: property.description || "",
        property_type: property.property_type || "",
        status: property.status || "available",
        category: property.category || "for_sale",
        address: property.address || "",
        city: property.city || "",
        state: property.state || "",
        zip_code: property.zip_code || "",
        country: property.country || "India",
        price: property.price?.toString() || "",
        bedrooms: property.bedrooms?.toString() || "",
        bathrooms: property.bathrooms?.toString() || "",
        square_feet: property.square_feet?.toString() || "",
        year_built: property.year_built?.toString() || "",
        area_cents: property.area_cents?.toString() || "",
        area_acres: property.area_acres?.toString() || "",
        dtcp_approved: property.dtcp_approved || false,
        facing: property.facing || "",
        plot_dimensions: property.plot_dimensions || "",
        road_width_feet: property.road_width_feet?.toString() || "",
        corner_plot: property.corner_plot || false,
        electricity_available: property.electricity_available !== false,
        water_source: property.water_source || "",
        boundary_wall: property.boundary_wall || false,
      });
    } else if (!property && open) {
      form.reset({
        title: "",
        description: "",
        property_type: "",
        status: "available",
        category: "for_sale",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        country: "India",
        price: "",
        bedrooms: "",
        bathrooms: "",
        square_feet: "",
        year_built: "",
        area_cents: "",
        area_acres: "",
        dtcp_approved: false,
        facing: "",
        plot_dimensions: "",
        road_width_feet: "",
        corner_plot: false,
        electricity_available: true,
        water_source: "",
        boundary_wall: false,
      });
    }
  }, [property, open, form]);

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    try {
      // Helper to safely parse numbers
      const parseNumber = (val: string | undefined) => {
        if (!val || val === '') return null;
        const num = parseFloat(val);
        return isNaN(num) ? null : num;
      };

      const parseInt = (val: string | undefined) => {
        if (!val || val === '') return null;
        const num = Number.parseInt(val);
        return isNaN(num) ? null : num;
      };

      const data: any = {
        title: values.title,
        description: values.description || null,
        property_type: values.property_type,
        status: values.status,
        category: values.category,
        address: values.address,
        city: values.city,
        state: values.state || null,
        zip_code: values.zip_code || null,
        country: values.country,
        price: parseNumber(values.price),
        bedrooms: parseInt(values.bedrooms),
        bathrooms: parseInt(values.bathrooms),
        square_feet: parseNumber(values.square_feet),
        year_built: parseInt(values.year_built),
        area_cents: parseNumber(values.area_cents),
        area_acres: parseNumber(values.area_acres),
        dtcp_approved: values.dtcp_approved || false,
        facing: values.facing || null,
        plot_dimensions: values.plot_dimensions || null,
        road_width_feet: parseNumber(values.road_width_feet),
        corner_plot: values.corner_plot || false,
        electricity_available: values.electricity_available !== false,
        water_source: values.water_source || null,
        boundary_wall: values.boundary_wall || false,
        user_id: user.id,
      };

      if (!data.price) {
        toast.error("Price is required");
        setLoading(false);
        return;
      }

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
      form.reset();
    } catch (error) {
      console.error("Property submission error:", error);
      toast.error("Error submitting property");
      setLoading(false);
    }
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="property_type" render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="land">Land</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="for_sale">For Sale</SelectItem>
                      <SelectItem value="for_rent">For Rent</SelectItem>
                      <SelectItem value="for_lease">For Lease</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="under_offer">Under Offer</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="off_market">Off Market</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹) *</FormLabel>
                  <FormControl><NumberInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="area_cents" render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (Cents)</FormLabel>
                  <FormControl><NumberInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="area_acres" render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (Acres)</FormLabel>
                  <FormControl><NumberInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="square_feet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Feet</FormLabel>
                  <FormControl><NumberInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="plot_dimensions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plot Dimensions</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g., 40x60 ft" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="facing" render={({ field }) => (
                <FormItem>
                  <FormLabel>Facing</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select facing" /></SelectTrigger></FormControl>
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
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="road_width_feet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Road Width (Feet)</FormLabel>
                  <FormControl><NumberInput {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="water_source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Water Source</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g., Borewell, Corporation" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="state" render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="zip_code" render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bedrooms" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="bathrooms" render={({ field }) => (
                <FormItem>
                  <FormLabel>Bathrooms</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="year_built" render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Built</FormLabel>
                  <FormControl><Input {...field} type="number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Additional Features</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <FormField control={form.control} name="dtcp_approved" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">DTCP Approved</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="corner_plot" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Corner Plot</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="electricity_available" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Electricity Available</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="boundary_wall" render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Boundary Wall</FormLabel>
                  </FormItem>
                )} />
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}

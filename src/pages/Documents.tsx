import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FolderPlus, FileText, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export default function Documents() {
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [fileData, setFileData] = useState({
    file: null as File | null,
    notes: "",
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("id, title")
        .eq("user_id", user.id)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["property_documents", selectedProperty],
    queryFn: async () => {
      if (!selectedProperty) return [];
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", selectedProperty)
        .order("folder_name")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProperty,
  });

  const folders = [...new Set(documents.map(doc => doc.folder_name))];
  const filteredDocs = selectedFolder
    ? documents.filter(doc => doc.folder_name === selectedFolder)
    : documents;

  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedProperty) throw new Error("No user or property selected");
      
      // Create a placeholder document to create folder
      const { error } = await supabase.from("property_documents").insert({
        user_id: user.id,
        property_id: selectedProperty,
        folder_name: folderName,
        file_name: ".folder_placeholder",
        file_url: "",
        file_size: 0,
        file_type: "folder",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property_documents"] });
      toast.success("Folder created");
      setFolderDialogOpen(false);
      setNewFolderName("");
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (data: { file: File; notes: string; folderName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedProperty) throw new Error("No user or property selected");

      // Check file size (2MB limit)
      if (data.file.size > 2 * 1024 * 1024) {
        throw new Error("File size must be less than 2MB");
      }

      // Upload file to storage with public access
      const fileName = `${Date.now()}_${data.file.name}`;
      const filePath = `${user.id}/${selectedProperty}/${data.folderName}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, data.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase.from("property_documents").insert({
        user_id: user.id,
        property_id: selectedProperty,
        folder_name: data.folderName,
        file_name: data.file.name,
        file_url: publicUrl,
        file_size: data.file.size,
        file_type: data.file.type,
        notes: data.notes,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property_documents"] });
      toast.success("File uploaded");
      setFileDialogOpen(false);
      setFileData({ file: null, notes: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload file");
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (doc: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete from storage if not placeholder
      if (doc.file_type !== "folder" && doc.file_url) {
        const filePath = `${user.id}/${selectedProperty}/${doc.folder_name}/${doc.file_name.split('_').slice(1).join('_')}`;
        const urlPath = doc.file_url.split('/').slice(-4).join('/');
        try {
          await supabase.storage.from("property-images").remove([urlPath]);
        } catch (err) {
          console.error("Storage delete error:", err);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from("property_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property_documents"] });
      toast.success("Document deleted");
    },
  });

  const handleFileUpload = () => {
    if (!fileData.file || !selectedFolder) {
      toast.error("Please select a file and folder");
      return;
    }
    uploadFileMutation.mutate({
      file: fileData.file,
      notes: fileData.notes,
      folderName: selectedFolder,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground mt-2">
            Organize and manage property documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setFolderDialogOpen(true)}
            disabled={!selectedProperty}
            variant="outline"
            size="sm"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button
            onClick={() => setFileDialogOpen(true)}
            disabled={!selectedProperty || folders.length === 0}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Property</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProperty} onValueChange={setSelectedProperty}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a property" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop: any) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProperty && folders.length > 0 && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedFolder ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedFolder("")}
            >
              All Files
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder}
                variant={selectedFolder === folder ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(folder)}
              >
                {folder}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDocs.filter(doc => doc.file_type !== "folder").map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div 
                      className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/5 transition-colors"
                      onClick={() => window.open(doc.file_url, "_blank")}
                    >
                      <FileText className="h-16 w-16 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate" title={doc.file_name}>
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(2)} KB
                      </p>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2" title={doc.notes}>
                          {doc.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => deleteDocumentMutation.mutate(doc)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedProperty && folders.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No folders yet. Create one to start uploading documents.</p>
            <Button onClick={() => setFolderDialogOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder Name</Label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Legal Documents"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createFolderMutation.mutate(newFolderName)}
                disabled={!newFolderName}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Folder</Label>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder} value={folder}>
                      {folder}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File (Max 2MB)</Label>
              <Input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFileData({ ...fileData, file });
                }}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={fileData.notes}
                onChange={(e) => setFileData({ ...fileData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFileDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileUpload} disabled={uploadFileMutation.isPending}>
                {uploadFileMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

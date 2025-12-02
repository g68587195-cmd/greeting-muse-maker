import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Trash2, Eye, Upload } from "lucide-react";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/documents/DocumentViewer";

interface SiteDocumentsTabProps {
  projectId: string;
}

export function SiteDocumentsTab({ projectId }: SiteDocumentsTabProps) {
  const queryClient = useQueryClient();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    document_name: "",
    document_type: "",
    notes: "",
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["site_documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("upload_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: typeof uploadData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !data.file) throw new Error("Missing data");

      if (data.file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      const fileName = `${Date.now()}_${data.file.name}`;
      const filePath = `${user.id}/${projectId}/documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(filePath, data.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("property-images")
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("site_documents").insert({
        project_id: projectId,
        document_name: data.document_name,
        document_type: data.document_type,
        document_url: publicUrl,
        file_size: data.file.size,
        notes: data.notes,
        uploaded_by: user.id,
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_documents", projectId] });
      toast.success("Document uploaded");
      setUploadDialogOpen(false);
      setUploadData({ file: null, document_name: "", document_type: "", notes: "" });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${projectId}/documents/${doc.document_url.split('/').pop()}`;
      await supabase.storage.from("property-images").remove([filePath]);

      const { error } = await supabase
        .from("site_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site_documents", projectId] });
      toast.success("Document deleted");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Site Documents</h2>
        <Button onClick={() => setUploadDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documents.map((doc) => {
          const isPDF = doc.document_url?.includes(".pdf");
          return (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div
                    className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center cursor-pointer group"
                    onClick={() => setViewingDocument(doc)}
                  >
                    <FileText className={`h-16 w-16 ${isPDF ? "text-red-500" : "text-primary"} group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium truncate" title={doc.document_name}>
                      {doc.document_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.document_type}
                    </p>
                    {doc.file_size && (
                      <p className="text-xs text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setViewingDocument(doc)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => deleteMutation.mutate(doc)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
            <Button onClick={() => setUploadDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Site Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Document Name *</Label>
              <Input
                value={uploadData.document_name}
                onChange={(e) => setUploadData({ ...uploadData, document_name: e.target.value })}
                placeholder="e.g., Building Permit"
              />
            </div>
            <div>
              <Label>Document Type *</Label>
              <Input
                value={uploadData.document_type}
                onChange={(e) => setUploadData({ ...uploadData, document_type: e.target.value })}
                placeholder="e.g., Permit, Blueprint, Contract"
              />
            </div>
            <div>
              <Label>File (Max 5MB) *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setUploadData({ ...uploadData, file });
                }}
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => uploadMutation.mutate(uploadData)}
                disabled={!uploadData.file || !uploadData.document_name || !uploadData.document_type || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentViewer
        open={!!viewingDocument}
        onOpenChange={(open) => !open && setViewingDocument(null)}
        document={viewingDocument ? {
          file_name: viewingDocument.document_name,
          file_url: viewingDocument.document_url,
          file_type: viewingDocument.document_url?.includes(".pdf") ? "application/pdf" : "image/jpeg",
          notes: viewingDocument.notes,
        } : null}
      />
    </div>
  );
}

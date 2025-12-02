import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    file_name: string;
    file_url: string;
    file_type: string;
    notes?: string;
  } | null;
}

export function DocumentViewer({ open, onOpenChange, document }: DocumentViewerProps) {
  if (!document) return null;

  const isPDF = document.file_type === "application/pdf";
  const isImage = document.file_type?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{document.file_name}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(document.file_url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const link = window.document.createElement("a");
                  link.href = document.file_url;
                  link.download = document.file_name;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
          {isPDF ? (
            <iframe
              src={document.file_url}
              className="w-full h-full rounded border"
              title={document.file_name}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={document.file_url}
                alt={document.file_name}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={() => window.open(document.file_url, "_blank")}>
                Open in New Tab
              </Button>
            </div>
          )}
        </div>

        {document.notes && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Notes:</p>
            <p className="text-sm text-muted-foreground">{document.notes}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

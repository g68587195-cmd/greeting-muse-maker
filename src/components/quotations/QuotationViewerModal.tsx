import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface QuotationViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  companyInfo?: any;
}

export function QuotationViewerModal({
  open,
  onOpenChange,
  quotation,
  companyInfo
}: QuotationViewerModalProps) {
  if (!quotation) return null;

  const items = quotation.quotation_items || [];
  const subtotal = quotation.subtotal || 0;

  const handleDownloadPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin + 5;

      // Helper function to format numbers without prefix
      const formatCurrency = (value: number) => {
        return formatIndianNumber(value).replace(/^1/, '');
      };

      // Load and add company logo if available (RIGHT SIDE with margin)
      if (companyInfo?.company_logo_url) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = companyInfo.company_logo_url;
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          doc.addImage(img, 'PNG', pageWidth - margin - 35, margin + 5, 30, 12);
        } catch (e) {
          console.log('Logo load failed', e);
        }
      }

      // Company Details (LEFT SIDE with margin)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(companyInfo?.company_name || "Company Name", margin, yPos);
      
      yPos += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const addressLines = companyInfo?.company_address ? 
        doc.splitTextToSize(companyInfo.company_address, 80) : [];
      addressLines.forEach((line: string) => {
        doc.text(line, margin, yPos);
        yPos += 4;
      });
      
      if (companyInfo?.company_phone) {
        doc.text(`Phone: ${companyInfo.company_phone}`, margin, yPos);
        yPos += 4;
      }
      if (companyInfo?.company_email) {
        doc.text(`Email: ${companyInfo.company_email}`, margin, yPos);
        yPos += 4;
      }
      if (companyInfo?.company_gstin) {
        doc.text(`GSTIN: ${companyInfo.company_gstin}`, margin, yPos);
        yPos += 4;
      }

      // Quotation Title
      yPos = Math.max(yPos, margin + 30);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      const titleY = yPos;
      doc.text("QUOTATION", pageWidth / 2, titleY, { align: "center" });

      // Border around title
      doc.setLineWidth(0.5);
      doc.rect(margin, titleY - 6, pageWidth - 2*margin, 10);

      // Bill To & Date Section
      yPos = titleY + 12;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", margin + 2, yPos);
      
      // Date & Quotation Number (RIGHT SIDE)
      doc.setFontSize(8);
      doc.text("Date:", pageWidth - margin - 45, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(format(new Date(quotation.quotation_date), "dd/MM/yyyy"), pageWidth - margin - 25, yPos);
      
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.text("Quotation#:", pageWidth - margin - 45, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(quotation.quotation_number, pageWidth - margin - 25, yPos);
      
      // Client Details
      yPos -= 5;
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(quotation.clients?.full_name || "N/A", margin + 2, yPos + 5);
      
      if (quotation.clients?.email) {
        doc.setFontSize(8);
        doc.text(quotation.clients.email, margin + 2, yPos + 10);
      }
      if (quotation.clients?.phone) {
        doc.text(quotation.clients.phone, margin + 2, yPos + 14);
      }

      // Items Table Header
      yPos += 25;
      doc.setLineWidth(0.3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      
      const colX = [margin, margin + 12, margin + 82, margin + 102, margin + 127, margin + 147];
      const colWidths = [12, 70, 20, 25, 20, pageWidth - margin - 147];
      const headerY = yPos;
      
      // Draw header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, headerY - 4, pageWidth - 2*margin, 7, 'FD');
      
      // Header text
      doc.text("Sr.", colX[0] + 1, headerY);
      doc.text("Description", colX[1] + 1, headerY);
      doc.text("Qty", colX[2] + 1, headerY);
      doc.text("Rate", colX[3] + 1, headerY);
      doc.text("Tax%", colX[4] + 1, headerY);
      doc.text("Amount", colX[5] + 1, headerY);
      
      // Draw vertical lines for header
      colX.forEach((x, i) => {
        if (i < colX.length - 1) {
          doc.line(x + colWidths[i], headerY - 4, x + colWidths[i], headerY + 3);
        }
      });

      yPos += 3;
      doc.setFont("helvetica", "normal");

      // Items Rows
      items.forEach((item: any, index: number) => {
        const rowY = yPos;
        const rowHeight = 6;
        
        // Draw row border
        doc.setLineWidth(0.2);
        doc.rect(margin, rowY, pageWidth - 2*margin, rowHeight);
        
        // Row data
        doc.text(String(index + 1), colX[0] + 1, rowY + 4);
        
        const descText = doc.splitTextToSize(item.item_description, colWidths[1] - 3);
        doc.text(descText[0], colX[1] + 1, rowY + 4);
        
        doc.text(String(item.quantity), colX[2] + 1, rowY + 4);
        doc.text(formatCurrency(Number(item.rate)), colX[3] + 1, rowY + 4);
        doc.text("18%", colX[4] + 1, rowY + 4);
        doc.text(formatCurrency(Number(item.amount)), colX[5] + 1, rowY + 4);
        
        // Vertical lines
        colX.forEach((x, i) => {
          if (i < colX.length - 1) {
            doc.line(x + colWidths[i], rowY, x + colWidths[i], rowY + rowHeight);
          }
        });
        
        yPos += rowHeight;
      });

      // Totals Section
      yPos += 8;
      const totalsX = pageWidth - margin - 50;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      doc.text("Subtotal:", totalsX - 20, yPos);
      doc.text("₹" + formatCurrency(Number(subtotal)), totalsX + 15, yPos, { align: "right" });
      
      if (quotation.sgst_amount > 0) {
        yPos += 5;
        doc.text(`SGST (${quotation.sgst_rate}%):`, totalsX - 20, yPos);
        doc.text("₹" + formatCurrency(Number(quotation.sgst_amount)), totalsX + 15, yPos, { align: "right" });
      }
      
      if (quotation.cgst_amount > 0) {
        yPos += 5;
        doc.text(`CGST (${quotation.cgst_rate}%):`, totalsX - 20, yPos);
        doc.text("₹" + formatCurrency(Number(quotation.cgst_amount)), totalsX + 15, yPos, { align: "right" });
      }
      
      yPos += 6;
      doc.setLineWidth(0.5);
      doc.line(totalsX - 25, yPos - 2, pageWidth - margin, yPos - 2);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total:", totalsX - 20, yPos + 2);
      doc.text("₹" + formatCurrency(Number(quotation.total_amount)), totalsX + 15, yPos + 2, { align: "right" });

      // Terms & Conditions
      if (quotation.terms_and_conditions) {
        yPos += 12;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions:", margin, yPos);
        yPos += 5;
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        const terms = doc.splitTextToSize(quotation.terms_and_conditions, pageWidth - 2*margin);
        doc.text(terms, margin, yPos);
        yPos += terms.length * 3.5;
      }

      // Footer - Signature with proper spacing from bottom
      const footerY = pageHeight - 35;
      
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text("Thank you for your business!", margin, footerY);
      
      // Get signature preference from profile settings (default to showing)
      const showSignature = companyInfo?.show_quotation_signature !== false;
      
      if (showSignature) {
        // Signature section on right with proper margin
        doc.setFont("helvetica", "normal");
        doc.text("For " + (companyInfo?.company_name || "Company"), pageWidth - margin - 45, footerY + 5);
        doc.text("Authorized Signatory", pageWidth - margin - 45, footerY + 15);
        doc.line(pageWidth - margin - 45, footerY + 17, pageWidth - margin - 5, footerY + 17);
      }

      doc.save(`Quotation-${quotation.quotation_number}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quotation Preview</DialogTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-white p-8 rounded-lg border-2 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-gray-300">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-primary">
                {companyInfo?.company_name || "Your Company"}
              </h1>
              <div className="text-xs text-gray-600 space-y-1">
                {companyInfo?.company_address && <p>{companyInfo.company_address}</p>}
                {companyInfo?.company_phone && <p>Phone: {companyInfo.company_phone}</p>}
                {companyInfo?.company_email && <p>Email: {companyInfo.company_email}</p>}
                {companyInfo?.company_gstin && <p>GSTIN: {companyInfo.company_gstin}</p>}
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-2">
              {companyInfo?.company_logo_url && (
                <img src={companyInfo.company_logo_url} alt="Logo" className="h-12 object-contain mr-2" />
              )}
              <h2 className="text-3xl font-bold text-gray-800">QUOTATION</h2>
              <p className="text-sm text-gray-600 mt-1">#{quotation.quotation_number}</p>
              <p className="text-xs text-gray-500 mt-2">
                Date: {format(new Date(quotation.quotation_date), "dd MMM yyyy")}
              </p>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
              <p className="font-medium text-gray-900">{quotation.clients?.full_name || "N/A"}</p>
              {quotation.clients?.email && (
                <p className="text-sm text-gray-600">{quotation.clients.email}</p>
              )}
              {quotation.clients?.phone && (
                <p className="text-sm text-gray-600">{quotation.clients.phone}</p>
              )}
            </div>
            {quotation.valid_until && (
              <div className="text-right">
                <p className="text-sm">
                  <span className="text-gray-600">Valid Until:</span>{" "}
                  <span className="font-medium">{format(new Date(quotation.valid_until), "dd MMM yyyy")}</span>
                </p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full border-2 border-gray-300">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-r border-gray-300 w-12">Sr.</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 border-r border-gray-300">Tax %</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-3 px-4 border-r border-gray-200 font-medium">{index + 1}</td>
                    <td className="py-3 px-4 border-r border-gray-200">
                      <p className="font-medium text-gray-900">{item.item_description}</p>
                    </td>
                    <td className="text-right py-3 px-4 text-gray-700 border-r border-gray-200">{item.quantity}</td>
                    <td className="text-right py-3 px-4 text-gray-700 border-r border-gray-200">₹{formatIndianNumber(item.rate)}</td>
                    <td className="text-right py-3 px-4 text-gray-700 border-r border-gray-200">{item.tax_rate || 0}%</td>
                    <td className="text-right py-3 px-4 font-medium text-gray-900">
                      ₹{formatIndianNumber(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 border-t-2 border-gray-300 pt-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">₹{formatIndianNumber(subtotal)}</span>
              </div>
              
              {quotation.cgst_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>CGST ({quotation.cgst_rate}%):</span>
                  <span className="font-medium">₹{formatIndianNumber(quotation.cgst_amount)}</span>
                </div>
              )}
              
              {quotation.sgst_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>SGST ({quotation.sgst_rate}%):</span>
                  <span className="font-medium">₹{formatIndianNumber(quotation.sgst_amount)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900 text-lg">Total:</span>
                <span className="font-bold text-xl text-primary">
                  ₹{formatIndianNumber(quotation.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quotation.terms_and_conditions && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms_and_conditions}</p>
            </div>
          )}

          {/* Notes */}
          {quotation.notes && (
            <div className="pt-2">
              <h3 className="font-semibold text-gray-700 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {/* Footer - with spacing */}
          <div className="flex justify-between items-end pt-8 mt-8 border-t">
            <div className="text-sm text-gray-600">
              <p>Thank you for your business!</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-4">Authorized Signature</p>
              <div className="w-40 border-t-2 border-gray-400 pt-2">
                <p className="text-xs text-gray-500">Date: _____________</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

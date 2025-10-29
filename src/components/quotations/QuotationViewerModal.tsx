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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPos = margin;

      // Company Logo (left side with margin)
      if (companyInfo?.company_logo_url) {
        doc.setFontSize(8);
        doc.text("[Logo]", margin, yPos);
        yPos += 8;
      }

      // Company Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(companyInfo?.company_name || "Company Name", margin, yPos);
      
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      if (companyInfo?.company_address) {
        doc.text(companyInfo.company_address, margin, yPos);
        yPos += 5;
      }
      if (companyInfo?.company_phone) {
        doc.text(`Phone: ${companyInfo.company_phone}`, margin, yPos);
        yPos += 5;
      }
      if (companyInfo?.company_email) {
        doc.text(`Email: ${companyInfo.company_email}`, margin, yPos);
        yPos += 5;
      }
      if (companyInfo?.company_gstin) {
        doc.text(`GSTIN: ${companyInfo.company_gstin}`, margin, yPos);
        yPos += 5;
      }

      // Quotation Title
      yPos += 10;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("QUOTATION", pageWidth / 2, yPos, { align: "center" });

      // Client Info & Date
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", margin, yPos);
      
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.text(quotation.clients?.full_name || "N/A", margin, yPos);
      
      // Date on right side
      doc.text("Date: " + format(new Date(quotation.quotation_date), "dd/MM/yyyy"), pageWidth - margin - 40, yPos - 5, { align: "right" });
      doc.text("Quotation#: " + quotation.quotation_number, pageWidth - margin - 40, yPos, { align: "right" });
      
      if (quotation.clients?.email) {
        yPos += 5;
        doc.text(quotation.clients.email, margin, yPos);
      }
      if (quotation.clients?.phone) {
        yPos += 5;
        doc.text(quotation.clients.phone, margin, yPos);
      }

      // Items Table
      yPos += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      
      // Table header with proper borders
      const colWidths = [10, 70, 25, 25, 20, 30];
      let xPos = margin;
      
      doc.rect(margin, yPos - 5, pageWidth - 2*margin, 7); // Header box
      doc.text("Sr.", xPos + 2, yPos);
      xPos += colWidths[0];
      doc.text("Description", xPos + 2, yPos);
      xPos += colWidths[1];
      doc.text("Qty", xPos + 2, yPos);
      xPos += colWidths[2];
      doc.text("Rate", xPos + 2, yPos);
      xPos += colWidths[3];
      doc.text("Tax%", xPos + 2, yPos);
      xPos += colWidths[4];
      doc.text("Amount", xPos + 2, yPos);

      yPos += 7;
      doc.setFont("helvetica", "normal");

      items.forEach((item: any, index: number) => {
        xPos = margin;
        doc.rect(margin, yPos - 5, pageWidth - 2*margin, 7); // Row box
        
        doc.text(String(index + 1), xPos + 2, yPos);
        xPos += colWidths[0];
        doc.text(item.item_description.substring(0, 35), xPos + 2, yPos);
        xPos += colWidths[1];
        doc.text(String(item.quantity), xPos + 2, yPos);
        xPos += colWidths[2];
        doc.text(formatIndianNumber(item.rate), xPos + 2, yPos);
        xPos += colWidths[3];
        doc.text(String(item.tax_rate || 0), xPos + 2, yPos);
        xPos += colWidths[4];
        doc.text(formatIndianNumber(item.amount), xPos + 2, yPos);
        
        yPos += 7;
      });

      // Totals section
      yPos += 5;
      const totalsX = pageWidth - margin - 60;
      
      doc.text("Subtotal:", totalsX, yPos);
      doc.text("₹" + formatIndianNumber(subtotal), totalsX + 30, yPos, { align: "right" });
      
      if (quotation.sgst_amount > 0) {
        yPos += 5;
        doc.text(`SGST (${quotation.sgst_rate}%):`, totalsX, yPos);
        doc.text("₹" + formatIndianNumber(quotation.sgst_amount), totalsX + 30, yPos, { align: "right" });
      }
      
      if (quotation.cgst_amount > 0) {
        yPos += 5;
        doc.text(`CGST (${quotation.cgst_rate}%):`, totalsX, yPos);
        doc.text("₹" + formatIndianNumber(quotation.cgst_amount), totalsX + 30, yPos, { align: "right" });
      }
      
      yPos += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Total:", totalsX, yPos);
      doc.text("₹" + formatIndianNumber(quotation.total_amount), totalsX + 30, yPos, { align: "right" });

      // Terms & Conditions
      if (quotation.terms_and_conditions) {
        yPos += 15;
        doc.setFontSize(10);
        doc.text("Terms & Conditions:", margin, yPos);
        yPos += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const terms = doc.splitTextToSize(quotation.terms_and_conditions, pageWidth - 2*margin);
        doc.text(terms, margin, yPos);
        yPos += terms.length * 4;
      }

      // Footer - Signature with spacing from bottom
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerY = pageHeight - 40; // 40 units from bottom
      
      doc.setFontSize(8);
      doc.text("Thank you for your business!", margin, footerY);
      
      // Signature section
      doc.text("Authorized Signature", pageWidth - margin - 50, footerY + 10);
      doc.line(pageWidth - margin - 50, footerY + 15, pageWidth - margin, footerY + 15);
      doc.text("Date: __________", pageWidth - margin - 50, footerY + 20);

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
              {companyInfo?.company_logo_url && (
                <img src={companyInfo.company_logo_url} alt="Company Logo" className="h-16 mb-2 ml-4" />
              )}
              <h1 className="text-2xl font-bold text-primary ml-4">
                {companyInfo?.company_name || "Your Company"}
              </h1>
              <div className="text-xs text-gray-600 ml-4 space-y-1">
                {companyInfo?.company_address && <p>{companyInfo.company_address}</p>}
                {companyInfo?.company_phone && <p>Phone: {companyInfo.company_phone}</p>}
                {companyInfo?.company_email && <p>Email: {companyInfo.company_email}</p>}
                {companyInfo?.company_gstin && <p>GSTIN: {companyInfo.company_gstin}</p>}
              </div>
            </div>
            <div className="text-right">
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

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface QuotationViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  companyInfo?: any;
  isInvoiceMode?: boolean;
}

export function QuotationViewerModal({ open, onOpenChange, quotation, companyInfo, isInvoiceMode = false }: QuotationViewerModalProps) {
  const [fullQuotation, setFullQuotation] = useState<any>(null);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  useEffect(() => {
    if (quotation && open) {
      fetchFullQuotation();
    }
  }, [quotation, open]);

  const fetchFullQuotation = async () => {
    const { data, error } = await supabase
      .from("quotations")
      .select(`
        *,
        clients(full_name, email, phone, address),
        quotation_items(*)
      `)
      .eq("id", quotation.id)
      .single();

    if (!error && data) {
      setFullQuotation(data);
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_name, company_address, company_email, company_phone")
        .eq("id", data.user_id)
        .single();
      
      setCompanyDetails(profile);
    }
  };

  if (!fullQuotation) return null;

  const items = fullQuotation.quotation_items || [];
  const documentTitle = isInvoiceMode ? "INVOICE" : "QUOTATION";

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = 20;

    // Company name (left, red)
    pdf.setFontSize(16);
    pdf.setTextColor(220, 53, 69);
    pdf.setFont("helvetica", "bold");
    pdf.text(companyDetails?.company_name || "Your Company", margin, yPos);

    // Document title (right, red)
    pdf.setFontSize(20);
    const titleWidth = pdf.getTextWidth(documentTitle);
    pdf.text(documentTitle, pageWidth - titleWidth - margin, yPos);

    yPos += 8;

    // Company details (small, left)
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    
    if (companyDetails?.company_address) {
      const lines = pdf.splitTextToSize(companyDetails.company_address, 90);
      lines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 4;
      });
    }
    if (companyDetails?.company_email) {
      pdf.text(`Email: ${companyDetails.company_email}`, margin, yPos);
      yPos += 4;
    }
    if (companyDetails?.company_phone) {
      pdf.text(`Phone: ${companyDetails.company_phone}`, margin, yPos);
    }

    // Document details (right)
    let rightY = 28;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("Number:", pageWidth - 70, rightY);
    pdf.setFont("helvetica", "normal");
    pdf.text(fullQuotation.quotation_number, pageWidth - 45, rightY);
    rightY += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text("Date:", pageWidth - 70, rightY);
    pdf.setFont("helvetica", "normal");
    pdf.text(format(new Date(fullQuotation.quotation_date), "dd/MM/yyyy"), pageWidth - 45, rightY);

    yPos = Math.max(yPos + 10, rightY + 10);

    // Bill To
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To:", margin, yPos);
    yPos += 6;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(fullQuotation.clients?.full_name || "N/A", margin, yPos);
    yPos += 5;
    if (fullQuotation.clients?.email) {
      pdf.text(fullQuotation.clients.email, margin, yPos);
      yPos += 5;
    }
    if (fullQuotation.clients?.phone) {
      pdf.text(fullQuotation.clients.phone, margin, yPos);
      yPos += 5;
    }
    if (fullQuotation.clients?.address) {
      const addrLines = pdf.splitTextToSize(fullQuotation.clients.address, 80);
      addrLines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 5;

    // Table
    const tableTop = yPos;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    // Header
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, 8, "F");
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, 8, "S");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", margin + 2, tableTop + 5.5);
    pdf.text("Qty", pageWidth - 115, tableTop + 5.5);
    pdf.text("Unit Price", pageWidth - 95, tableTop + 5.5);
    pdf.text("Subtotal", pageWidth - 70, tableTop + 5.5);
    pdf.text("Total&GST", pageWidth - 40, tableTop + 5.5);
    pdf.text("SGST", pageWidth - 25, tableTop + 5.5);

    yPos = tableTop + 8;

    // Items
    pdf.setFont("helvetica", "normal");
    items.forEach((item: any) => {
      const cgst = item.amount * (fullQuotation.cgst_rate / 100);
      const sgst = item.amount * (fullQuotation.sgst_rate / 100);
      const total = item.amount + cgst + sgst;

      pdf.rect(margin, yPos, pageWidth - 2 * margin, 7, "S");
      
      const desc = pdf.splitTextToSize(item.item_description || "", 65);
      pdf.text(desc[0], margin + 2, yPos + 4.5);
      pdf.text(String(item.quantity || 0), pageWidth - 115, yPos + 4.5);
      pdf.text(`₹${formatIndianNumber(item.rate || 0)}`, pageWidth - 95, yPos + 4.5);
      pdf.text(`₹${formatIndianNumber(item.amount || 0)}`, pageWidth - 70, yPos + 4.5);
      
      pdf.setFontSize(8);
      pdf.text(`₹${formatIndianNumber(cgst)}`, pageWidth - 40, yPos + 3);
      pdf.text(`(${fullQuotation.cgst_rate}%)`, pageWidth - 40, yPos + 5.5);
      
      pdf.text(`₹${formatIndianNumber(sgst)}`, pageWidth - 25, yPos + 3);
      pdf.text(`(${fullQuotation.sgst_rate}%)`, pageWidth - 25, yPos + 5.5);

      yPos += 7;
    });

    yPos += 5;

    // Totals
    const totX = pageWidth - 70;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", totX, yPos);
    pdf.text(`₹${formatIndianNumber(fullQuotation.subtotal || 0)}`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 6;

    pdf.text("Tax:", totX, yPos);
    pdf.text(`₹${formatIndianNumber((fullQuotation.cgst_amount || 0) + (fullQuotation.sgst_amount || 0))}`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 6;

    pdf.text("Discount:", totX, yPos);
    pdf.text("₹0", pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 2;

    pdf.setDrawColor(220, 53, 69);
    pdf.setLineWidth(1);
    pdf.line(totX - 5, yPos, pageWidth - margin, yPos);
    yPos += 6;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Total:", totX, yPos);
    pdf.setTextColor(220, 53, 69);
    pdf.text(`₹${formatIndianNumber(fullQuotation.total_amount || 0)}`, pageWidth - margin - 5, yPos, { align: "right" });
    pdf.setTextColor(0, 0, 0);

    yPos += 15;

    // Footer
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "italic");
    pdf.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
    pdf.text(`For inquiries, contact us at ${companyDetails?.company_email || "contact@company.com"}`, pageWidth / 2, yPos, { align: "center" });

    pdf.save(`${fullQuotation.quotation_number}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">{documentTitle} Details</DialogTitle>
        <div className="bg-white space-y-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-primary">{companyDetails?.company_name || "Your Company"}</h2>
              <div className="mt-2 text-sm space-y-0.5 text-muted-foreground">
                {companyDetails?.company_address && <p>{companyDetails.company_address}</p>}
                {companyDetails?.company_email && <p>Email: {companyDetails.company_email}</p>}
                {companyDetails?.company_phone && <p>Phone: {companyDetails.company_phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-primary">{documentTitle}</h1>
              <div className="mt-2 text-sm space-y-0.5">
                <p><span className="font-semibold">Number:</span> {fullQuotation.quotation_number}</p>
                <p><span className="font-semibold">Date:</span> {format(new Date(fullQuotation.quotation_date), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="font-bold mb-2">Bill To:</h3>
            <div className="text-sm space-y-0.5">
              <p className="font-semibold">{fullQuotation.clients?.full_name || "N/A"}</p>
              {fullQuotation.clients?.email && <p>{fullQuotation.clients.email}</p>}
              {fullQuotation.clients?.phone && <p>{fullQuotation.clients.phone}</p>}
              {fullQuotation.clients?.address && <p>{fullQuotation.clients.address}</p>}
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-center p-3 w-16 font-semibold">Qty</th>
                  <th className="text-right p-3 w-24 font-semibold">Unit Price</th>
                  <th className="text-right p-3 w-28 font-semibold">Subtotal</th>
                  <th className="text-right p-3 w-20 font-semibold">Total&GST</th>
                  <th className="text-right p-3 w-20 font-semibold">SGST</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const cgst = item.amount * (fullQuotation.cgst_rate / 100);
                  const sgst = item.amount * (fullQuotation.sgst_rate / 100);
                  const total = item.amount + cgst + sgst;
                  
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{item.item_description}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">₹{formatIndianNumber(item.rate)}</td>
                      <td className="text-right p-3">₹{formatIndianNumber(item.amount)}</td>
                      <td className="text-right p-3">
                        ₹{formatIndianNumber(cgst)}<br />
                        <span className="text-xs text-muted-foreground">({fullQuotation.cgst_rate}%)</span>
                      </td>
                      <td className="text-right p-3">
                        ₹{formatIndianNumber(sgst)}<br />
                        <span className="text-xs text-muted-foreground">({fullQuotation.sgst_rate}%)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>₹{formatIndianNumber(fullQuotation.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Tax:</span>
                <span>₹{formatIndianNumber((fullQuotation.cgst_amount || 0) + (fullQuotation.sgst_amount || 0))}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Discount:</span>
                <span>₹0</span>
              </div>
              <div className="border-t-2 border-primary pt-2 flex justify-between font-bold text-base">
                <span>Total:</span>
                <span className="text-primary">₹{formatIndianNumber(fullQuotation.total_amount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p className="italic">Thank you for your business!</p>
            <p className="mt-1">For inquiries, contact us at {companyDetails?.company_email || "contact@company.com"}</p>
          </div>

          {/* Download Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
      
      // Fetch company details
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

    // Company name (left side, red color)
    pdf.setFontSize(18);
    pdf.setTextColor(220, 53, 69);
    pdf.setFont("helvetica", "bold");
    pdf.text(companyDetails?.company_name || "Your Company", margin, yPos);

    // INVOICE/QUOTATION heading (right side, red color)
    pdf.setFontSize(22);
    pdf.setTextColor(220, 53, 69);
    const docTitleWidth = pdf.getTextWidth(documentTitle);
    pdf.text(documentTitle, pageWidth - docTitleWidth - margin, yPos);

    yPos += 8;

    // Company details (small text, left side)
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    
    if (companyDetails?.company_address) {
      const addressLines = pdf.splitTextToSize(companyDetails.company_address, 100);
      addressLines.forEach((line: string) => {
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
      yPos += 4;
    }

    // Reset yPos for right side
    let rightYPos = 28;
    
    // Document number (right side)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Number:`, pageWidth - 70, rightYPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(fullQuotation.quotation_number, pageWidth - 45, rightYPos);
    rightYPos += 5;

    pdf.setFont("helvetica", "bold");
    pdf.text(`Date:`, pageWidth - 70, rightYPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(format(new Date(fullQuotation.quotation_date), "dd/MM/yyyy"), pageWidth - 45, rightYPos);

    yPos += 5;

    // Bill To section
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
      const addressLines = pdf.splitTextToSize(fullQuotation.clients.address, 90);
      addressLines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
    }

    yPos += 5;

    // Table header
    const tableTop = yPos;
    const col1 = margin;
    const col2 = margin + 80;
    const col3 = margin + 100;
    const col4 = margin + 125;
    const col5 = margin + 150;
    const col6 = margin + 165;

    // Draw table border
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    // Header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, 8, "F");
    pdf.rect(margin, tableTop, pageWidth - 2 * margin, 8, "S");

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Description", col1 + 2, tableTop + 5);
    pdf.text("Qty", col2 + 2, tableTop + 5);
    pdf.text("Unit Price", col3 + 2, tableTop + 5);
    pdf.text("Subtotal", col4 + 2, tableTop + 5);
    pdf.text("CGST", col5 + 2, tableTop + 5);
    pdf.text("SGST", col6 + 2, tableTop + 5);
    pdf.text("Total", pageWidth - margin - 25, tableTop + 5, { align: "right" });

    yPos = tableTop + 8;

    // Items
    pdf.setFont("helvetica", "normal");
    items.forEach((item: any) => {
      const cgst = (item.amount * (fullQuotation.cgst_rate / 100));
      const sgst = (item.amount * (fullQuotation.sgst_rate / 100));
      const total = item.amount + cgst + sgst;

      // Draw row border
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "S");

      pdf.text(item.item_description || "", col1 + 2, yPos + 5);
      pdf.text(String(item.quantity || 0), col2 + 2, yPos + 5);
      pdf.text(`₹${formatIndianNumber(item.rate || 0)}`, col3 + 2, yPos + 5);
      pdf.text(`₹${formatIndianNumber(item.amount || 0)}`, col4 + 2, yPos + 5);
      
      pdf.setFontSize(8);
      pdf.text(`₹${formatIndianNumber(cgst)}`, col5 + 2, yPos + 3);
      pdf.text(`(${fullQuotation.cgst_rate}%)`, col5 + 2, yPos + 6);
      
      pdf.text(`₹${formatIndianNumber(sgst)}`, col6 + 2, yPos + 3);
      pdf.text(`(${fullQuotation.sgst_rate}%)`, col6 + 2, yPos + 6);
      
      pdf.setFontSize(9);
      pdf.setTextColor(220, 53, 69);
      pdf.setFont("helvetica", "bold");
      pdf.text(`₹${formatIndianNumber(total)}`, pageWidth - margin - 5, yPos + 5, { align: "right" });
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      yPos += 8;
    });

    // Totals section (right aligned)
    yPos += 5;
    const totalsX = pageWidth - 70;

    pdf.setFont("helvetica", "normal");
    pdf.text("Subtotal:", totalsX, yPos);
    pdf.text(`₹${formatIndianNumber(fullQuotation.subtotal || 0)}`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 6;

    pdf.text("Tax:", totalsX, yPos);
    pdf.text(`₹${formatIndianNumber((fullQuotation.cgst_amount || 0) + (fullQuotation.sgst_amount || 0))}`, pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 6;

    pdf.text("Discount:", totalsX, yPos);
    pdf.text("₹0", pageWidth - margin - 5, yPos, { align: "right" });
    yPos += 2;

    // Total line
    pdf.setDrawColor(220, 53, 69);
    pdf.setLineWidth(1);
    pdf.line(totalsX - 5, yPos, pageWidth - margin, yPos);
    yPos += 6;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Total:", totalsX, yPos);
    pdf.setTextColor(220, 53, 69);
    pdf.text(`₹${formatIndianNumber(fullQuotation.total_amount || 0)}`, pageWidth - margin - 5, yPos, { align: "right" });
    pdf.setTextColor(0, 0, 0);

    yPos += 15;

    // Footer
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "italic");
    pdf.text("Thank you for your business!", pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
    
    const contactEmail = companyDetails?.company_email || "contact@company.com";
    pdf.text(`For inquiries, contact us at ${contactEmail}`, pageWidth / 2, yPos, { align: "center" });

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
              <h2 className="text-2xl font-bold text-red-600">{companyDetails?.company_name || "Your Company"}</h2>
              <div className="mt-2 text-sm space-y-1 text-muted-foreground">
                {companyDetails?.company_address && <p>{companyDetails.company_address}</p>}
                {companyDetails?.company_email && <p>Email: {companyDetails.company_email}</p>}
                {companyDetails?.company_phone && <p>Phone: {companyDetails.company_phone}</p>}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold text-red-600">{documentTitle}</h1>
              <div className="mt-2 text-sm space-y-1">
                <p><span className="font-semibold">Number:</span> {fullQuotation.quotation_number}</p>
                <p><span className="font-semibold">Date:</span> {format(new Date(fullQuotation.quotation_date), "dd/MM/yyyy")}</p>
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="font-bold text-lg mb-2">Bill To:</h3>
            <div className="text-sm space-y-1">
              <p className="font-semibold">{fullQuotation.clients?.full_name || "N/A"}</p>
              {fullQuotation.clients?.email && <p>{fullQuotation.clients.email}</p>}
              {fullQuotation.clients?.phone && <p>{fullQuotation.clients.phone}</p>}
              {fullQuotation.clients?.address && <p>{fullQuotation.clients.address}</p>}
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 border-r">Description</th>
                  <th className="text-center p-3 border-r w-16">Qty</th>
                  <th className="text-right p-3 border-r w-24">Unit Price</th>
                  <th className="text-right p-3 border-r w-28">Subtotal</th>
                  <th className="text-right p-3 border-r w-20">CGST</th>
                  <th className="text-right p-3 border-r w-20">SGST</th>
                  <th className="text-right p-3 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => {
                  const cgst = (item.amount * (fullQuotation.cgst_rate / 100));
                  const sgst = (item.amount * (fullQuotation.sgst_rate / 100));
                  const total = item.amount + cgst + sgst;
                  
                  return (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 border-r">{item.item_description}</td>
                      <td className="text-center p-3 border-r">{item.quantity}</td>
                      <td className="text-right p-3 border-r">₹{formatIndianNumber(item.rate)}</td>
                      <td className="text-right p-3 border-r">₹{formatIndianNumber(item.amount)}</td>
                      <td className="text-right p-3 border-r">
                        ₹{formatIndianNumber(cgst)}<br />
                        <span className="text-xs text-muted-foreground">({fullQuotation.cgst_rate}%)</span>
                      </td>
                      <td className="text-right p-3 border-r">
                        ₹{formatIndianNumber(sgst)}<br />
                        <span className="text-xs text-muted-foreground">({fullQuotation.sgst_rate}%)</span>
                      </td>
                      <td className="text-right p-3 font-bold text-red-600">₹{formatIndianNumber(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 text-sm">
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
              <div className="border-t-2 border-red-600 pt-2 flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-red-600">₹{formatIndianNumber(fullQuotation.total_amount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            <p className="italic">Thank you for your business!</p>
            <p>For inquiries, contact us at {companyDetails?.company_email || "contact@company.com"}</p>
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

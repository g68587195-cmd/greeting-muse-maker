import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { formatIndianNumber } from "@/lib/formatIndianNumber";
import { format } from "date-fns";

interface QuotationViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: any;
  companyInfo?: { name: string; logo?: string };
}

export function QuotationViewerModal({
  open,
  onOpenChange,
  quotation,
  companyInfo
}: QuotationViewerModalProps) {
  if (!quotation) return null;

  const items = quotation.items || [];
  const subtotal = items.reduce((sum: number, item: any) => 
    sum + (item.quantity * item.unit_price), 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Quotation Preview</DialogTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="bg-white p-8 rounded-lg border space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-primary">
            <div>
              {companyInfo?.logo && (
                <img src={companyInfo.logo} alt="Company Logo" className="h-16 mb-2" />
              )}
              <h1 className="text-2xl font-bold text-primary">
                {companyInfo?.name || "Your Company"}
              </h1>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800">QUOTATION</h2>
              <p className="text-sm text-gray-600 mt-1">#{quotation.quotation_number}</p>
            </div>
          </div>

          {/* Details */}
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
            <div className="text-right">
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="text-gray-600">Date:</span>{" "}
                  <span className="font-medium">{format(new Date(quotation.quotation_date), "dd MMM yyyy")}</span>
                </p>
                {quotation.valid_until && (
                  <p className="text-sm">
                    <span className="text-gray-600">Valid Until:</span>{" "}
                    <span className="font-medium">{format(new Date(quotation.valid_until), "dd MMM yyyy")}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Rate</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Tax %</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any, index: number) => {
                  const itemTotal = item.quantity * item.unit_price;
                  return (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{item.description}</p>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-700">{item.quantity}</td>
                      <td className="text-right py-3 px-4 text-gray-700">₹{formatIndianNumber(item.unit_price)}</td>
                      <td className="text-right py-3 px-4 text-gray-700">{item.tax_rate || 0}%</td>
                      <td className="text-right py-3 px-4 font-medium text-gray-900">
                        ₹{formatIndianNumber(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">₹{formatIndianNumber(subtotal)}</span>
              </div>
              
              {quotation.cgst_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>CGST:</span>
                  <span className="font-medium">₹{formatIndianNumber(quotation.cgst_amount)}</span>
                </div>
              )}
              
              {quotation.sgst_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>SGST:</span>
                  <span className="font-medium">₹{formatIndianNumber(quotation.sgst_amount)}</span>
                </div>
              )}
              
              {quotation.discount_amount > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Discount:</span>
                  <span className="font-medium text-red-600">-₹{formatIndianNumber(quotation.discount_amount)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-gray-900">Total:</span>
                <span className="font-bold text-xl text-primary">
                  ₹{formatIndianNumber(quotation.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quotation.terms && (
            <div className="pt-4 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.terms}</p>
            </div>
          )}

          {/* Notes */}
          {quotation.notes && (
            <div className="pt-2">
              <h3 className="font-semibold text-gray-700 mb-2">Notes:</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{quotation.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-end pt-8 border-t">
            <div className="text-sm text-gray-600">
              <p>Thank you for your business!</p>
            </div>
            {companyInfo?.logo && (
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">Authorized Signature</p>
                <div className="w-40 h-20 border-t border-gray-300"></div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

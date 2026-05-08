import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Trash2, Minus, Plus as PlusIcon, FileText, Download, Printer, Package, User, Phone, MapPin, Mail, Receipt, CheckCircle, Loader2 } from "lucide-react";
import { useAdmin } from "../../context/AdminContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { pdf } from "@react-pdf/renderer";
import InvoicePDFDocument from "../InvoicePDF";

interface InvoiceItem {
  id: string;
  name: string;
  code: string;
  image: string;
  quantity: number;
  unitPrice: number;
}

export default function AdminInvoiceGenerator() {
  const navigate = useNavigate();
  const { products, storeProfile, addManualInvoice } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.isAvailable &&
        (p.name.toLowerCase().includes(q) ||
          (p.product_code && p.product_code.toLowerCase().includes(q)))
    );
  }, [products, searchQuery]);

  const addItem = useCallback((product: typeof products[0]) => {
    setInvoiceItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          code: product.product_code || "",
          image: product.image || "",
          quantity: 1,
          unitPrice: product.price,
        },
      ];
    });
    setSearchQuery("");
  }, []);

  const updateQuantity = useCallback((id: string, qty: number) => {
    if (qty < 1) qty = 1;
    setInvoiceItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setInvoiceItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const subtotal = useMemo(
    () => invoiceItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
    [invoiceItems]
  );
  const grandTotal = subtotal - discount;

  const clearForm = useCallback(() => {
    setInvoiceItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerAddress("");
    setDiscount(0);
    setNotes("");
    setGeneratedInvoice(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (invoiceItems.length === 0) {
      toast.error("Add at least one product to the invoice");
      return;
    }
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }

    setIsGenerating(true);
    try {
      const invoice = await addManualInvoice({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        address: customerAddress.trim(),
        products: invoiceItems.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.unitPrice * i.quantity,
          image: i.image,
          code: i.code,
        })),
        discount,
        tax: 0,
        notes: notes.trim(),
      });
      setGeneratedInvoice(invoice);
      toast.success(`Invoice ${invoice.invoiceNumber} generated!`);
    } catch (err) {
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  }, [invoiceItems, customerName, customerPhone, customerEmail, customerAddress, discount, notes, addManualInvoice]);

  const handleDownloadPDF = useCallback(async () => {
    if (!generatedInvoice) return;
    try {
      const blob = await pdf(
        <InvoicePDFDocument
          invoice={generatedInvoice}
          order={null}
          storeProfile={{
            storeName: storeProfile.storeName,
            storeNameAccent: storeProfile.storeNameAccent,
            addressStreet: storeProfile.addressStreet,
            addressCity: storeProfile.addressCity,
            phone: storeProfile.phone,
            email: storeProfile.email,
          }}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${generatedInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  }, [generatedInvoice, storeProfile]);

  const handlePrint = useCallback(() => {
    if (!generatedInvoice) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print");
      return;
    }
    printWindow.document.write(`
      <html><head><title>${generatedInvoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .header p { color: #666; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f5f5f5; }
        .totals { text-align: right; margin-top: 20px; }
        .totals p { margin: 4px 0; }
        .footer { text-align: center; margin-top: 40px; color: #888; font-size: 12px; }
      </style></head><body>
      <div class="header">
        <h1>${storeProfile.storeName} ${storeProfile.storeNameAccent}</h1>
        <p>${storeProfile.addressStreet}, ${storeProfile.addressCity}</p>
        <p>${storeProfile.phone} | ${storeProfile.email}</p>
        <h2>Invoice: ${generatedInvoice.invoiceNumber}</h2>
      </div>
      <p><strong>Customer:</strong> ${generatedInvoice.customerName}</p>
      <p><strong>Phone:</strong> ${generatedInvoice.customerPhone}</p>
      ${generatedInvoice.customerEmail ? `<p><strong>Email:</strong> ${generatedInvoice.customerEmail}</p>` : ""}
      ${generatedInvoice.address ? `<p><strong>Address:</strong> ${generatedInvoice.address}</p>` : ""}
      <table>
        <thead><tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
        <tbody>
          ${generatedInvoice.products.map((p: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.code || "-"}</td>
              <td>${p.quantity}</td>
              <td>Rs. ${p.unitPrice.toLocaleString()}</td>
              <td>Rs. ${p.total.toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="totals">
        <p><strong>Subtotal:</strong> Rs. ${generatedInvoice.subtotal.toLocaleString()}</p>
        ${generatedInvoice.discount > 0 ? `<p><strong>Discount:</strong> -Rs. ${generatedInvoice.discount.toLocaleString()}</p>` : ""}
        <p style="font-size:18px"><strong>Grand Total:</strong> Rs. ${generatedInvoice.grandTotal.toLocaleString()}</p>
      </div>
      <p><strong>Date:</strong> ${new Date(generatedInvoice.createdAt).toLocaleString()}</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ""}
      <div class="footer"><p>Thank you for your business!</p></div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [generatedInvoice, storeProfile, notes]);

  if (generatedInvoice) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 md:p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Invoice Generated!</h2>
          <p className="text-muted-foreground mb-1">{generatedInvoice.invoiceNumber}</p>
          <p className="text-muted-foreground mb-6">for {generatedInvoice.customerName}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
            <Button onClick={handleDownloadPDF} className="bg-foreground hover:bg-[#D4AF37] hover:text-black text-background">
              <Download className="w-4 h-4 mr-2" /> Download PDF
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" /> Print Invoice
            </Button>
            <Button variant="outline" onClick={() => navigate(`/invoice/${generatedInvoice.id}`)}>
              <FileText className="w-4 h-4 mr-2" /> View Invoice
            </Button>
          </div>
          <Button variant="ghost" onClick={clearForm}>
            <Plus className="w-4 h-4 mr-2" /> Create New Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
          <Receipt className="w-6 h-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Invoice Generator</h1>
          <p className="text-sm text-muted-foreground">Create manual invoices for customers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Search Products</h3>
                <p className="text-xs text-muted-foreground">Find products by name or code</p>
              </div>
            </div>
            <Input
              placeholder="Search product name or product code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.trim() && (
              <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                ) : (
                  filteredProducts.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.product_code && <span className="font-mono">{product.product_code} — </span>}
                          Rs. {product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addItem(product)}
                      >
                        <PlusIcon className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Invoice Items</h3>
                <p className="text-xs text-muted-foreground">{invoiceItems.length > 0 ? `${invoiceItems.length} item(s) added` : "No items added yet"}</p>
              </div>
            </div>
            {invoiceItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Search and add products to build your invoice</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold">Product</th>
                      <th className="text-left py-2 px-2 font-semibold">Code</th>
                      <th className="text-center py-2 px-2 font-semibold w-36">Quantity</th>
                      <th className="text-right py-2 px-2 font-semibold">Unit Price</th>
                      <th className="text-right py-2 px-2 font-semibold">Total</th>
                      <th className="py-2 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-8 h-8 object-cover rounded" />
                            <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground font-mono text-xs">{item.code || "-"}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-16 text-center border border-border rounded bg-background py-1 text-sm"
                              min="1"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <PlusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right">Rs. {item.unitPrice.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-semibold">Rs. {(item.unitPrice * item.quantity).toLocaleString()}</td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Customer Details</h3>
                <p className="text-xs text-muted-foreground">Enter customer information</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Email (optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email address"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Address (optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="pl-9 min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="font-semibold">Summary</h3>
                <p className="text-xs text-muted-foreground">Invoice totals</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Discount (Rs.)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                />
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-semibold">-Rs. {discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Grand Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  className="min-h-[60px]"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || invoiceItems.length === 0}
                className="w-full bg-foreground hover:bg-[#D4AF37] hover:text-black text-background"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-2" /> Generate Invoice</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

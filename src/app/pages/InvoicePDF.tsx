import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", fontWeight: 700 },
    { src: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZg.ttf", fontWeight: 800 },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
  },
  header: {
    backgroundColor: "#1a1a1a",
    padding: "24px 32px 18px 32px",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  headerLightning: {
    fontSize: 20,
    color: "#D4AF37",
  },
  headerStoreName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 800,
  },
  headerStoreAccent: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: 800,
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 8,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  headerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  headerContactIcon: {
    color: "#D4AF37",
    fontSize: 7,
    width: 14,
  },
  headerContactText: {
    color: "#aaaaaa",
    fontSize: 7.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerInvoiceLabel: {
    color: "#D4AF37",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 2,
    marginBottom: 2,
  },
  headerInvoiceNumber: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 2,
  },
  headerDate: {
    color: "#9ca3af",
    fontSize: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgePaid: {
    backgroundColor: "#22c55e",
  },
  badgePending: {
    backgroundColor: "#f97316",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: 700,
  },
  goldLine: {
    height: 3,
    backgroundColor: "#D4AF37",
  },
  content: {
    padding: "20px 32px",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 22,
  },
  card: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    color: "#D4AF37",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "center",
  },
  cardLabel: {
    color: "#6b7280",
    fontSize: 8,
    width: 55,
  },
  cardValue: {
    color: "#1a1a1a",
    fontSize: 8,
    fontWeight: 700,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 4,
  },
  statusDelivered: { backgroundColor: "#dcfce7" },
  statusProcessing: { backgroundColor: "#dbeafe" },
  statusPending: { backgroundColor: "#fef3c7" },
  statusDeliveredText: { color: "#166534", fontSize: 7, fontWeight: 700 },
  statusProcessingText: { color: "#1e40af", fontSize: 7, fontWeight: 700 },
  statusPendingText: { color: "#b45309", fontSize: 7, fontWeight: 700 },
  customerName: {
    color: "#1a1a1a",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  customerText: {
    color: "#6b7280",
    fontSize: 8,
    marginBottom: 1.5,
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.8,
  },
  tableHeaderProduct: {
    flex: 2,
  },
  tableHeaderCenter: {
    flex: 0.5,
    textAlign: "center",
  },
  tableHeaderRight: {
    flex: 1,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
    minHeight: 36,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCellProduct: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  productName: {
    color: "#1a1a1a",
    fontSize: 8,
    fontWeight: 500,
    flex: 1,
  },
  tableCellCenter: {
    flex: 0.5,
    textAlign: "center",
  },
  tableCellRight: {
    flex: 1,
    textAlign: "right",
  },
  colorBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "center",
  },
  colorText: {
    color: "#374151",
    fontSize: 7,
    fontWeight: 500,
  },
  sizeText: {
    fontSize: 7,
    color: "#3b82f6",
    fontWeight: 600,
  },
  qtyText: {
    color: "#1a1a1a",
    fontSize: 8,
    fontWeight: 500,
    textAlign: "center",
  },
  priceText: {
    color: "#6b7280",
    fontSize: 8,
    textAlign: "right",
  },
  totalText: {
    color: "#1a1a1a",
    fontSize: 8,
    fontWeight: 700,
    textAlign: "right",
  },
  totalsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignSelf: "flex-end",
    width: "45%",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  totalsLabel: {
    color: "#6b7280",
    fontSize: 8,
  },
  totalsValue: {
    color: "#1a1a1a",
    fontSize: 8,
    fontWeight: 600,
  },
  totalsDiscount: {
    color: "#16a34a",
    fontSize: 8,
    fontWeight: 600,
  },
  divider: {
    height: 2,
    backgroundColor: "#D4AF37",
    marginVertical: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#D4AF37",
    padding: "10px 14px",
    borderRadius: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    color: "#1a1a1a",
    fontSize: 10,
    fontWeight: 700,
  },
  grandTotalValue: {
    color: "#1a1a1a",
    fontSize: 13,
    fontWeight: 800,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: "18px 32px",
    alignItems: "center",
  },
  footerText: {
    color: "#1a1a1a",
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 4,
  },
  footerSubtext: {
    color: "#6b7280",
    fontSize: 8,
    marginBottom: 2,
  },
  footerDate: {
    color: "#9ca3af",
    fontSize: 7,
  },
});

interface InvoiceProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selected_color?: string;
  selected_size?: string;
  image?: string;
}

interface InvoicePDFProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    address: string;
    products: InvoiceProduct[];
    subtotal: number;
    discount: number;
    tax: number;
    deliveryCost: number;
    grandTotal: number;
    paymentStatus: "Paid" | "Pending";
    date: string;
  };
  order: {
    status: "Pending" | "Processing" | "Delivered";
    paymentStatus: "Pending" | "Paid";
  } | null;
  storeProfile: {
    storeName: string;
    storeNameAccent: string;
    addressStreet: string;
    addressCity: string;
    phone: string;
    email: string;
  };
}

const formatPrice = (price: number) => {
  return `Rs. ${(price || 0).toLocaleString()}`;
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

export default function InvoicePDFDocument({ invoice, order, storeProfile }: InvoicePDFProps) {
  const paymentStatus = order?.paymentStatus || invoice.paymentStatus;
  const hasColor = invoice.products.some(
    (p) => p.selected_color || p.selected_size
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerBrand}>
                <Text style={styles.headerLightning}>⚡</Text>
                <Text style={styles.headerStoreName}>
                  {storeProfile.storeName}{" "}
                  <Text style={styles.headerStoreAccent}>
                    {storeProfile.storeNameAccent}
                  </Text>
                </Text>
              </View>
              <Text style={styles.headerSubtitle}>Premium Lighting & Bathware</Text>
              <View style={styles.headerContactRow}>
                <Text style={styles.headerContactIcon}>📍</Text>
                <Text style={styles.headerContactText}>
                  {storeProfile.addressStreet}, {storeProfile.addressCity}
                </Text>
              </View>
              <View style={styles.headerContactRow}>
                <Text style={styles.headerContactIcon}>📞</Text>
                <Text style={styles.headerContactText}>{storeProfile.phone}</Text>
              </View>
              <View style={styles.headerContactRow}>
                <Text style={styles.headerContactIcon}>✉</Text>
                <Text style={styles.headerContactText}>{storeProfile.email}</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerInvoiceLabel}>INVOICE</Text>
              <Text style={styles.headerInvoiceNumber}>
                {invoice.invoiceNumber}
              </Text>
              <Text style={styles.headerDate}>{formatDate(invoice.date)}</Text>
              <View
                style={[
                  styles.badge,
                  paymentStatus === "Paid"
                    ? styles.badgePaid
                    : styles.badgePending,
                ]}
              >
                <Text style={styles.badgeText}>
                  {paymentStatus === "Paid" ? "✓ Paid" : "⏳ Pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gold accent line */}
        <View style={styles.goldLine} />

        {/* Content */}
        <View style={styles.content}>
          {/* Info Cards */}
          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>ORDER INFORMATION</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Date:</Text>
                <Text style={styles.cardValue}>
                  {formatDate(invoice.date).split(",")[0]}
                </Text>
              </View>
              {invoice.orderId && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Order ID:</Text>
                  <Text style={styles.cardValue}>
                    #{invoice.orderId.slice(-8)}
                  </Text>
                </View>
              )}
              {order && (
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      order.status === "Delivered"
                        ? styles.statusDelivered
                        : order.status === "Processing"
                        ? styles.statusProcessing
                        : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        order.status === "Delivered"
                          ? styles.statusDeliveredText
                          : order.status === "Processing"
                          ? styles.statusProcessingText
                          : styles.statusPendingText,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>CUSTOMER DETAILS</Text>
              <Text style={styles.customerName}>{invoice.customerName}</Text>
              <Text style={styles.customerText}>{invoice.customerPhone}</Text>
              {invoice.customerEmail && (
                <Text style={styles.customerText}>{invoice.customerEmail}</Text>
              )}
              <Text style={styles.customerText}>{invoice.address}</Text>
            </View>
          </View>

          {/* Products Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderProduct]}>
                PRODUCT
              </Text>
              {hasColor && (
                <Text style={[styles.tableHeaderCell, styles.tableHeaderCenter]}>
                  DETAILS
                </Text>
              )}
              <Text style={[styles.tableHeaderCell, styles.tableHeaderCenter]}>
                QTY
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderRight]}>
                UNIT PRICE
              </Text>
              <Text style={[styles.tableHeaderCell, styles.tableHeaderRight]}>
                TOTAL
              </Text>
            </View>

            {invoice.products.map((product, index) => {
              const isAlt = index % 2 === 1;
              return (
                <View key={product.id || index} style={isAlt ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                  <View style={styles.tableCellProduct}>
                    {product.image ? (
                      <View style={styles.productImage}>
                        <Text style={{ fontSize: 6, textAlign: "center", color: "#9ca3af", lineHeight: "24px" }}>img</Text>
                      </View>
                    ) : null}
                    <Text style={styles.productName}>{product.name}</Text>
                  </View>
                  {hasColor && (
                    <View style={styles.tableCellCenter}>
                      <View style={{ flexDirection: "column", alignItems: "center", gap: 2 }}>
                        {product.selected_color ? (
                          <View style={styles.colorBadge}>
                            <Text style={styles.colorText}>{product.selected_color}</Text>
                          </View>
                        ) : null}
                        {product.selected_size ? (
                          <Text style={styles.sizeText}>Size: {product.selected_size}</Text>
                        ) : null}
                        {!product.selected_color && !product.selected_size ? (
                          <Text style={{ color: "#9ca3af", fontSize: 7 }}>-</Text>
                        ) : null}
                      </View>
                    </View>
                  )}
                  <View style={styles.tableCellCenter}>
                    <Text style={styles.qtyText}>{product.quantity}</Text>
                  </View>
                  <View style={styles.tableCellRight}>
                    <Text style={styles.priceText}>
                      {formatPrice(product.unitPrice)}
                    </Text>
                  </View>
                  <View style={styles.tableCellRight}>
                    <Text style={styles.totalText}>
                      {formatPrice(product.total)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Totals */}
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>
                {formatPrice(invoice.subtotal)}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Delivery</Text>
              <Text style={styles.totalsValue}>
                {(invoice.deliveryCost || 0) > 0 ? formatPrice(invoice.deliveryCost) : "Free Delivery"}
              </Text>
            </View>
            {(invoice.discount || 0) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={{ color: "#16a34a", fontSize: 8 }}>Discount</Text>
                <Text style={styles.totalsDiscount}>
                  -{formatPrice(invoice.discount)}
                </Text>
              </View>
            )}
            {(invoice.tax || 0) > 0 && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
                <Text style={styles.totalsValue}>
                  {formatPrice(invoice.tax)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatPrice(invoice.grandTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Thank you for choosing {storeProfile.storeName} {storeProfile.storeNameAccent}
          </Text>
          <Text style={styles.footerSubtext}>
            {storeProfile.addressCity}, Sri Lanka | {storeProfile.phone} |{" "}
            {storeProfile.email}
          </Text>
          <Text style={styles.footerDate}>
            Generated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

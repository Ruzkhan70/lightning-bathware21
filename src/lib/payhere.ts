export interface PayhereConfig {
  merchantId: string;
  merchantSecret: string;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
  sandbox: boolean;
}

export interface PayhereOrder {
  orderId: string;
  items: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
}

declare global {
  interface Window {
    payhere?: {
      startPayment: (payment: PayherePayment) => void;
      onCompleted: (callback: (orderId: string) => void) => void;
      onClosed: () => void;
    };
  }
}

interface PayherePayment {
  sandbox: boolean;
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  amount: number;
  currency: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_country?: string;
}

const defaultConfig: PayhereConfig = {
  merchantId: import.meta.env.VITE_PAYHERE_MERCHANT_ID || "",
  merchantSecret: import.meta.env.VITE_PAYHERE_MERCHANT_SECRET || "",
  notifyUrl: `${window.location.origin}/api/payhere/notify`,
  returnUrl: `${window.location.origin}/#/checkout/success`,
  cancelUrl: `${window.location.origin}/#/checkout`,
  sandbox: import.meta.env.VITE_PAYHERE_SANDBOX === "true",
};

export function loadPayhereScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.payhere) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = defaultConfig.sandbox
      ? "https://sandbox.payhere.lk/lib/payhere.js"
      : "https://www.payhere.lk/lib/payhere.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Payhere script"));
    document.head.appendChild(script);
  });
}

export function initiatePayherePayment(order: PayhereOrder): void {
  if (!window.payhere) {
    throw new Error("Payhere not loaded");
  }

  const nameParts = order.customerName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const payment: PayherePayment = {
    sandbox: defaultConfig.sandbox,
    merchant_id: defaultConfig.merchantId,
    return_url: defaultConfig.returnUrl,
    cancel_url: defaultConfig.cancelUrl,
    notify_url: defaultConfig.notifyUrl,
    order_id: order.orderId,
    items: order.items,
    amount: order.amount,
    currency: order.currency,
    first_name: firstName,
    last_name: lastName,
    email: order.customerEmail,
    phone: order.customerPhone,
    address: order.address,
    city: order.city,
    country: "Sri Lanka",
  };

  window.payhere.startPayment(payment);
}

export function onPayhereCompleted(callback: (orderId: string) => void): void {
  if (window.payhere) {
    window.payhere.onCompleted(callback);
  }
}

export function onPayhereClosed(callback: () => void): void {
  if (window.payhere) {
    window.payhere.onClosed(callback);
  }
}

export function isPayhereConfigured(): boolean {
  return Boolean(defaultConfig.merchantId && defaultConfig.merchantSecret);
}

export default {
  loadPayhereScript,
  initiatePayherePayment,
  onPayhereCompleted,
  onPayhereClosed,
  isPayhereConfigured,
};

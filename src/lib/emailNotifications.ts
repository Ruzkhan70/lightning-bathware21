import emailjs from "@emailjs/browser";

interface OrderNotificationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryOption: string;
  deliveryCost: number;
  paymentMethod: string;
  date: string;
}

export async function sendOrderNotificationToAdmin(orderData: OrderNotificationData): Promise<boolean> {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_ADMIN_ORDER || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceId || !templateId) {
    console.warn("EmailJS not configured, skipping order notification");
    return false;
  }

  const productsList = orderData.products
    .map(p => `• ${p.name} (Qty: ${p.quantity}) - Rs. ${(p.price * p.quantity).toLocaleString()}`)
    .join("\n");

  const templateParams = {
    order_id: orderData.orderId,
    customer_name: orderData.customerName,
    customer_email: orderData.customerEmail,
    customer_phone: orderData.customerPhone,
    delivery_address: orderData.address,
    products: productsList,
    order_total: `Rs. ${orderData.total.toLocaleString()}`,
    delivery_option: orderData.deliveryOption,
    delivery_cost: `Rs. ${orderData.deliveryCost.toLocaleString()}`,
    payment_method: orderData.paymentMethod,
    order_date: orderData.date,
  };

  try {
    await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return true;
  } catch (error) {
    console.error("Failed to send order notification:", error);
    return false;
  }
}

export async function sendOrderConfirmationToCustomer(
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderTotal: number
): Promise<boolean> {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CUSTOMER_ORDER;

  if (!publicKey || !serviceId || !templateId) {
    console.warn("EmailJS not configured for customer confirmation");
    return false;
  }

  try {
    await emailjs.send(serviceId, templateId, {
      customer_email: customerEmail,
      customer_name: customerName,
      order_id: orderId,
      order_total: `Rs. ${orderTotal.toLocaleString()}`,
    }, publicKey);
    return true;
  } catch (error) {
    console.error("Failed to send customer confirmation:", error);
    return false;
  }
}

export async function sendContactNotification(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_CONTACT || import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!publicKey || !serviceId || !templateId) {
    console.warn("EmailJS not configured, skipping contact notification");
    return false;
  }

  try {
    await emailjs.send(serviceId, templateId, {
      from_name: name,
      from_email: email,
      subject: subject || "New Contact Form Message",
      message: message,
    }, publicKey);
    return true;
  } catch (error) {
    console.error("Failed to send contact notification:", error);
    return false;
  }
}

export default {
  sendOrderNotificationToAdmin,
  sendOrderConfirmationToCustomer,
  sendContactNotification,
};

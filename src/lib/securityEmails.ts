import emailjs from "@emailjs/browser";
import { logger } from "./logger";

const RECOVERY_EMAIL = import.meta.env.VITE_RECOVERY_EMAIL || "";

interface EmailConfig {
  publicKey: string;
  serviceId: string;
}

function getConfig(): EmailConfig | null {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  if (!publicKey || !serviceId) return null;
  return { publicKey, serviceId };
}

export async function sendSecurityCodeEmail(code: string, reason: string = "Daily auto-renewal"): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    logger.warn("EmailJS not configured, cannot send security code email");
    return false;
  }

  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_SECURITY_CODE;
  if (!templateId) {
    logger.warn("No security code email template configured");
    return false;
  }

  try {
    await emailjs.send(config.serviceId, templateId, {
      to_email: RECOVERY_EMAIL,
      security_code: code,
      reason: reason,
      timestamp: new Date().toLocaleString(),
    }, config.publicKey);
    return true;
  } catch (error) {
    logger.error("Failed to send security code email:", error);
    return false;
  }
}

export async function sendOTPCodeEmail(otp: string): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    logger.warn("EmailJS not configured, cannot send OTP email");
    return false;
  }

  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_SECURITY_OTP;
  if (!templateId) {
    logger.warn("No OTP email template configured");
    return false;
  }

  try {
    await emailjs.send(config.serviceId, templateId, {
      to_email: RECOVERY_EMAIL,
      otp_code: otp,
      expiry_minutes: "15",
      timestamp: new Date().toLocaleString(),
    }, config.publicKey);
    return true;
  } catch (error) {
    logger.error("Failed to send OTP email:", error);
    return false;
  }
}

export async function sendSecurityAlertEmail(type: string, details: string): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID_SECURITY_ALERT;
  if (!templateId) return false;

  try {
    await emailjs.send(config.serviceId, templateId, {
      to_email: RECOVERY_EMAIL,
      alert_type: type,
      details: details,
      timestamp: new Date().toLocaleString(),
    }, config.publicKey);
    return true;
  } catch (error) {
    logger.error("Failed to send security alert email:", error);
    return false;
  }
}

export default {
  sendSecurityCodeEmail,
  sendOTPCodeEmail,
  sendSecurityAlertEmail,
};

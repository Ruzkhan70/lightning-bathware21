import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDeviceInfo } from "./activityLog";

export interface AdminLoginLog {
  email: string;
  emailMasked: string;
  status: "success" | "failed";
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  failureReason?: string;
}

export const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local.substring(0, 2)}***@${domain}`;
};

export const logAdminLogin = async (
  email: string,
  status: "success" | "failed",
  failureReason?: string
): Promise<void> => {
  try {
    const { device, browser } = getDeviceInfo();
    const maskedEmail = maskEmail(email);
    
    const logEntry: AdminLoginLog = {
      email,
      emailMasked: maskedEmail,
      status,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device,
      browser,
      failureReason,
    };

    await addDoc(collection(db, "adminLogs"), {
      ...logEntry,
      createdAt: serverTimestamp(),
    });

    console.log(`[AdminLoginLog] ${status.toUpperCase()}: ${maskedEmail}${failureReason ? ` - ${failureReason}` : ""}`);
  } catch (error) {
    console.error("[AdminLoginLog] Failed to log admin login attempt:", error);
  }
};

export const logAdminLogout = async (email: string): Promise<void> => {
  try {
    const { device, browser } = getDeviceInfo();
    const maskedEmail = maskEmail(email);
    
    await addDoc(collection(db, "adminLogs"), {
      email,
      emailMasked: maskedEmail,
      status: "success",
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device,
      browser,
      action: "logout",
      createdAt: serverTimestamp(),
    });

    console.log(`[AdminLoginLog] LOGOUT: ${maskedEmail}`);
  } catch (error) {
    console.error("[AdminLoginLog] Failed to log admin logout:", error);
  }
};

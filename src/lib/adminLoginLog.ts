import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getDeviceInfo } from "./activityLog";
import { getIPAddress, getDeviceType } from "./deviceInfo";

export interface AdminLoginLog {
  email: string;
  emailMasked: string;
  status: "success" | "failed";
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
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
    const { device, browser, userAgent } = getDeviceInfo();
    const maskedEmail = maskEmail(email);

    let ipAddress = "unknown";
    try {
      ipAddress = await getIPAddress();
    } catch {
      ipAddress = "unknown";
    }

    const logEntry: AdminLoginLog = {
      email,
      emailMasked: maskedEmail,
      status,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      device,
      browser,
      deviceType: getDeviceType(),
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
    const { device, browser, userAgent } = getDeviceInfo();
    const maskedEmail = maskEmail(email);

    let ipAddress = "unknown";
    try {
      ipAddress = await getIPAddress();
    } catch {
      ipAddress = "unknown";
    }

    await addDoc(collection(db, "adminLogs"), {
      email,
      emailMasked: maskedEmail,
      status: "success",
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      device,
      browser,
      deviceType: getDeviceType(),
      action: "logout",
      createdAt: serverTimestamp(),
    });

    console.log(`[AdminLoginLog] LOGOUT: ${maskedEmail}`);
  } catch (error) {
    console.error("[AdminLoginLog] Failed to log admin logout:", error);
  }
};

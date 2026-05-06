import { db } from "../firebase";
import { logger } from "./logger";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { getIPAddress, getDeviceType, getBrowserName } from "./deviceInfo";
import { sendSecurityAlertEmail } from "./securityEmails";

export interface LoginAttempt {
  id?: string;
  email: string;
  ipAddress: string;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
  status: "FAILED" | "SUCCESS";
  reason: string;
  timestamp: string;
  location?: { country: string; city: string };
}

export interface BlockedIp {
  id?: string;
  ipAddress: string;
  blockedUntil: Timestamp;
  reason: string;
  createdAt?: Timestamp;
}

export interface IpGeoLocation {
  country: string;
  city: string;
}

const LOGIN_ATTEMPTS_COLLECTION = "loginAttempts";
const BLOCKED_IPS_COLLECTION = "blockedIps";
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const EMAIL_ALERT_THRESHOLD = 10;

let cachedGeo: Record<string, IpGeoLocation> = {};

export const getIpGeoLocation = async (ip: string): Promise<IpGeoLocation | null> => {
  if (cachedGeo[ip]) return cachedGeo[ip];
  if (ip === "unknown" || !ip) return null;

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
    const data = await res.json() as { country?: string; city?: string; status?: string };
    if (data.status !== "fail" && data.country) {
      const location = { country: data.country, city: data.city || "Unknown" };
      cachedGeo[ip] = location;
      return location;
    }
  } catch {
    // Geo lookup failed, continue without location
  }
  return null;
};

export const isIpBlocked = async (ip: string): Promise<{ blocked: boolean; blockedUntil?: Date }> => {
  try {
    const q = query(
      collection(db, BLOCKED_IPS_COLLECTION),
      where("ipAddress", "==", ip)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return { blocked: false };

    for (const doc of snapshot.docs) {
      const data = doc.data() as BlockedIp;
      const blockedUntil = data.blockedUntil.toDate();
      if (new Date() < blockedUntil) {
        return { blocked: true, blockedUntil };
      }
      // Expired block, clean up
      // (could delete here but keeping for audit trail)
    }

    return { blocked: false };
  } catch (error) {
    logger.error("[IPSecurity] Error checking blocked IPs:", error);
    return { blocked: false };
  }
};

export const blockIp = async (ip: string, reason: string): Promise<void> => {
  try {
    const now = new Date();
    const blockedUntil = new Date(now.getTime() + BLOCK_DURATION_MS);

    await addDoc(collection(db, BLOCKED_IPS_COLLECTION), {
      ipAddress: ip,
      blockedUntil: Timestamp.fromDate(blockedUntil),
      reason,
      createdAt: Timestamp.fromDate(now),
    });

    logger.log(`[IPSecurity] Blocked IP: ${ip} until ${blockedUntil.toISOString()}`);
  } catch (error) {
    logger.error("[IPSecurity] Error blocking IP:", error);
  }
};

export const recordFailedAttempt = async (
  email: string,
  reason: string
): Promise<{ shouldBlock: boolean }> => {
  try {
    const ip = await getIPAddress();
    const deviceType = getDeviceType();
    const browser = getBrowserName();
    const location = await getIpGeoLocation(ip);

    await addDoc(collection(db, LOGIN_ATTEMPTS_COLLECTION), {
      email,
      ipAddress: ip,
      deviceType,
      browser,
      status: "FAILED",
      reason,
      timestamp: serverTimestamp(),
      location: location ? { country: location.country, city: location.city } : null,
    });

    const failedCount = await getFailedAttemptsFromIp(ip);
    const shouldBlock = failedCount >= RATE_LIMIT_MAX_ATTEMPTS;

    if (shouldBlock) {
      await blockIp(ip, "Too many failed attempts");
    }

    if (failedCount >= EMAIL_ALERT_THRESHOLD) {
      await sendBruteForceAlert(ip, email, failedCount, location);
    }

    return { shouldBlock };
  } catch (error) {
    logger.error("[IPSecurity] Error recording failed attempt:", error);
    return { shouldBlock: false };
  }
};

export const getFailedAttemptsFromIp = async (ip: string): Promise<number> => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const q = query(
      collection(db, LOGIN_ATTEMPTS_COLLECTION),
      where("ipAddress", "==", ip),
      where("status", "==", "FAILED"),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    let count = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const ts = data.timestamp?.toDate?.();
      if (ts && ts >= fiveMinutesAgo) {
        count++;
      } else if (!ts?.toDate) {
        // Firestore serverTimestamp, count it (recent)
        count++;
      }
    }

    return count;
  } catch (error) {
    logger.error("[IPSecurity] Error counting failed attempts:", error);
    return 0;
  }
};

export const sendBruteForceAlert = async (
  ip: string,
  email: string,
  attempts: number,
  location?: IpGeoLocation | null
): Promise<void> => {
  try {
    const locationStr = location
      ? `${location.city}, ${location.country}`
      : "Unknown location";

    await sendSecurityAlertEmail(
      "BRUTE_FORCE_DETECTED",
      `Suspicious login activity detected from IP: ${ip}\n` +
        `Location: ${locationStr}\n` +
        `Failed attempts: ${attempts}\n` +
        `Target email: ${email}\n` +
        `Time: ${new Date().toLocaleString()}`
    );

    logger.log(`[IPSecurity] Brute force alert sent for IP: ${ip}`);
  } catch (error) {
    logger.error("[IPSecurity] Error sending brute force alert:", error);
  }
};

export const captureLoginInfo = async (email: string): Promise<{
  ip: string;
  deviceType: "mobile" | "tablet" | "desktop";
  browser: string;
}> => {
  const ip = await getIPAddress();
  const deviceType = getDeviceType();
  const browser = getBrowserName();

  return { ip, deviceType, browser };
};

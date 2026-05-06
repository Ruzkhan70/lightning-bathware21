import { db } from "../firebase";
import { logger } from "./logger";
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";

const SECURITY_CODE_DOC = doc(db, "system", "securityCode");
const OTP_COLLECTION = collection(db, "codeRotationOtp");
const CODE_EXPIRY_MS = 24 * 60 * 60 * 1000;
const OTP_EXPIRY_MS = 15 * 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_LOCKOUT_MS = 30 * 60 * 1000;
const VERIFY_SESSION_MS = 10 * 60 * 1000;

const VERIFY_SESSION_KEY = "daily_code_verified_until";

function getDeviceId(): string {
  let id = localStorage.getItem("security_device_id");
  if (!id) {
    id = "sec_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("security_device_id", id);
  }
  return id;
}

function getAttemptsDocRef() {
  return doc(db, "securityAttempts", getDeviceId());
}

export interface SecurityCodeState {
  hashedCode: string;
  salt: string;
  createdAt: string;
  expiresAt: string;
  lastRotated: string;
  lastSentAt: string;
}

export async function hashSecurityCode(code: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  const encoder = new TextEncoder();
  const data = encoder.encode(code + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash, salt };
}

export async function verifySecurityCode(input: string, storedHash: string, salt: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === storedHash;
}

export function generateSecurityCode(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const num = parseInt(Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''), 16);
  return num.toString().substring(0, 6).padStart(6, '0');
}

export async function loadSecurityCode(): Promise<SecurityCodeState | null> {
  try {
    const snap = await getDoc(SECURITY_CODE_DOC);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      hashedCode: data.hashedCode,
      salt: data.salt,
      createdAt: data.createdAt,
      expiresAt: data.expiresAt,
      lastRotated: data.lastRotated,
      lastSentAt: data.lastSentAt || data.lastRotated,
    };
  } catch {
    return null;
  }
}

export async function saveSecurityCode(code: string): Promise<void> {
  const { hash, salt } = await hashSecurityCode(code);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MS).toISOString();

  await setDoc(SECURITY_CODE_DOC, {
    hashedCode: hash,
    salt,
    createdAt: now,
    expiresAt,
    lastRotated: now,
    lastSentAt: now,
    updatedAt: serverTimestamp(),
  });
}

export async function checkCodeExpired(): Promise<boolean> {
  const state = await loadSecurityCode();
  if (!state) return true;
  return Date.now() > new Date(state.expiresAt).getTime();
}

export async function getSecurityCodeExpiryInfo(): Promise<{ isExpired: boolean; isExpiringSoon: boolean; expiresAt: string | null; remainingHours: number } | null> {
  const state = await loadSecurityCode();
  if (!state) return null;

  const now = Date.now();
  const expiry = new Date(state.expiresAt).getTime();
  const remainingMs = expiry - now;
  const remainingHours = Math.max(0, remainingMs / (1000 * 60 * 60));

  return {
    isExpired: now > expiry,
    isExpiringSoon: remainingHours < 6 && remainingHours > 0,
    expiresAt: state.expiresAt,
    remainingHours: Math.round(remainingHours * 10) / 10,
  };
}

export async function generateOTP(): Promise<string> {
  const otp = generateSecurityCode();
  const { hash, salt } = await hashSecurityCode(otp);

  await addDoc(OTP_COLLECTION, {
    hashedOtp: hash,
    otpSalt: salt,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    createdAt: serverTimestamp(),
    used: false,
  });

  return otp;
}

export async function verifyAndConsumeOTP(otp: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const q = query(OTP_COLLECTION, where("used", "==", false), where("expiresAt", ">=", now));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const isValid = await verifySecurityCode(otp, data.hashedOtp, data.otpSalt);
      if (isValid) {
        await setDoc(doc(db, "codeRotationOtp", docSnap.id), { used: true, usedAt: serverTimestamp() }, { merge: true });
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

export async function initializeSecurityCode(code: string): Promise<void> {
  await saveSecurityCode(code);
}

// ── Daily Auto-Renew Verification Code ──────────────────────────────

export async function checkAndAutoRenew(): Promise<{ renewed: boolean; code?: string }> {
  const state = await loadSecurityCode();

  if (state) {
    const now = Date.now();
    const expiry = new Date(state.expiresAt).getTime();
    if (now < expiry) {
      return { renewed: false };
    }
  }

  const newCode = generateSecurityCode();

  try {
    const { sendSecurityCodeEmail } = await import("./securityEmails");
    await sendSecurityCodeEmail(newCode, "Daily auto-renewal");
  } catch (error) {
    logger.error("[DailyCode] Failed to send email:", error);
  }

  await saveSecurityCode(newCode);
  await resetVerifyAttempts();

  return { renewed: true, code: newCode };
}

export async function resendDailyCode(): Promise<{ success: boolean }> {
  const newCode = generateSecurityCode();

  try {
    const { sendSecurityCodeEmail } = await import("./securityEmails");
    const sent = await sendSecurityCodeEmail(newCode, "Manual resend");
    if (!sent) return { success: false };
  } catch (error) {
    logger.error("[DailyCode] Failed to send email:", error);
    return { success: false };
  }

  await saveSecurityCode(newCode);
  await resetVerifyAttempts();
  return { success: true };
}

export async function verifyDailyCode(input: string): Promise<{ valid: boolean; error?: string }> {
  const locked = await isVerifyLocked();
  if (locked) {
    return { valid: false, error: "Too many attempts. Please try again in 30 minutes." };
  }

  const state = await loadSecurityCode();
  if (!state) {
    return { valid: false, error: "No verification code found. Please wait for the daily email." };
  }

  if (Date.now() > new Date(state.expiresAt).getTime()) {
    return { valid: false, error: "Code expired. Please check your email for the new code." };
  }

  const isValid = await verifySecurityCode(input, state.hashedCode, state.salt);

  if (!isValid) {
    await recordVerifyAttempt();
    const attempts = await getVerifyAttempts();
    const remaining = MAX_VERIFY_ATTEMPTS - attempts;

    if (remaining <= 0) {
      await lockVerifyAttempts();
      return { valid: false, error: "Too many attempts. Locked for 30 minutes." };
    }

    return { valid: false, error: `Invalid code. ${remaining} attempt(s) remaining.` };
  }

  setVerifySession();
  return { valid: true };
}

export function isVerifySessionValid(): boolean {
  try {
    const until = localStorage.getItem(VERIFY_SESSION_KEY);
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function setVerifySession(): void {
  const until = Date.now() + VERIFY_SESSION_MS;
  localStorage.setItem(VERIFY_SESSION_KEY, until.toString());
}

export function clearVerifySession(): void {
  localStorage.removeItem(VERIFY_SESSION_KEY);
}

async function getVerifyAttempts(): Promise<number> {
  try {
    const snap = await getDoc(getAttemptsDocRef());
    if (!snap.exists()) return 0;
    const data = snap.data();
    if (Date.now() > (data.lockedUntil || 0)) {
      await resetVerifyAttempts();
      return 0;
    }
    return data.count || 0;
  } catch {
    return 0;
  }
}

async function recordVerifyAttempt(): Promise<void> {
  const ref = getAttemptsDocRef();
  const snap = await getDoc(ref);
  const count = (snap.exists() ? snap.data().count : 0) + 1;
  await setDoc(ref, { count, timestamp: Date.now(), deviceId: getDeviceId() }, { merge: true });
}

async function resetVerifyAttempts(): Promise<void> {
  try {
    await deleteDoc(getAttemptsDocRef());
  } catch {
    // Ignore if doesn't exist
  }
}

async function isVerifyLocked(): Promise<boolean> {
  try {
    const snap = await getDoc(getAttemptsDocRef());
    if (!snap.exists()) return false;
    const data = snap.data();
    if (data.lockedUntil && Date.now() > data.lockedUntil) {
      await resetVerifyAttempts();
      return false;
    }
    return !!data.lockedUntil;
  } catch {
    return false;
  }
}

async function lockVerifyAttempts(): Promise<void> {
  const lockedUntil = Date.now() + VERIFY_LOCKOUT_MS;
  await setDoc(getAttemptsDocRef(), { count: MAX_VERIFY_ATTEMPTS, lockedUntil, timestamp: Date.now(), deviceId: getDeviceId() }, { merge: true });
}

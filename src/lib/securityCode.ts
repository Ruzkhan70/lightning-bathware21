import { db } from "../firebase";
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from "firebase/firestore";

const SECURITY_CODE_DOC = doc(db, "system", "securityCode");
const OTP_COLLECTION = collection(db, "system", "codeRotationOtp");
const CODE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_EXPIRY_MS = 15 * 60 * 1000;

export interface SecurityCodeState {
  hashedCode: string;
  salt: string;
  createdAt: string;
  expiresAt: string;
  lastRotated: string;
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
    isExpiringSoon: remainingHours < 24 && remainingHours > 0,
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
        await setDoc(doc(db, "system", "codeRotationOtp", docSnap.id), { used: true, usedAt: serverTimestamp() }, { merge: true });
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

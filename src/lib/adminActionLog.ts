import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ActivityAction, getDeviceInfo } from "./activityLog";

export interface AdminActionLog {
  action: ActivityAction;
  userId: string;
  userEmail: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  status: 'success' | 'failed' | 'warning';
  metadata?: Record<string, unknown>;
}

export const logAdminAction = async (
  action: ActivityAction,
  userId: string,
  userEmail: string,
  details: string,
  status: 'success' | 'failed' | 'warning' = 'success',
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    const { device, browser } = getDeviceInfo();
    
    const logEntry: AdminActionLog = {
      action,
      userId,
      userEmail,
      details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      device,
      browser,
      status,
      metadata,
    };

    await addDoc(collection(db, "activityLogs"), {
      ...logEntry,
      createdAt: serverTimestamp(),
    });

    console.log(`[AdminActionLog] ${action}: ${details} - ${status}`);
  } catch (error) {
    console.error("[AdminActionLog] Failed to log admin action:", error);
  }
};

export const logProductAction = async (
  action: 'PRODUCT_ADD' | 'PRODUCT_EDIT' | 'PRODUCT_DELETE' | 'PRODUCT_BULK_EDIT' | 'PRODUCT_BULK_DELETE',
  userId: string,
  userEmail: string,
  productId: string,
  productName?: string,
  details?: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> => {
  const defaultDetails = details || `${action.replace('PRODUCT_', '').replace('_', ' ')} product ${productId}${productName ? ` (${productName})` : ''}`;
  await logAdminAction(action, userId, userEmail, defaultDetails, status, { productId, productName });
};

export const logOrderAction = async (
  action: 'ORDER_UPDATE' | 'ORDER_DELETE',
  userId: string,
  userEmail: string,
  orderId: string,
  details?: string,
  status: 'success' | 'failed' = 'success',
  metadata?: Record<string, unknown>
): Promise<void> => {
  const defaultDetails = details || `${action.replace('ORDER_', '').replace('_', ' ')} order ${orderId}`;
  await logAdminAction(action, userId, userEmail, defaultDetails, status, { orderId, ...metadata });
};

export const logCategoryAction = async (
  action: 'CATEGORY_ADD' | 'CATEGORY_EDIT' | 'CATEGORY_DELETE',
  userId: string,
  userEmail: string,
  categoryId: string,
  categoryName?: string,
  details?: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> => {
  const defaultDetails = details || `${action.replace('CATEGORY_', '').replace('_', ' ')} category ${categoryId}${categoryName ? ` (${categoryName})` : ''}`;
  await logAdminAction(action, userId, userEmail, defaultDetails, status, { categoryId, categoryName });
};

export const logOfferAction = async (
  action: 'OFFER_ADD' | 'OFFER_EDIT' | 'OFFER_DELETE',
  userId: string,
  userEmail: string,
  offerId: string,
  offerTitle?: string,
  details?: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> => {
  const defaultDetails = details || `${action.replace('OFFER_', '').replace('_', ' ')} offer ${offerId}${offerTitle ? ` (${offerTitle})` : ''}`;
  await logAdminAction(action, userId, userEmail, defaultDetails, status, { offerId, offerTitle });
};

export const logSettingsUpdate = async (
  userId: string,
  userEmail: string,
  settingKey: string,
  details?: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> => {
  const defaultDetails = details || `Updated setting: ${settingKey}`;
  await logAdminAction('SETTINGS_UPDATE', userId, userEmail, defaultDetails, status, { settingKey });
};

export const logPasswordChange = async (
  userId: string,
  userEmail: string,
  status: 'success' | 'failed' = 'success'
): Promise<void> => {
  await logAdminAction('PASSWORD_CHANGE', userId, userEmail, 'Admin password changed', status);
};

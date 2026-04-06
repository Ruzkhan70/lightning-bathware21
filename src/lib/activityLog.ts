export type ActivityAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PRODUCT_ADD'
  | 'PRODUCT_EDIT'
  | 'PRODUCT_DELETE'
  | 'PRODUCT_BULK_EDIT'
  | 'PRODUCT_BULK_DELETE'
  | 'CATEGORY_ADD'
  | 'CATEGORY_EDIT'
  | 'CATEGORY_DELETE'
  | 'OFFER_ADD'
  | 'OFFER_EDIT'
  | 'OFFER_DELETE'
  | 'ORDER_UPDATE'
  | 'ORDER_DELETE'
  | 'INVOICE_UPDATE'
  | 'SETTINGS_UPDATE'
  | 'MESSAGE_DELETE'
  | 'REVIEW_DELETE'
  | 'PASSWORD_CHANGE'
  | 'SUSPICIOUS_ACTIVITY';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: ActivityAction;
  userId: string;
  userEmail: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failed' | 'warning';
  metadata?: Record<string, unknown>;
}

export interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: string;
  lockedUntil?: string;
}

export const ACTION_LABELS: Record<ActivityAction, string> = {
  LOGIN_SUCCESS: 'Successful Login',
  LOGIN_FAILED: 'Failed Login',
  LOGOUT: 'Logout',
  PRODUCT_ADD: 'Added Product',
  PRODUCT_EDIT: 'Edited Product',
  PRODUCT_DELETE: 'Deleted Product',
  PRODUCT_BULK_EDIT: 'Bulk Edited Products',
  PRODUCT_BULK_DELETE: 'Bulk Deleted Products',
  CATEGORY_ADD: 'Added Category',
  CATEGORY_EDIT: 'Edited Category',
  CATEGORY_DELETE: 'Deleted Category',
  OFFER_ADD: 'Added Offer',
  OFFER_EDIT: 'Edited Offer',
  OFFER_DELETE: 'Deleted Offer',
  ORDER_UPDATE: 'Updated Order',
  ORDER_DELETE: 'Deleted Order',
  INVOICE_UPDATE: 'Updated Invoice',
  SETTINGS_UPDATE: 'Updated Settings',
  MESSAGE_DELETE: 'Deleted Message',
  REVIEW_DELETE: 'Deleted Review',
  PASSWORD_CHANGE: 'Changed Password',
  SUSPICIOUS_ACTIVITY: 'Suspicious Activity',
};

export const ACTION_CATEGORIES: Record<ActivityAction, string> = {
  LOGIN_SUCCESS: 'Authentication',
  LOGIN_FAILED: 'Authentication',
  LOGOUT: 'Authentication',
  PRODUCT_ADD: 'Products',
  PRODUCT_EDIT: 'Products',
  PRODUCT_DELETE: 'Products',
  PRODUCT_BULK_EDIT: 'Products',
  PRODUCT_BULK_DELETE: 'Products',
  CATEGORY_ADD: 'Categories',
  CATEGORY_EDIT: 'Categories',
  CATEGORY_DELETE: 'Categories',
  OFFER_ADD: 'Offers',
  OFFER_EDIT: 'Offers',
  OFFER_DELETE: 'Offers',
  ORDER_UPDATE: 'Orders',
  ORDER_DELETE: 'Orders',
  INVOICE_UPDATE: 'Invoices',
  SETTINGS_UPDATE: 'Settings',
  MESSAGE_DELETE: 'Messages',
  REVIEW_DELETE: 'Reviews',
  PASSWORD_CHANGE: 'Security',
  SUSPICIOUS_ACTIVITY: 'Security',
};

export const getActionIcon = (action: ActivityAction): string => {
  switch (action) {
    case 'LOGIN_SUCCESS':
    case 'LOGOUT':
      return '🔓';
    case 'LOGIN_FAILED':
    case 'SUSPICIOUS_ACTIVITY':
      return '⚠️';
    case 'PRODUCT_ADD':
    case 'CATEGORY_ADD':
    case 'OFFER_ADD':
      return '➕';
    case 'PRODUCT_EDIT':
    case 'CATEGORY_EDIT':
    case 'OFFER_EDIT':
    case 'ORDER_UPDATE':
    case 'INVOICE_UPDATE':
    case 'SETTINGS_UPDATE':
    case 'PASSWORD_CHANGE':
      return '✏️';
    case 'PRODUCT_DELETE':
    case 'CATEGORY_DELETE':
    case 'OFFER_DELETE':
    case 'ORDER_DELETE':
    case 'MESSAGE_DELETE':
    case 'REVIEW_DELETE':
    case 'PRODUCT_BULK_DELETE':
      return '🗑️';
    case 'PRODUCT_BULK_EDIT':
      return '📝';
    default:
      return '📋';
  }
};

export const getStatusColor = (status: ActivityLog['status']): string => {
  switch (status) {
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'failed':
      return 'text-red-600 bg-red-50';
    case 'warning':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export const generateLogId = (): string => {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const getDeviceInfo = (): { userAgent: string; device: string; browser: string } => {
  const userAgent = navigator.userAgent;
  
  let device = 'Unknown Device';
  if (/iPad/i.test(userAgent)) device = 'iPad';
  else if (/iPhone/i.test(userAgent)) device = 'iPhone';
  else if (/Android/i.test(userAgent)) device = 'Android Phone';
  else if (/Windows/i.test(userAgent)) device = 'Windows PC';
  else if (/Mac/i.test(userAgent)) device = 'Mac';
  else if (/Linux/i.test(userAgent)) device = 'Linux PC';

  let browser = 'Unknown Browser';
  if (/Edge/i.test(userAgent)) browser = 'Edge';
  else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

  return { userAgent, device, browser };
};

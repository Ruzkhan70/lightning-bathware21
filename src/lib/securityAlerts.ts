import { ActivityLog } from './activityLog';

const getEmailJSConfig = () => ({
  serviceId: 'service_xdnqytp',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_SECURITY_ALERT || 'template_admin_security_alert',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
});

interface SecurityAlertData {
  type: 'failed_login' | 'suspicious_activity' | 'password_changed';
  email: string;
  attempts?: number;
  details: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
}

export const sendSecurityAlertEmail = async (data: SecurityAlertData): Promise<boolean> => {
  const config = getEmailJSConfig();
  
  if (!config.serviceId || !config.templateId || !config.publicKey) {
    console.warn('[Security] EmailJS not configured, skipping security alert');
    return false;
  }

  try {
    const emailjs = (window as any).emailjs;
    if (!emailjs) {
      console.warn('[Security] EmailJS not loaded');
      return false;
    }

    let subject = '';
    let message = '';

    switch (data.type) {
      case 'failed_login':
        subject = '⚠️ Failed Login Attempts - Admin Account';
        message = `
Dear Admin,

We detected ${data.attempts || 1} failed login attempt(s) on your admin account.

Account: ${data.email}
Time: ${new Date(data.timestamp).toLocaleString()}
IP Address: ${data.ipAddress || 'Unknown'}
Device: ${data.device || 'Unknown'}
Browser: ${data.browser || 'Unknown'}

${data.details}

If this wasn't you, please:
1. Change your password immediately
2. Review recent login activity
3. Enable two-factor authentication if available

---
Lightning Bathware Admin Portal
`;
        break;

      case 'suspicious_activity':
        subject = '🚨 Suspicious Activity Detected - Admin Account';
        message = `
Dear Admin,

Suspicious activity has been detected on your admin account.

Account: ${data.email}
Type: ${data.details}
Time: ${new Date(data.timestamp).toLocaleString()}
IP Address: ${data.ipAddress || 'Unknown'}
Device: ${data.device || 'Unknown'}

Please review this activity immediately and take necessary action.

---
Lightning Bathware Admin Portal
`;
        break;

      case 'password_changed':
        subject = '🔑 Password Changed - Admin Account';
        message = `
Dear Admin,

Your admin account password has been changed.

Account: ${data.email}
Time: ${new Date(data.timestamp).toLocaleString()}

If you didn't make this change, contact support immediately.

---
Lightning Bathware Admin Portal
`;
        break;
    }

    await emailjs.send(
      config.serviceId,
      'template_admin_security_alert',
      {
        from_name: 'Lightning Bathware',
        to_email: data.email,
        subject,
        message: message.trim(),
      }
    );

    console.log('[Security] Alert email sent successfully');
    return true;
  } catch (error) {
    console.error('[Security] Failed to send security alert email:', error);
    return false;
  }
};

export const sendSuspiciousLoginAlert = async (
  email: string,
  attempts: number,
  ipAddress?: string
): Promise<boolean> => {
  const deviceInfo = {
    device: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
    browser: typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'Unknown',
  };

  return sendSecurityAlertEmail({
    type: 'failed_login',
    email,
    attempts,
    details: `${attempts} failed login attempts detected. Someone may be trying to access your account.`,
    timestamp: new Date().toISOString(),
    ipAddress,
    ...deviceInfo,
  });
};

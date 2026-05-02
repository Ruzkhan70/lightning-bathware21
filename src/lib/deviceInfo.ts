let cachedIP: string | null = null;

export const getIPAddress = async (): Promise<string> => {
  if (cachedIP) return cachedIP;

  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json() as { ip?: string };
    cachedIP = data.ip || 'unknown';
    return cachedIP;
  } catch {
    try {
      const response = await fetch('https://api.ipify.org');
      cachedIP = (await response.text()) || 'unknown';
      return cachedIP;
    } catch {
      cachedIP = 'unknown';
      return cachedIP;
    }
  }
};

export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

export const getBrowserName = (): string => {
  const ua = navigator.userAgent;
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Unknown';
};

export const getOSName = (): string => {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iOS|iPhone|iPad/i.test(ua)) return 'iOS';
  return 'Unknown';
};

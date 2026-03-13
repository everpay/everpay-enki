import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DeviceInfo {
  device_id?: string;
  device_type: string;
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
  screen_resolution: string;
  language: string;
  timezone: string;
  ip_address?: string;
  user_agent: string;
  metadata?: Record<string, any>;
}

export function useDeviceAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    collectDeviceInfo();
  }, []);

  const collectDeviceInfo = () => {
    const info: DeviceInfo = {
      device_id: generateDeviceId(),
      device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      os: getOS(),
      os_version: 'unknown',
      browser: getBrowser(),
      browser_version: getBrowserVersion(),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      user_agent: navigator.userAgent,
    };
    setDeviceInfo(info);
    return info;
  };

  const trackDevice = async (eventType: string = 'login', additionalMetadata?: Record<string, any>) => {
    setIsLoading(true);
    try {
      const info = deviceInfo || collectDeviceInfo();
      const { data, error } = await supabase.functions.invoke('device-analytics', {
        body: {
          ...info,
          event_type: eventType,
          metadata: { ...info.metadata, ...additionalMetadata },
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Device tracking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceHistory = async (deviceId?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('device-analytics', {
        method: 'GET',
        body: { action: 'history', device_id: deviceId },
      });
      if (error) throw error;
      return data?.analytics;
    } catch (error) {
      console.error('Get device history error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, deviceInfo, collectDeviceInfo, trackDevice, getDeviceHistory };
}

function generateDeviceId(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('fp', 10, 10);
  const fp = canvas.toDataURL();
  const raw = navigator.userAgent + navigator.language + screen.width + 'x' + screen.height + new Date().getTimezoneOffset() + fp;
  return `dev_${btoa(raw).substring(0, 32)}`;
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Unknown';
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getBrowserVersion(): string {
  const ua = navigator.userAgent;
  const match = ua.match(/(Chrome|Safari|Firefox|Edge)\/(\d+)/);
  return match ? match[2] : 'unknown';
}

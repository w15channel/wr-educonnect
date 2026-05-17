import { useState, useEffect } from 'react';

/**
 * Detects device type and environment:
 *
 * 'desktop'  → width >= 1024px
 * 'tablet'   → 768px <= width < 1024px
 * 'mobile'   → width < 768px (browser)
 * 'app'      → width < 768px AND running inside a WebView / PWA / standalone app
 */

function detectIsApp() {
  if (typeof window === 'undefined') return false;
  if (window.navigator.standalone === true) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(ua) && !/Chrome/.test(ua);
  if (isAndroidWebView) return true;
  const isIOSWebView = /iPhone|iPad/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua);
  if (isIOSWebView) return true;
  if (window.__BASE44_APP__ === true) return true;
  if (window.__WR_APP__ === true) return true;
  return false;
}

function computeDevice(width, isApp) {
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return isApp ? 'app' : 'mobile';
}

export function useDeviceType() {
  const isApp = typeof window !== 'undefined' ? detectIsApp() : false;

  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    return computeDevice(window.innerWidth, isApp);
  });

  useEffect(() => {
    const handle = () => setDeviceType(computeDevice(window.innerWidth, isApp));
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [isApp]);

  return {
    deviceType,                                          // 'desktop' | 'tablet' | 'mobile' | 'app'
    isApp,
    isMobile: deviceType === 'mobile' || deviceType === 'app',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
  };
}
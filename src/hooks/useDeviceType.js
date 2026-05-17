import { useState, useEffect } from 'react';

/**
 * Detects device type and environment:
 * - 'desktop'  → width >= 1024px
 * - 'tablet'   → 768px <= width < 1024px
 * - 'mobile'   → width < 768px (browser)
 * - 'app'      → width < 768px AND running inside a WebView / PWA / standalone app
 */
function detectIsApp() {
  if (typeof window === 'undefined') return false;

  // Standalone PWA (added to home screen)
  if (window.navigator.standalone === true) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: fullscreen)').matches) return true;

  // Android WebView: no Chrome, but has Linux and Android
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(ua) && !/Chrome/.test(ua);
  if (isAndroidWebView) return true;

  // iOS WKWebView: has AppleWebKit but NOT Safari in UA
  const isIOSWebView = /iPhone|iPad/.test(ua) && /AppleWebKit/.test(ua) && !/Safari/.test(ua);
  if (isIOSWebView) return true;

  // Base44 app wrapper sets a custom flag
  if (window.__BASE44_APP__ === true) return true;
  if (window.__WR_APP__ === true) return true;

  return false;
}

export function useDeviceType() {
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    const isApp = detectIsApp();
    if (w >= 1024) return 'desktop';
    if (w >= 768) return 'tablet';
    return isApp ? 'app' : 'mobile';
  });

  const [isApp, setIsApp] = useState(() => detectIsApp());

  useEffect(() => {
    const appDetected = detectIsApp();
    setIsApp(appDetected);

    const handleResize = () => {
      const w = window.innerWidth;
      if (w >= 1024) {
        setDeviceType('desktop');
      } else if (w >= 768) {
        setDeviceType('tablet');
      } else {
        setDeviceType(appDetected ? 'app' : 'mobile');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    deviceType,           // 'desktop' | 'tablet' | 'mobile' | 'app'
    isApp,                // true when running inside WebView or PWA
    isMobile: deviceType === 'mobile' || deviceType === 'app',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isNarrow: deviceType === 'mobile' || deviceType === 'app' || deviceType === 'tablet',
  };
}
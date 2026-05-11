const APP_STORE_FALLBACKS = {
  youtube: {
    android: 'https://play.google.com/store/apps/details?id=com.google.android.youtube',
    ios: 'https://apps.apple.com/app/youtube-watch-listen-stream/id544007664',
  },
  instagram: {
    android: 'https://play.google.com/store/apps/details?id=com.instagram.android',
    ios: 'https://apps.apple.com/app/instagram/id389801252',
  },
  facebook: {
    android: 'https://play.google.com/store/apps/details?id=com.facebook.katana',
    ios: 'https://apps.apple.com/app/facebook/id284882215',
  },
};

const getMobileOS = () => {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return null;
};

export const isSocialAppLink = (url) => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(youtube\.com|youtu\.be|instagram\.com|facebook\.com|fb\.watch)/.test(host);
  } catch {
    return false;
  }
};

export const openSocialAppOrStore = (url) => {
  const os = getMobileOS();
  if (!os) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  const lower = url.toLowerCase();
  const appKey = lower.includes('instagram.com') ? 'instagram' : lower.includes('facebook.com') || lower.includes('fb.watch') ? 'facebook' : 'youtube';
  const fallback = APP_STORE_FALLBACKS[appKey][os];

  window.location.href = url;
  setTimeout(() => {
    if (document.visibilityState === 'visible') {
      window.location.href = fallback;
    }
  }, 1300);
};

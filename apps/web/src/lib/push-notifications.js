import { apiClient } from './api-client';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('ServiceWorker registration error:', err);
    return null;
  }
}

export async function requestAndSubscribePush({ user, outletId } = {}) {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, reason: 'sw_failed' };
    }

    // 1. Get backend VAPID Public Key
    let publicKey = null;
    try {
      const res = await apiClient.get('/v1/notifications/vapid-public-key');
      publicKey = res?.data?.publicKey;
    } catch (_e) {
      // fallback
    }

    if (!publicKey) {
      publicKey = 'BNpr5r-8-xC6XaUSnCGyn7C6G-dx61CbwFhZRJNoMckZmTq-9itL41ZZjw4aojh9E0C1dRWKrSguvl4c9jzCI5Q';
    }

    // 2. Subscribe with PushManager
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 3. Send subscription to API
    const subJson = sub.toJSON();
    await apiClient.post('/v1/notifications/subscribe', {
      subscription: subJson,
      outletId: outletId || user?.outletId,
      role: user?.role || 'staff',
      deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser',
    });

    return { success: true, subscription: subJson };
  } catch (err) {
    console.warn('Push subscription failed:', err);
    return { success: false, error: err.message };
  }
}

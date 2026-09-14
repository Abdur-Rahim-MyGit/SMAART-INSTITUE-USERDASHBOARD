import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';

export function PWARegister() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    if (offlineReady) {
      toast.success('App ready to work offline', {
        duration: 4000,
        onAutoClose: close,
        onDismiss: close,
      });
    } else if (needRefresh) {
      // A new service worker has already taken control of this tab
      // (skipWaiting + clientsClaim), but the JS already loaded in memory
      // is still the old bundle. Leaving that mismatch open indefinitely —
      // as a dismissible toast previously did — is exactly what produces
      // confusing runtime errors like "X is not a constructor" when a
      // freshly-fetched (new) chunk meets an old chunk still in memory.
      // registerType: 'autoUpdate' means this should update itself, so
      // reload automatically after a brief, visible heads-up instead of
      // waiting on a click that's easy to miss or dismiss.
      toast('Updating to the latest version…', {
        description: 'Reloading in a moment to apply the update.',
        duration: 2500,
      });
      const timer = setTimeout(() => updateServiceWorker(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, needRefresh, updateServiceWorker]);

  return null; // This component handles SW logic only, no UI
}

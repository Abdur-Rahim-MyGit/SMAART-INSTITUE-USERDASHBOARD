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
      toast('Update Available', {
        description: 'A new version of the dashboard is available.',
        duration: Infinity,
        action: {
          label: 'Reload',
          onClick: () => updateServiceWorker(true),
        },
        onDismiss: close,
      });
    }
  }, [offlineReady, needRefresh, updateServiceWorker]);

  return null; // This component handles SW logic only, no UI
}

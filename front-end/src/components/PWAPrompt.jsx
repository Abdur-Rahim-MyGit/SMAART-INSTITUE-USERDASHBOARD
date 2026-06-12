import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function PWAPrompt() {
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

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // If we are on the landing page ('/'), wait 6 seconds for the splash screen to finish.
      // Otherwise, wait 1.5 seconds.
      const delay = window.location.pathname === '/' ? 6000 : 1500;
      
      setTimeout(() => {
        setShowInstallBanner(true);
      }, delay);
    };

    if (window.deferredPWAEvent) {
      handlePrompt(window.deferredPWAEvent);
    }

    const handleGlobalEvent = () => {
      if (window.deferredPWAEvent) {
        handlePrompt(window.deferredPWAEvent);
      }
    };

    window.addEventListener('pwa-prompt-ready', handleGlobalEvent);
    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('pwa-prompt-ready', handleGlobalEvent);
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

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
        action: (
          <button 
            className="bg-[#1a3884] text-white px-3 py-1 rounded text-xs font-semibold" 
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
        ),
        onDismiss: close,
      });
    }
  }, [offlineReady, needRefresh, updateServiceWorker]);

  return null;
}

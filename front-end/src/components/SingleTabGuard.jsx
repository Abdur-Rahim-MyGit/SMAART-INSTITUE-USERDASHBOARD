import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import useUser from "@/hooks/useUser";

/**
 * SingleTabGuard prevents a user from opening the application
 * with the same account in multiple tabs simultaneously using BroadcastChannel.
 */
const SingleTabGuard = ({ children }) => {
  const [isDuplicate, setIsDuplicate] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!user) {
      // If user logs out, we reset duplicate state so another account can log in safely
      setIsDuplicate(false);
      return;
    }

    try {
      const userId = user.id || user._id;
      if (!userId) return;

      const channelName = `smaart_tab_lock_${userId}`;
      const channel = new BroadcastChannel(channelName);
      const tabId = Math.random().toString(36).substring(2);
      
      // When I open (or log in), I announce my presence
      channel.postMessage({ type: 'PING', tabId });

      channel.onmessage = (event) => {
        if (event.data.type === 'PING') {
          // Someone else (a new tab) just opened or logged in! I am the older tab.
          // I tell them I am already here running this account.
          channel.postMessage({ type: 'PONG', tabId });
        } else if (event.data.type === 'PONG') {
          // I received a PONG! This means an older tab is already running this account. I am the duplicate!
          setIsDuplicate(true);
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.error("Single tab guard error:", e);
    }
  }, [user]);

  if (isDuplicate) {
    return (
      <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-[#001229] p-4 z-[99999]">
        <div className="max-w-md w-full bg-[#002147] rounded-2xl p-8 text-center shadow-2xl border border-white/10">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Multiple Tabs Not Allowed
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            You already have this account open in another tab. For security and synchronization reasons, please continue using your original tab.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/';
              }}
              className="px-6 py-3 bg-[#1a3884] text-white rounded-xl font-semibold hover:bg-[#287a84] transition-colors"
            >
              Sign Out & Return Home
            </button>
            <p className="text-xs text-white/40 mt-4">
              You can safely close this duplicate tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default SingleTabGuard;

"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function StampPwa() {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isSafari, setIsSafari] = useState(false);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);
    setOnline(navigator.onLine);
    const userAgent = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIos(ios);
    setIsSafari(ios && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent));
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); setShowInstallHelp(false); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      void (async () => {
        try {
          // Remove the earlier root-scoped worker so it cannot control the portfolio.
          const registrations = await navigator.serviceWorker.getRegistrations();
          const development = process.env.NODE_ENV === "development";
          const origin = window.location.origin;
          await Promise.all(registrations
            .filter((registration) => {
              const scripts = [registration.active, registration.waiting, registration.installing];
              const isStampWorker = (scope: string, path: string) =>
                registration.scope === origin + scope &&
                scripts.some((worker) => worker?.scriptURL === origin + path);
              return isStampWorker("/", "/sw.js") ||
                (development && isStampWorker("/stamp", "/stamp/sw.js"));
            })
            .map((registration) => registration.unregister()));
          if (development) {
            const keys = await caches.keys();
            await Promise.all(keys.filter((key) => key.startsWith("stamp-shell-")).map((key) => caches.delete(key)));
            return;
          }
          await navigator.serviceWorker.register("/stamp/sw.js", { scope: "/stamp", updateViaCache: "none" });
        } catch {
          // Stamp remains usable online if service workers are unavailable.
        }
      })();
    }
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) { setShowInstallHelp((shown) => !shown); return; }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      setShowInstallHelp(true);
    } finally {
      setInstallPrompt(null);
    }
  }

  return (
    <>
      <div className={`stamp-pwa-status ${online ? "is-online" : "is-offline"}`} role="status" aria-live="polite">
        {!online && <span>Offline · Connect to the internet to sign in or update your timecard.</span>}
      </div>
      {!installed && (
        <div className="stamp-install-wrap">
          <button className="stamp-install-button" type="button" onClick={install} aria-expanded={showInstallHelp}>
            Add to Home Screen
          </button>
          {showInstallHelp && (
            <div className="stamp-install-help" role="dialog" aria-label="Install Stamp">
              <button className="stamp-install-close" type="button" onClick={() => setShowInstallHelp(false)} aria-label="Close install instructions">×</button>
              <strong>Install Stamp</strong>
              {isIos ? (
                <p>{isSafari ? <>In Safari, tap <b>Share</b>, choose <b>Add to Home Screen</b>, enable <b>Open as Web App</b> if shown, then tap <b>Add</b>.</> : <>Open this page in Safari, tap <b>Share</b>, choose <b>Add to Home Screen</b>, enable <b>Open as Web App</b> if shown, then tap <b>Add</b>.</>}</p>
              ) : (
                <p>Use your browser’s menu and choose <b>Install app</b> or <b>Add to Home Screen</b>.</p>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

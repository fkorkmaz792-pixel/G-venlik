import React, { useEffect, useState } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Show iOS prompt after a small delay
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      setShowPrompt(true);
      
      // Try to trigger the prompt automatically after a short delay
      // Note: Modern browsers require a user gesture (click) to show the actual install prompt,
      // but we can try to show it automatically if the browser allows it.
      setTimeout(() => {
        try {
          (e as any).prompt();
        } catch (err) {
          console.log("Browser requires user interaction to install PWA");
        }
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = async () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 z-50 animate-in slide-in-from-bottom-5 pb-5">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-3 right-3 p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
          <Download size={28} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Uygulamayı Yükle</h3>
          {isIOS ? (
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>iPhone'unuzda tam ekran deneyimi için:</p>
              <ol className="space-y-2">
                <li className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">1</span>
                  <span>Alt menüden <Share size={16} className="inline mx-1 text-blue-500" /> dokunun</span>
                </li>
                <li className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-xs">2</span>
                  <span><PlusSquare size={16} className="inline mx-1 text-gray-500 dark:text-gray-400" /> <strong>Ana Ekrana Ekle</strong>'yi seçin</span>
                </li>
              </ol>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daha hızlı ve tam ekran deneyim için uygulamayı ana ekranınıza ekleyin.
              </p>
              <button 
                onClick={onClick}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/30 text-sm"
              >
                Hemen Yükle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

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
      const timer = setTimeout(() => setShowPrompt(true), 3000);
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
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in slide-in-from-bottom-5">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      >
        <X size={20} />
      </button>
      
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
          <Download size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">Uygulamayı Yükle</h3>
          {isIOS ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Telefonunuza yüklemek için tarayıcının altındaki <strong>Paylaş</strong> ikonuna dokunun ve <strong>Ana Ekrana Ekle</strong>'yi seçin.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Daha hızlı ve tam ekran deneyim için uygulamayı ana ekranınıza ekleyin.
              </p>
              <button 
                onClick={onClick}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
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

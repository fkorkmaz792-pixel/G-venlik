import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Moon, Sun, Download, Upload, RefreshCw, Maximize, Minimize } from 'lucide-react';

export default function Settings() {
  const { darkMode, toggleDarkMode, personnel, visitors, importData } = useAppStore();
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = async () => {
    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isIOS && !isStandalone) {
      alert("iOS Safari'de tam ekran modu için lütfen alt menüdeki 'Paylaş' (kare içinden yukarı ok) butonuna basıp 'Ana Ekrana Ekle' seçeneğini kullanın. Apple, Safari içinde butonla tam ekran yapılmasına izin vermemektedir.");
      return;
    }

    if (!document.fullscreenElement) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen(); // Safari fallback
        } else {
          alert("Tarayıcınız bu özelliği desteklemiyor. Lütfen uygulamayı ana ekrana ekleyin.");
        }
      } catch (err) {
        console.error("Tam ekran moduna geçilemedi:", err);
        alert("Tam ekrana geçilemedi. Lütfen uygulamayı ana ekrana ekleyin.");
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleUpdateApp = () => {
    if (confirm('Uygulamayı güncellemek için sayfa yeniden yüklenecek. Devam etmek istiyor musunuz?')) {
      // Force reload to fetch new service worker / assets
      window.location.reload();
    }
  };

  const handleBackup = () => {
    try {
      const data = {
        personnel,
        visitors
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `guvenlik_yerel_yedek_${new Date().toISOString().split('T')[0]}.db`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Yedekleme sırasında bir hata oluştu.');
    }
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm('Yerel verileriniz bu dosyadaki verilerle değiştirilecek. Devam etmek istiyor musunuz?')) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          importData(data);
          alert('Geri yükleme başarıyla tamamlandı!');
        } catch (err) {
          console.error(err);
          alert('Geri yükleme sırasında bir hata oluştu. Dosya formatını kontrol edin.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div className="ios-list p-6">
        <h2 className="text-[22px] font-bold text-black dark:text-white mb-6">Ayarlar</h2>
        
        <div className="space-y-8">
          {/* Local Backup Section */}
          <div className="p-5 bg-gray-500/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-500/10 text-gray-600 dark:text-gray-400">
                <Download size={24} />
              </div>
              <div>
                <h3 className="text-[17px] font-bold text-black dark:text-white">Yerel Yedekleme</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">
                  Verilerinizi cihazınıza JSON dosyası olarak yedekleyin veya geri yükleyin.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex gap-3">
                <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded-2xl text-[14px] font-bold active:opacity-50 transition-colors">
                  <Download size={18} /> Yedekle
                </button>
                <button onClick={handleRestore} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-white/10 text-black dark:text-white rounded-2xl text-[14px] font-bold active:opacity-50 transition-colors">
                  <Upload size={18} /> Geri Yükle
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 ml-1">Görünüm Modu</h3>
            <div className="flex gap-3">
              <button
                onClick={() => darkMode && toggleDarkMode()}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-3xl border-2 transition-all ${
                  !darkMode 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'border-black/5 dark:border-white/5 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Sun size={24} />
                <span className="text-[14px] font-bold">Gündüz</span>
              </button>
              <button
                onClick={() => !darkMode && toggleDarkMode()}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-4 rounded-3xl border-2 transition-all ${
                  darkMode 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'border-black/5 dark:border-white/5 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Moon size={24} />
                <span className="text-[14px] font-bold">Gece</span>
              </button>
            </div>
          </div>

          {/* App Settings Section */}
          <div className="p-5 bg-gray-500/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
            <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 ml-1">Uygulama Ayarları</h3>
            <div className="space-y-3">
              <button 
                onClick={toggleFullScreen}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-black/5 dark:border-white/5 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[16px] text-black dark:text-white">Tam Ekran Modu</p>
                    <p className="text-[12px] text-gray-500">Uygulamayı tam ekranda kullanın</p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full transition-colors relative ${isFullScreen ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${isFullScreen ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </button>

              <button 
                onClick={handleUpdateApp}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#2C2C2E] rounded-2xl border border-black/5 dark:border-white/5 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                    <RefreshCw size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[16px] text-black dark:text-white">Uygulamayı Güncelle</p>
                    <p className="text-[12px] text-gray-500">Son güncellemeleri denetle ve yükle</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

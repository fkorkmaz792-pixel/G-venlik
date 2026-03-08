import React, { useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { Menu, X, Home, Users, UserCheck, Radio as RadioIcon, Cloud, Calendar, FileText, QrCode, Gamepad2, Settings, BarChart2, MessageSquare, Newspaper, Bell, Moon, Sun, Bot } from 'lucide-react';
import Hls from 'hls.js';

const menuItems = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/assistant', label: 'Yapay Zeka', icon: Bot },
  { path: '/news', label: 'Haberler', icon: Newspaper },
  { path: '/personnel', label: 'Personel', icon: Users },
  { path: '/visitors', label: 'Ziyaretçiler', icon: UserCheck },
  { path: '/radio', label: 'Radyo', icon: RadioIcon },
  { path: '/weather', label: 'Hava Durumu', icon: Cloud },
  { path: '/calendar', label: 'Vardiya Takvimi', icon: Calendar },
  { path: '/alarms', label: 'Devriye Alarmları', icon: Bell },
  { path: '/notes', label: 'Not Defteri', icon: FileText },
  { path: '/scanner', label: 'QR/Barkod', icon: QrCode },
  { path: '/reports', label: 'Raporlar', icon: BarChart2 },
  { path: '/chats', label: 'Sohbet', icon: MessageSquare },
  { path: '/games', label: 'Oyunlar', icon: Gamepad2 },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

export default function Layout() {
  const { isDrawerOpen, toggleDrawer, closeDrawer, darkMode, toggleDarkMode } = useAppStore();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-black flex justify-center transition-colors duration-200">
      <div className="w-full max-w-md bg-gray-100 dark:bg-gray-900 min-h-screen flex flex-col relative shadow-2xl overflow-hidden transition-colors duration-200 transform-gpu">
        {/* Header */}
        <header className="bg-blue-600 dark:bg-gray-800 text-white p-4 flex items-center shadow-md z-20 transition-colors duration-200">
        <button onClick={toggleDrawer} className="p-2 mr-2 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-full">
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-bold flex-1">Güvenlik Asistanı V2</h1>
        <button onClick={toggleDarkMode} className="p-2 hover:bg-blue-700 dark:hover:bg-gray-700 rounded-full">
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </header>

        {/* Drawer Overlay */}
        {isDrawerOpen && (
          <div 
            className="absolute inset-0 bg-black/50 z-30"
            onClick={closeDrawer}
          />
        )}

        {/* Drawer */}
        <div className={`absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl z-40 transform transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 bg-blue-600 dark:bg-gray-900 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold">Menü</h2>
          <button onClick={closeDrawer} className="p-1 hover:bg-blue-700 dark:hover:bg-gray-800 rounded-full">
            <X size={20} />
          </button>
        </div>
        <nav className="p-2 overflow-y-auto h-[calc(100vh-60px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeDrawer}
                className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${
                  isActive ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <Outlet />
        <div className="mt-8 pb-4 text-center">
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-medium uppercase tracking-widest">
            Güvenlik Asistanı V2 • v2.1.0 • AI Studio
          </p>
        </div>
      </main>

        {/* Global Radio Player (if playing) */}
        <GlobalRadio />
      </div>
    </div>
  );
}

function GlobalRadio() {
  const { currentStation, isPlaying, setIsPlaying } = useAppStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    const playAudio = () => {
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      } else {
        audio.pause();
      }
    };

    if (currentStation.url.includes('.m3u8')) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(currentStation.url);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, playAudio);
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
        audio.src = currentStation.url;
        audio.addEventListener('loadedmetadata', playAudio);
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.src = currentStation.url;
      playAudio();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      audio.removeEventListener('loadedmetadata', playAudio);
    };
  }, [currentStation]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  
  if (!currentStation) return null;

  return (
    <div className="bg-gray-900 text-white p-3 flex items-center justify-between shadow-lg border-t border-gray-800">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
          <RadioIcon size={20} className="text-blue-400" />
        </div>
        <div className="truncate">
          <p className="text-sm font-medium truncate">{currentStation.name}</p>
          <p className="text-xs text-gray-400 truncate">Canlı Yayın</p>
        </div>
      </div>
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0"
      >
        {isPlaying ? <span className="w-3 h-3 bg-white rounded-sm" /> : <span className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1" />}
      </button>
      <audio ref={audioRef} />
    </div>
  );
}

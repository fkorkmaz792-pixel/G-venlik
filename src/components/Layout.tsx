import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { Home, Users, UserCheck, Settings, BarChart2, Moon, Sun, Plus, ShieldAlert, Search, Maximize, Minimize, Columns } from 'lucide-react';
import { auth } from '../firebase';

const baseMenuItems = [
  { path: '/', label: 'Ana Sayfa', icon: Home },
  { path: '/personnel', label: 'Personel', icon: Users },
  { path: '/visitors', label: 'Ziyaretçiler', icon: UserCheck },
  { path: '/reports', label: 'Raporlar', icon: BarChart2 },
  { path: '/settings', label: 'Ayarlar', icon: Settings },
];

export default function Layout() {
  const { darkMode, toggleDarkMode, personnelColumns, setPersonnelColumns } = useAppStore();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const menuItems = userEmail?.toLowerCase() === 'fkorkmaz703@gmail.com' 
    ? [...baseMenuItems, { path: '/admin', label: 'Özel', icon: ShieldAlert }]
    : baseMenuItems;

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (darkMode) {
      document.documentElement.classList.add('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#000000');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#F2F2F7');
    }
  }, [darkMode]);

  const getPageTitle = () => {
    const item = menuItems.find(i => i.path === location.pathname);
    return item ? item.label : 'Güvenlik';
  };

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };
    const handleBlur = () => {
      setIsKeyboardOpen(false);
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#F2F2F7] dark:bg-black flex justify-center transition-colors duration-200 overflow-hidden">
      <div className="w-full h-[100dvh] flex flex-col relative overflow-hidden transition-colors duration-200">
        {/* iOS Style Header */}
        <header className="ios-glass sticky top-0 z-30 px-4 pt-[calc(0.25rem+env(safe-area-inset-top))] pb-3 flex items-center justify-center w-full border-b border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-start min-w-[80px]">
              {(location.pathname === '/personnel' || location.pathname === '/visitors') && (
                <>
                  <button 
                    onClick={() => window.dispatchEvent(new Event('open-add-modal'))}
                    className="p-2 -ml-2 active:opacity-50 transition-opacity text-blue-600 dark:text-blue-400"
                  >
                    <Plus size={24} />
                  </button>
                  <button 
                    onClick={() => window.dispatchEvent(new Event('toggle-search'))}
                    className="p-2 active:opacity-50 transition-opacity text-blue-600 dark:text-blue-400"
                  >
                    <Search size={22} />
                  </button>
                </>
              )}
            </div>
            <h1 className="text-[17px] font-semibold tracking-tight text-black dark:text-white flex-1 text-center">
              {getPageTitle()}
            </h1>
            <div className="min-w-[80px] flex justify-end gap-1 relative">
              {location.pathname === '/personnel' && (
                <div className="relative">
                  <button 
                    onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)} 
                    className="p-2 active:opacity-50 transition-opacity text-blue-600 dark:text-blue-400"
                    title="Sütun Seç"
                  >
                    <Columns size={22} />
                  </button>
                  
                  {isColumnMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsColumnMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-32 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-50 py-1">
                        <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-black/5 dark:border-white/5">
                          Sütun Seç
                        </div>
                        {[1, 2, 3].map(num => (
                          <button
                            key={num}
                            onClick={() => {
                              setPersonnelColumns(num);
                              setIsColumnMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                              personnelColumns === num 
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                          >
                            {num} Sütun
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <button 
                onClick={toggleFullscreen} 
                className="p-2 active:opacity-50 transition-opacity text-blue-600 dark:text-blue-400 hidden sm:block"
                title="Tam Ekran"
              >
                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
              </button>
              <button 
                onClick={toggleDarkMode} 
                className="p-2 -mr-2 active:opacity-50 transition-opacity text-blue-600 dark:text-blue-400"
              >
                {darkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-24 text-black dark:text-white transition-colors duration-200 w-full relative">
          <Outlet />
        </main>

        {/* iOS Bottom Tab Bar */}
        <nav 
          className={`fixed bottom-0 left-0 w-full bg-white dark:bg-[#1C1C1E] z-50 px-2 md:px-6 pt-2 pb-4 flex justify-center items-center border-t border-black/10 dark:border-white/10 rounded-t-[32px] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 ${isKeyboardOpen ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
        >
          <div className="flex justify-around md:justify-center md:gap-12 items-center w-full h-[65px]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-all px-2 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

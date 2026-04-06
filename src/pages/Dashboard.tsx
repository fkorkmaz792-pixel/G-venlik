import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Cloud, Settings, BarChart2, 
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

const modules = [
  { path: '/personnel', label: 'Personel', icon: Users, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
  { path: '/visitors', label: 'Ziyaretçiler', icon: UserCheck, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, personnel, visitors, cities, selectedCityId } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<{temp: number, city: string} | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState('Güncel Konum');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number, cityName: string) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data && data.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            city: cityName
          });
        }
      } catch (error) {
        console.warn('Weather fetch error:', error);
      }
    };

    if (selectedCityId === 'current') {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=tr`);
            const data = await res.json();
            if (data && data.address) {
              const name = data.address.city || data.address.town || data.address.province || 'Güncel Konum';
              setCurrentLocationName(name);
              fetchWeather(lat, lon, name);
            } else {
              fetchWeather(lat, lon, 'Güncel Konum');
            }
          } catch (e) {
            console.warn("Reverse geocoding failed", e);
            fetchWeather(lat, lon, 'Güncel Konum');
          }
        },
        () => {
          if (cities.length > 0) {
            fetchWeather(cities[0].lat, cities[0].lon, cities[0].name);
          } else {
            fetchWeather(39.9208, 32.8541, 'Ankara'); // Default Ankara
          }
        }
      );
    } else {
      const city = cities.find(c => c.id === selectedCityId);
      if (city) {
        fetchWeather(city.lat, city.lon, city.name);
      }
    }
  }, [selectedCityId, cities]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pt-4 md:pt-8"
    >
      {/* iOS Style Header Title (Large) */}
      <motion.div variants={itemVariants} className="px-2">
        <p className="text-[13px] font-semibold text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-1">
          {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h2 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Hoş Geldiniz
        </h2>
      </motion.div>

      {/* Hero Bento Card */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-8 rounded-[32px] border border-blue-100 dark:border-blue-500/20 shadow-2xl shadow-blue-500/10"
      >
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-start mb-10">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 dark:border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Sistem Aktif</span>
          </div>
          <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 drop-shadow-sm">
            {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-4">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] transition-transform">
            <Users className="text-white mb-3 opacity-80" size={32} />
            <p className="text-4xl font-black text-white tracking-tighter">{personnel.length}</p>
            <p className="text-[12px] font-bold text-blue-100 uppercase tracking-wider mt-1">Personel</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-lg shadow-emerald-500/30 transform hover:scale-[1.02] transition-transform">
            <UserCheck className="text-white mb-3 opacity-80" size={32} />
            <p className="text-4xl font-black text-white tracking-tighter">{visitors.length}</p>
            <p className="text-[12px] font-bold text-emerald-100 uppercase tracking-wider mt-1">Ziyaretçi</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Grid Bento Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <Link to="/weather" className="relative overflow-hidden p-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-[32px] border border-sky-100 dark:border-sky-500/20 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col justify-between h-40 group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-sky-400/20 blur-2xl group-hover:bg-sky-400/30 transition-colors" />
              <div className="w-12 h-12 bg-sky-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Cloud size={24} />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-[16px] text-sky-900 dark:text-sky-100">Hava Durumu</p>
                <p className="text-[13px] font-medium text-sky-600 dark:text-sky-400 mt-0.5">
                  {weather ? `${weather.temp}°C • ${weather.city}` : 'Yükleniyor...'}
                </p>
              </div>
            </Link>
            <Link to="/reports" className="relative overflow-hidden p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-[32px] border border-purple-100 dark:border-purple-500/20 shadow-md hover:shadow-lg active:scale-95 transition-all flex flex-col justify-between h-40 group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-purple-400/20 blur-2xl group-hover:bg-purple-400/30 transition-colors" />
              <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <BarChart2 size={24} />
              </div>
              <div className="relative z-10">
                <p className="font-bold text-[16px] text-purple-900 dark:text-purple-100">Raporlar</p>
                <p className="text-[13px] font-medium text-purple-600 dark:text-purple-400 mt-0.5">Haftalık özet hazır</p>
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Main Navigation List (iOS Style) */}
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="px-2 text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Yönetim</h3>
            <div className="ios-list">
              {modules.map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <Link 
                    key={mod.path} 
                    to={mod.path}
                    className={`ios-list-item ${i !== modules.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center shadow-lg ${mod.shadow}`}>
                        <Icon size={20} />
                      </div>
                      <span className="font-bold text-[17px] text-black dark:text-white">{mod.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="ios-list shadow-md">
            <Link to="/settings" className="ios-list-item w-full group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 text-white shadow-lg shadow-gray-900/20 group-hover:scale-105 transition-transform">
                  <Settings size={20} />
                </div>
                <span className="font-bold text-[16px]">Ayarlar</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

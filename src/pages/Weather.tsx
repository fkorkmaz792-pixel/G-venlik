import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Droplets, Wind, Sun, CloudRain, CloudLightning, CloudSnow, Bell, BellOff, AlertTriangle, MapPin, Plus, X, Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../store';
import { motion } from 'framer-motion';

// Weather Animation Components
const SunnyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl"
    />
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-10 right-10 text-yellow-300 opacity-80"
    >
      <Sun size={120} />
    </motion.div>
  </div>
);

const CloudyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div 
      animate={{ x: [0, 50, 0] }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-10 -left-10 text-white/40"
    >
      <Cloud size={140} />
    </motion.div>
    <motion.div 
      animate={{ x: [0, -40, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-24 right-10 text-white/30"
    >
      <Cloud size={100} />
    </motion.div>
  </div>
);

const RainyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <CloudyAnimation />
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -20, x: Math.random() * 400, opacity: 0 }}
        animate={{ y: 300, opacity: [0, 1, 0] }}
        transition={{ 
          duration: 1 + Math.random(), 
          repeat: Infinity, 
          delay: Math.random() * 2,
          ease: "linear" 
        }}
        className="absolute top-0 w-0.5 h-6 bg-blue-200/60 rounded-full"
      />
    ))}
  </div>
);

const SnowyAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <CloudyAnimation />
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -20, x: Math.random() * 400, opacity: 0, rotate: 0 }}
        animate={{ y: 300, x: `calc(${Math.random() * 400}px + ${Math.random() * 50 - 25}px)`, opacity: [0, 1, 0], rotate: 360 }}
        transition={{ 
          duration: 3 + Math.random() * 2, 
          repeat: Infinity, 
          delay: Math.random() * 3,
          ease: "linear" 
        }}
        className="absolute top-0 w-2 h-2 bg-white/80 rounded-full"
      />
    ))}
  </div>
);

const ThunderstormAnimation = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <RainyAnimation />
    <motion.div
      animate={{ opacity: [0, 0, 0.8, 0, 0, 0.5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear", times: [0, 0.8, 0.82, 0.85, 0.9, 0.92, 1] }}
      className="absolute inset-0 bg-white mix-blend-overlay"
    />
  </div>
);

export default function Weather() {
  const { darkMode, cities, selectedCityId, setSelectedCityId, addCity, removeCity } = useAppStore();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocationName, setCurrentLocationName] = useState('Güncel Konum');
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [lastNotifiedCode, setLastNotifiedCode] = useState<number | null>(null);

  const requestPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const checkAndNotify = useCallback((code: number) => {
    if (darkMode) return; // Only notify in day mode
    if (notificationPermission !== 'granted') return;
    if (code === lastNotifiedCode) return; // Don't notify for the same code twice in a row

    const criticalCodes = [65, 67, 75, 82, 95, 96, 99];
    if (criticalCodes.includes(code)) {
      let title = "Kritik Hava Durumu Uyarısı";
      let body = "";

      switch (code) {
        case 65: body = "Yoğun yağmur bekleniyor. Lütfen tedbirli olun."; break;
        case 67: body = "Yoğun dondurucu yağmur uyarısı! Yollar kaygan olabilir."; break;
        case 75: body = "Yoğun kar yağışı uyarısı! Görüş mesafesi düşebilir."; break;
        case 82: body = "Şiddetli sağanak yağış uyarısı! Sel riskine karşı dikkatli olun."; break;
        case 95: body = "Fırtına uyarısı! Dışarıdaki eşyaları sabitleyin."; break;
        case 96:
        case 99: body = "Dolu yağışlı şiddetli fırtına uyarısı! Kapalı alanlarda kalın."; break;
        default: body = "Kritik hava koşulları tespit edildi.";
      }

      new Notification(title, {
        body,
        icon: '/pwa-192x192.svg',
        badge: '/pwa-192x192.svg'
      });
      setLastNotifiedCode(code);
    }
  }, [darkMode, notificationPermission, lastNotifiedCode]);

  const fetchWeather = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`);
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.warn('Weather fetch error:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedCityId === 'current') {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeather(lat, lon);
          
          // Try to get city name from coordinates
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=tr`);
            const data = await res.json();
            if (data && data.address) {
              setCurrentLocationName(data.address.city || data.address.town || data.address.province || 'Güncel Konum');
            }
          } catch (e) {
            console.warn("Reverse geocoding failed", e);
          }
        },
        () => {
          // Fallback to first city if geolocation fails
          if (cities.length > 0) {
            setSelectedCityId(cities[0].id);
          } else {
            fetchWeather(39.9208, 32.8541); // Default Ankara
          }
        }
      );
    } else {
      const city = cities.find(c => c.id === selectedCityId);
      if (city) {
        fetchWeather(city.lat, city.lon);
      }
    }
  }, [selectedCityId, cities, setSelectedCityId]);

  useEffect(() => {
    if (weather) {
      checkAndNotify(weather.current.weather_code);
    }
  }, [weather, checkAndNotify]);

  const searchCities = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5&language=tr&format=json`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.warn('City search error:', error);
    }
    setIsSearching(false);
  };

  const handleAddCity = (cityData: any) => {
    addCity({
      name: cityData.name,
      lat: cityData.latitude,
      lon: cityData.longitude
    });
    setShowCityModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getWeatherIcon = (code: number, size = 24) => {
    if (code <= 1) return <Sun size={size} className="text-yellow-400" />;
    if (code <= 3) return <Cloud size={size} className="text-gray-400" />;
    if (code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code <= 77) return <CloudSnow size={size} className="text-blue-200" />;
    if (code <= 99) return <CloudLightning size={size} className="text-purple-400" />;
    return <Cloud size={size} className="text-gray-400" />;
  };

  const getDisplayCityName = () => {
    if (selectedCityId === 'current') return currentLocationName;
    const city = cities.find(c => c.id === selectedCityId);
    return city ? city.name : 'Bilinmeyen Konum';
  };

  const getWeatherBackground = (code: number) => {
    if (code <= 1) return "from-blue-400 to-blue-600"; // Sunny
    if (code <= 3) return "from-gray-400 to-gray-600"; // Cloudy
    if (code <= 67) return "from-slate-600 to-blue-800"; // Rain
    if (code <= 77) return "from-blue-200 to-slate-400"; // Snow
    if (code <= 99) return "from-slate-800 to-purple-900"; // Thunderstorm
    return "from-blue-500 to-indigo-600";
  };

  const renderWeatherAnimation = (code: number) => {
    if (code <= 1) return <SunnyAnimation />;
    if (code <= 3) return <CloudyAnimation />;
    if (code <= 67) return <RainyAnimation />;
    if (code <= 77) return <SnowyAnimation />;
    if (code <= 99) return <ThunderstormAnimation />;
    return null;
  };

  if (loading && !weather) return <div className="text-center py-10">Hava durumu yükleniyor...</div>;
  if (!weather) return <div className="text-center py-10 text-red-500">Hava durumu alınamadı.</div>;

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      {/* City Selector */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
        <button
          onClick={() => setSelectedCityId('current')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-bold ${
            selectedCityId === 'current' 
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
              : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <MapPin size={16} />
          Güncel Konum
        </button>
        
        {cities.map(city => (
          <div key={city.id} className="relative group flex-shrink-0">
            <button
              onClick={() => setSelectedCityId(city.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors text-sm font-bold ${
                selectedCityId === city.id 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                  : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
              }`}
            >
              {city.name}
            </button>
            {selectedCityId === city.id && (
              <button 
                onClick={(e) => { e.stopPropagation(); removeCity(city.id); }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={() => setShowCityModal(true)}
          className="flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-700 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus size={16} />
          Şehir Ekle
        </button>
      </div>

      {/* Notification Permission Banner */}
      {notificationPermission !== 'granted' && (
        <div className="ios-glass border border-amber-500/20 p-4 rounded-3xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-amber-800 dark:text-amber-200">Hava Durumu Bildirimleri</p>
              <p className="text-[12px] text-amber-700 dark:text-amber-300 opacity-80">Kritik hava koşullarından haberdar olun.</p>
            </div>
          </div>
          <button 
            onClick={requestPermission}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold rounded-full transition-colors whitespace-nowrap active:opacity-50"
          >
            İzin Ver
          </button>
        </div>
      )}

      {/* Current Weather Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-br ${getWeatherBackground(weather.current.weather_code)} rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden transition-colors duration-1000`}
      >
        {renderWeatherAnimation(weather.current.weather_code)}
        
        <div className="relative z-10">
          <h2 className="text-[15px] font-bold uppercase tracking-wider opacity-70 mb-1">Şu Anki Hava Durumu</h2>
          <div className="flex items-end gap-4 mb-8">
            <span className="text-8xl font-bold tracking-tighter">{Math.round(weather.current.temperature_2m)}°</span>
            <div className="mb-3">
              <p className="text-[17px] font-semibold opacity-90">Hissedilen: {Math.round(weather.current.apparent_temperature)}°</p>
              <p className="text-[14px] opacity-70">{getDisplayCityName()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 bg-white/20 p-5 rounded-3xl backdrop-blur-md border border-white/20 shadow-lg">
            <div className="flex flex-col items-center">
              <Wind size={20} className="mb-1 opacity-90" />
              <span className="text-[15px] font-bold">{weather.current.wind_speed_10m}</span>
              <span className="text-[11px] font-medium opacity-70 uppercase tracking-wider">km/s</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/20">
              <Droplets size={20} className="mb-1 opacity-90" />
              <span className="text-[15px] font-bold">{weather.current.relative_humidity_2m}%</span>
              <span className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Nem</span>
            </div>
            <div className="flex flex-col items-center">
              <Sun size={20} className="mb-1 opacity-90" />
              <span className="text-[15px] font-bold">{weather.daily.uv_index_max[0]}</span>
              <span className="text-[11px] font-medium opacity-70 uppercase tracking-wider">UV</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-widest font-black opacity-60">
            <div className="flex items-center gap-1">
              {notificationPermission === 'granted' ? <Bell size={12} /> : <BellOff size={12} />}
              <span>Bildirimler: {notificationPermission === 'granted' ? 'Açık' : 'Kapalı'}</span>
            </div>
            <div>
              Mod: {darkMode ? 'Gece (Pasif)' : 'Gündüz (Aktif)'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hourly Forecast */}
      <div className="ios-list p-5">
        <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 ml-1">Saatlik Tahmin</h3>
        <div className="flex overflow-x-auto hide-scrollbar gap-6 pb-2">
          {weather.hourly.time.slice(0, 24).map((time: string, i: number) => {
            if (new Date(time) < new Date()) return null;
            return (
              <div key={time} className="flex flex-col items-center min-w-[50px]">
                <span className="text-[12px] font-semibold text-gray-400 mb-3">{new Date(time).getHours()}:00</span>
                {getWeatherIcon(weather.hourly.weather_code[i], 32)}
                <span className="text-[16px] font-bold text-black dark:text-white mt-3">{Math.round(weather.hourly.temperature_2m[i])}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="ios-list p-5">
        <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 ml-1">7 Günlük Tahmin</h3>
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {weather.daily.time.map((time: string, i: number) => (
            <div key={time} className="flex items-center justify-between py-4">
              <span className="w-24 text-[16px] font-semibold text-black dark:text-white">
                {i === 0 ? 'Bugün' : new Date(time).toLocaleDateString('tr-TR', { weekday: 'long' })}
              </span>
              <div className="flex items-center justify-center">
                {getWeatherIcon(weather.daily.weather_code[i], 28)}
              </div>
              <div className="flex items-center gap-4 w-24 justify-end">
                <span className="text-[16px] font-bold text-black dark:text-white">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                <span className="text-[16px] font-semibold text-gray-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-black dark:text-white">Şehir Ekle</h3>
              <button onClick={() => setShowCityModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="Şehir adı yazın..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={searchQuery}
                onChange={(e) => searchCities(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {isSearching ? (
                <div className="text-center py-4 text-gray-500 text-sm">Aranıyor...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result: any) => (
                  <button
                    key={result.id}
                    onClick={() => handleAddCity(result)}
                    className="w-full text-left p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex flex-col"
                  >
                    <span className="font-bold text-black dark:text-white">{result.name}</span>
                    <span className="text-xs text-gray-500">{result.admin1 ? `${result.admin1}, ` : ''}{result.country}</span>
                  </button>
                ))
              ) : searchQuery.length >= 3 ? (
                <div className="text-center py-4 text-gray-500 text-sm">Sonuç bulunamadı.</div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">Aramak için en az 3 harf yazın.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

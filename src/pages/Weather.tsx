import React, { useState, useEffect } from 'react';
import { Cloud, Droplets, Wind, Sun, Thermometer, CloudRain, CloudLightning, CloudSnow } from 'lucide-react';

export default function Weather() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        fetchWeather(39.9208, 32.8541); // Default Ankara
      }
    );
  }, []);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`);
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getWeatherIcon = (code: number, size = 24) => {
    if (code <= 1) return <Sun size={size} className="text-yellow-400" />;
    if (code <= 3) return <Cloud size={size} className="text-gray-400" />;
    if (code <= 67) return <CloudRain size={size} className="text-blue-400" />;
    if (code <= 77) return <CloudSnow size={size} className="text-blue-200" />;
    if (code <= 99) return <CloudLightning size={size} className="text-purple-400" />;
    return <Cloud size={size} className="text-gray-400" />;
  };

  if (loading) return <div className="text-center py-10">Hava durumu yükleniyor...</div>;
  if (!weather) return <div className="text-center py-10 text-red-500">Hava durumu alınamadı.</div>;

  return (
    <div className="space-y-6 pb-10">
      {/* Current Weather Hero */}
      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-20 transform translate-x-10 -translate-y-10">
          {getWeatherIcon(weather.current.weather_code, 200)}
        </div>
        <div className="relative z-10">
          <h2 className="text-lg font-medium opacity-90 mb-1">Şu Anki Hava Durumu</h2>
          <div className="flex items-end gap-4 mb-6">
            <span className="text-7xl font-bold">{Math.round(weather.current.temperature_2m)}°</span>
            <span className="text-xl mb-2 opacity-90">Hissedilen: {Math.round(weather.current.apparent_temperature)}°</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <Wind size={20} className="mb-1 opacity-80" />
              <span className="text-sm font-bold">{weather.current.wind_speed_10m} km/s</span>
              <span className="text-xs opacity-80">Rüzgar</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/20">
              <Droplets size={20} className="mb-1 opacity-80" />
              <span className="text-sm font-bold">{weather.current.relative_humidity_2m}%</span>
              <span className="text-xs opacity-80">Nem</span>
            </div>
            <div className="flex flex-col items-center">
              <Sun size={20} className="mb-1 opacity-80" />
              <span className="text-sm font-bold">{weather.daily.uv_index_max[0]}</span>
              <span className="text-xs opacity-80">UV İndeksi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Forecast */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">Saatlik Tahmin</h3>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2">
          {weather.hourly.time.slice(0, 24).map((time: string, i: number) => {
            // Only show future hours
            if (new Date(time) < new Date()) return null;
            return (
              <div key={time} className="flex flex-col items-center min-w-[60px]">
                <span className="text-xs text-gray-500 mb-2">{new Date(time).getHours()}:00</span>
                {getWeatherIcon(weather.hourly.weather_code[i], 28)}
                <span className="text-sm font-bold text-gray-800 mt-2">{Math.round(weather.hourly.temperature_2m[i])}°</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4">7 Günlük Tahmin</h3>
        <div className="space-y-4">
          {weather.daily.time.map((time: string, i: number) => (
            <div key={time} className="flex items-center justify-between">
              <span className="w-24 text-sm font-medium text-gray-600">
                {i === 0 ? 'Bugün' : new Date(time).toLocaleDateString('tr-TR', { weekday: 'long' })}
              </span>
              <div className="flex items-center justify-center w-10">
                {getWeatherIcon(weather.daily.weather_code[i], 24)}
              </div>
              <div className="flex items-center gap-3 w-24 justify-end">
                <span className="text-sm font-bold text-gray-800">{Math.round(weather.daily.temperature_2m_max[i])}°</span>
                <span className="text-sm text-gray-400">{Math.round(weather.daily.temperature_2m_min[i])}°</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Radio as RadioIcon, Play, Pause, Search } from 'lucide-react';

const CATEGORIES = ['Tümü', 'Pop', 'Haber', 'Arabesk', 'Spor'];

const STATIONS = [
  { id: '1', name: 'Kral FM', url: 'https://kralfm.radyotvonline.net/kralfm/playlist.m3u8', category: 'Arabesk', color: 'bg-red-500' },
  { id: '2', name: 'Best FM', url: 'http://46.20.7.126/bestfm.mp3', category: 'Pop', color: 'bg-blue-500' },
  { id: '3', name: 'Alem FM', url: 'http://scturkmedya.radyotvonline.com/stream/80/', category: 'Pop', color: 'bg-orange-500' },
  { id: '4', name: 'TRT FM', url: 'https://trtcanlifm-s3.mncdn.com/trtfm/trtfm.stream/playlist.m3u8', category: 'Pop', color: 'bg-green-600' },
  { id: '5', name: 'TRT Haber Radyo', url: 'https://trtcanlifm-s3.mncdn.com/trthaber/trthaber.stream/playlist.m3u8', category: 'Haber', color: 'bg-blue-800' },
  { id: '6', name: 'TRT Radyo 1', url: 'https://trtcanlifm-s3.mncdn.com/trtradyo1/radyo1.stream/playlist.m3u8', category: 'Haber', color: 'bg-indigo-800' },
  { id: '7', name: 'NTV Radyo', url: 'http://ntvradyo.radyotvonline.com/ntvradyo/playlist.m3u8', category: 'Haber', color: 'bg-blue-600' },
  { id: '8', name: 'TRT Türkü', url: 'https://trtcanlifm-s3.mncdn.com/trtturku/trtturku.stream/playlist.m3u8', category: 'Arabesk', color: 'bg-red-700' },
  { id: '9', name: 'Radyo Spor', url: 'https://radyospor.radyotvonline.net/radyospor/playlist.m3u8', category: 'Spor', color: 'bg-orange-600' },
  { id: '10', name: 'Lig Radyo', url: 'https://ligradyo.radyotvonline.net/ligradyo/playlist.m3u8', category: 'Spor', color: 'bg-green-700' },
];

export default function Radio() {
  const { currentStation, isPlaying, setCurrentStation, setIsPlaying } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [search, setSearch] = useState('');

  const filteredStations = STATIONS.filter(s => 
    (activeCategory === 'Tümü' || s.category === activeCategory) &&
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlay = (station: any) => {
    if (currentStation?.id === station.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentStation(station);
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Radyo ara..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex overflow-x-auto hide-scrollbar gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-medium transition-colors ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 px-2">
        {filteredStations.map(station => {
          const isActive = currentStation?.id === station.id;
          return (
            <div 
              key={station.id}
              onClick={() => handlePlay(station)}
              className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${isActive ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'border-gray-100 dark:border-gray-700'}`}
            >
              <div className={`w-full aspect-square rounded-xl flex items-center justify-center mb-3 relative overflow-hidden ${station.color}`}>
                <RadioIcon size={40} className="text-white opacity-80" />
                {isActive && isPlaying && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
                    <div className="flex gap-1 items-end h-8">
                      <div className="w-1.5 bg-white animate-bounce" style={{animationDelay: '0s', height: '100%'}}></div>
                      <div className="w-1.5 bg-white animate-bounce" style={{animationDelay: '0.2s', height: '60%'}}></div>
                      <div className="w-1.5 bg-white animate-bounce" style={{animationDelay: '0.4s', height: '80%'}}></div>
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-center truncate">{station.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">{station.category}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

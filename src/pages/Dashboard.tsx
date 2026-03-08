import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, Radio, Cloud, Calendar, FileText, QrCode, 
  Gamepad2, Settings, BarChart2, MessageSquare, Newspaper, 
  Bell, Bot, Moon, Sun, ChevronRight, Clock, Sparkles, RefreshCw, ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

const modules = [
  { path: '/assistant', label: 'Yapay Zeka', icon: Bot, color: 'from-purple-500 to-indigo-600', shadow: 'shadow-purple-500/20' },
  { path: '/news', label: 'Haberler', icon: Newspaper, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
  { path: '/personnel', label: 'Personel', icon: Users, color: 'from-blue-500 to-cyan-600', shadow: 'shadow-blue-500/20' },
  { path: '/visitors', label: 'Ziyaretçiler', icon: UserCheck, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
  { path: '/radio', label: 'Radyo', icon: Radio, color: 'from-violet-500 to-purple-600', shadow: 'shadow-violet-500/20' },
  { path: '/weather', label: 'Hava Durumu', icon: Cloud, color: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-500/20' },
  { path: '/calendar', label: 'Vardiya', icon: Calendar, color: 'from-orange-500 to-amber-600', shadow: 'shadow-orange-500/20' },
  { path: '/alarms', label: 'Alarmlar', icon: Bell, color: 'from-yellow-400 to-orange-500', shadow: 'shadow-yellow-500/20' },
  { path: '/notes', label: 'Notlar', icon: FileText, color: 'from-amber-600 to-yellow-700', shadow: 'shadow-amber-600/20' },
  { path: '/scanner', label: 'QR Tarayıcı', icon: QrCode, color: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20' },
  { path: '/reports', label: 'Raporlar', icon: BarChart2, color: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/20' },
  { path: '/chats', label: 'Sohbet', icon: MessageSquare, color: 'from-pink-500 to-rose-600', shadow: 'shadow-pink-500/20' },
  { path: '/games', label: 'Oyunlar', icon: Gamepad2, color: 'from-rose-500 to-red-600', shadow: 'shadow-rose-500/20' },
  { path: '/settings', label: 'Ayarlar', icon: Settings, color: 'from-slate-500 to-gray-600', shadow: 'shadow-slate-500/20' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useAppStore();
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let isMounted = true;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    const fetchNews = async () => {
      if (isMounted) await fetchLatestNews();
    };
    
    fetchNews();
    
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const fetchLatestNews = async () => {
    setLoadingNews(true);
    try {
      const sources = [
        { label: 'TRT Haber', url: 'https://www.trthaber.com/manset_articles.rss' },
        { label: 'NTV', url: 'https://www.ntv.com.tr/gundem.rss' },
        { label: 'Habertürk', url: 'https://www.haberturk.com/rss/manset.xml' },
        { label: 'CNN Türk', url: 'https://www.cnnturk.com/feed/rss/all/news' },
        { label: 'Hürriyet', url: 'https://www.hurriyet.com.tr/rss/anasayfa' },
        { label: 'Anadolu Ajansı', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel' },
        { label: 'Sözcü', url: 'https://www.sozcu.com.tr/feeds-son-dakika' },
        { label: 'Sabah', url: 'https://www.sabah.com.tr/rss/anasayfa.xml' }
      ];

      for (const source of sources) {
        try {
          console.log(`Trying news source: ${source.label}`);
          // Try RSS2JSON
          const rssUrl = encodeURIComponent(source.url);
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=3`);
          const data = await response.json();
          
          if (data.status === 'ok' && data.items && data.items.length > 0) {
            const validItems = data.items.filter((item: any) => item && (item.title || item.description));
            if (validItems.length > 0) {
              setLatestNews(validItems.slice(0, 3).map((item: any) => ({ ...item, sourceLabel: source.label })));
              setLoadingNews(false);
              return;
            }
          }

          // Small delay before fallback
          await new Promise(resolve => setTimeout(resolve, 500));

          // Try FactMaven fallback for this source
          const fallbackResponse = await fetch(`https://api.factmaven.com/xml-to-json/?xml=${source.url}`);
          const fallbackData = await fallbackResponse.json();
          const items = fallbackData.rss?.channel?.item || fallbackData.feed?.entry || [];
          const normalizedItems = (Array.isArray(items) ? items : [items]).filter(item => item && (item.title || item.description));
          
          if (normalizedItems.length > 0) {
            setLatestNews(normalizedItems.slice(0, 3).map((item: any) => {
              // Extract thumbnail from various possible fields
              const thumbnail = 
                item['media:content']?.['@attributes']?.url || 
                item.enclosure?.['@attributes']?.url || 
                item.thumbnail || 
                item.image || 
                '';
                
              return {
                title: item.title || '',
                link: item.link || '',
                pubDate: item.pubDate || item.published || new Date().toISOString(),
                thumbnail,
                sourceLabel: source.label
              };
            }));
            setLoadingNews(false);
            return;
          }

          // Third Fallback: AllOrigins + DOMParser
          try {
            const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const aoResponse = await fetch(allOriginsUrl);
            const aoData = await aoResponse.json();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(aoData.contents, "text/xml");
            const items = xmlDoc.querySelectorAll("item, entry");
            
            if (items.length > 0) {
              const parsedItems = Array.from(items).slice(0, 3).map(item => {
                const title = item.querySelector("title")?.textContent || '';
                const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
                const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
                const description = item.querySelector("description, summary")?.textContent || '';
                
                return {
                  title,
                  link,
                  pubDate,
                  description,
                  sourceLabel: source.label
                };
              });

              if (parsedItems.length > 0) {
                setLatestNews(parsedItems);
                setLoadingNews(false);
                return;
              }
            }
          } catch (aoErr) {
            console.warn(`AllOrigins fallback failed for ${source.label}`);
          }

          // Fourth Fallback: CodeTabs Proxy + DOMParser
          try {
            const codeTabsUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(source.url)}`;
            const ctResponse = await fetch(codeTabsUrl);
            const ctText = await ctResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(ctText, "text/xml");
            const items = xmlDoc.querySelectorAll("item, entry");
            
            if (items.length > 0) {
              const parsedItems = Array.from(items).slice(0, 3).map(item => {
                const title = item.querySelector("title")?.textContent || '';
                const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
                const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
                
                return {
                  title,
                  link,
                  pubDate,
                  sourceLabel: source.label
                };
              });

              if (parsedItems.length > 0) {
                setLatestNews(parsedItems);
                setLoadingNews(false);
                return;
              }
            }
          } catch (ctErr) {
            console.warn(`CodeTabs fallback failed for ${source.label}`);
          }

          // Fifth Fallback: AllOrigins (JSON) + Manual Parsing
          try {
            const allOriginsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const aoResponse = await fetch(allOriginsUrl);
            const aoData = await aoResponse.json();
            const contents = aoData.contents;
            
            // Very basic regex-based XML parsing as a last resort
            const items = contents.match(/<item>([\s\S]*?)<\/item>/g) || contents.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
            
            if (items.length > 0) {
              const parsedItems = items.slice(0, 3).map((item: string) => {
                const titleMatch = item.match(/<title>(.*?)<\/title>/);
                const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<link href="(.*?)"/);
                const pubDateMatch = item.match(/<(pubDate|published|updated)>(.*?)<\/\1>/);
                
                return {
                  title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Haber',
                  link: linkMatch ? linkMatch[1] : '',
                  pubDate: pubDateMatch ? pubDateMatch[2] : new Date().toISOString(),
                  sourceLabel: source.label
                };
              });

              if (parsedItems.length > 0) {
                setLatestNews(parsedItems);
                setLoadingNews(false);
                return;
              }
            }
          } catch (aoJsonErr) {
            console.warn(`AllOrigins JSON fallback failed for ${source.label}`);
          }

          // Sixth Fallback: CORSProxy.io + DOMParser
          try {
            const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(source.url)}`;
            const cpResponse = await fetch(corsProxyUrl);
            const cpText = await cpResponse.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(cpText, "text/xml");
            const items = xmlDoc.querySelectorAll("item, entry");
            
            if (items.length > 0) {
              const parsedItems = Array.from(items).slice(0, 3).map(item => {
                const title = item.querySelector("title")?.textContent || '';
                const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
                const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
                
                return {
                  title,
                  link,
                  pubDate,
                  sourceLabel: source.label
                };
              });

              if (parsedItems.length > 0) {
                setLatestNews(parsedItems);
                setLoadingNews(false);
                return;
              }
            }
          } catch (cpErr) {
            console.warn(`CORSProxy fallback failed for ${source.label}`);
          }

          // Seventh Fallback: Direct Fetch (CORS permitting)
          try {
            const response = await fetch(source.url);
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const items = xmlDoc.querySelectorAll("item, entry");
            
            if (items.length > 0) {
              const parsedItems = Array.from(items).slice(0, 3).map(item => {
                const title = item.querySelector("title")?.textContent || '';
                const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
                const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
                
                return {
                  title,
                  link,
                  pubDate,
                  sourceLabel: source.label
                };
              });

              if (parsedItems.length > 0) {
                setLatestNews(parsedItems);
                setLoadingNews(false);
                return;
              }
            }
          } catch (directErr) {
            console.warn(`Direct fetch failed for ${source.label}`);
          }
        } catch (err) {
          console.warn(`Failed to fetch from ${source.label}, trying next...`);
        }
      }
    } catch (err) {
      console.error('General news fetch error:', err);
    } finally {
      setLoadingNews(false);
    }
    
    // If we reached here, it means all sources failed
    setLatestNews([]);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6 pb-24"
    >
      {/* Welcome Card */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-500/20 text-white"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 mb-3"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Güvenlik Operasyonları</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">Hoş Geldiniz</h2>
            <p className="text-blue-100 text-lg opacity-90 max-w-md leading-relaxed">Tüm güvenlik operasyonlarını tek bir akıllı merkezden yönetin.</p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-5xl font-mono font-black tracking-tighter mb-1">
              {currentTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-blue-100 font-bold opacity-80 text-sm uppercase tracking-widest">
              {currentTime.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-[80px]" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* News Widget */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-3 text-lg uppercase tracking-tight">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <Newspaper size={20} className="text-red-500" />
              </div>
              Son Haberler
            </h3>
            <button 
              onClick={fetchLatestNews}
              className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all ${loadingNews ? 'animate-spin' : ''}`}
            >
              <RefreshCw size={20} className="text-gray-400" />
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <AnimatePresence mode="wait">
              {loadingNews ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 text-center"
                >
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Haberler yükleniyor...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="divide-y divide-gray-100 dark:divide-gray-700"
                >
                  {latestNews.length > 0 ? (
                    latestNews.map((newsItem, i) => (
                      <Link 
                        key={i} 
                        to="/news" 
                        className="p-5 flex gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group relative overflow-hidden"
                      >
                        <div className="flex-1 min-w-0 relative z-10">
                          <p className="text-base font-bold text-gray-800 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
                            {newsItem.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 font-bold">
                            <div className="flex items-center gap-1">
                              <Clock size={14} /> 
                              {new Date(newsItem.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="uppercase tracking-wider">{newsItem.sourceLabel || 'Haber'}</span>
                          </div>
                        </div>
                        {newsItem.thumbnail && (
                          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border-2 border-white dark:border-gray-700 relative z-10">
                            <img 
                              src={newsItem.thumbnail} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        )}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                      </Link>
                    ))
                  ) : (
                    <div className="p-12 text-center text-gray-400">
                      <p className="text-sm font-bold uppercase tracking-widest">Haber bulunamadı.</p>
                      <button 
                        onClick={fetchLatestNews}
                        className="mt-4 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest hover:underline"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Theme Toggle & Stats */}
        <motion.div 
          variants={itemVariants}
          className="flex flex-col gap-6"
        >
          <button 
            onClick={toggleDarkMode}
            className="flex-1 flex flex-col justify-between p-6 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 active:scale-95 transition-all group relative overflow-hidden"
          >
            <div className="flex items-center justify-between w-full mb-8">
              <div className={`p-4 rounded-[1.5rem] transition-all duration-700 shadow-lg ${darkMode ? 'bg-indigo-900/50 text-indigo-400 rotate-180 shadow-indigo-500/20' : 'bg-amber-100 text-amber-600 shadow-amber-500/20'}`}>
                {darkMode ? <Moon size={28} /> : <Sun size={28} />}
              </div>
              <div className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${darkMode ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <div 
                  className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-500 ${darkMode ? 'translate-x-7' : 'translate-x-0'}`}
                />
              </div>
            </div>
            <div className="text-left">
              <p className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{darkMode ? 'Gece Modu' : 'Gündüz Modu'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">Sistem görünümünü değiştir.</p>
            </div>
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-indigo-500' : 'bg-amber-500'}`} />
          </button>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">24°C</p>
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mt-1">Hava</p>
              </div>
              <div className="flex-1 text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">12</p>
                <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mt-1">Personel</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div 
              key={mod.path}
              variants={itemVariants}
            >
              <Link
                to={mod.path}
                className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg shadow-gray-100 dark:shadow-none border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-2 transition-all active:scale-95 overflow-hidden"
              >
                {/* Background Glow */}
                <div className={`absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`} />
                
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-20 h-20 bg-gradient-to-br ${mod.color} text-white rounded-[1.5rem] flex items-center justify-center mb-5 shadow-xl ${mod.shadow} transition-transform duration-300`}
                >
                  <Icon size={36} strokeWidth={2.5} />
                </motion.div>
                <span className="text-sm font-black text-gray-800 dark:text-gray-100 text-center uppercase tracking-[0.15em]">{mod.label}</span>
                
                {/* Hover Indicator */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-br ${mod.color} opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_currentColor]`} />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

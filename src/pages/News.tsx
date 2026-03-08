import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, X, Globe, Shield, ChevronRight } from 'lucide-react';

const SOURCES = [
  { id: 'trt', label: 'TRT Haber', url: 'https://www.trthaber.com/manset_articles.rss', color: 'bg-red-600' },
  { id: 'ntv', label: 'NTV', url: 'https://www.ntv.com.tr/gundem.rss', color: 'bg-yellow-600' },
  { id: 'haberturk', label: 'Habertürk', url: 'https://www.haberturk.com/rss/manset.xml', color: 'bg-blue-800' },
  { id: 'cnnturk', label: 'CNN Türk', url: 'https://www.cnnturk.com/feed/rss/all/news', color: 'bg-red-700' },
  { id: 'hurriyet', label: 'Hürriyet', url: 'https://www.hurriyet.com.tr/rss/anasayfa', color: 'bg-red-500' },
  { id: 'milliyet', label: 'Milliyet', url: 'https://www.milliyet.com.tr/rss/rss-liste/son-dakika-haberleri.xml', color: 'bg-black' },
  { id: 'aa', label: 'Anadolu Ajansı', url: 'https://www.aa.com.tr/tr/rss/default?cat=guncel', color: 'bg-blue-600' },
  { id: 'sozcu', label: 'Sözcü', url: 'https://www.sozcu.com.tr/feeds-son-dakika', color: 'bg-red-700' },
  { id: 'sabah', label: 'Sabah', url: 'https://www.sabah.com.tr/rss/anasayfa.xml', color: 'bg-yellow-500' }
];

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [showFullSource, setShowFullSource] = useState(false);

  const fetchAllNews = async () => {
    setLoading(true);
    setShowFullSource(false);
    
    try {
      const fetchPromises = SOURCES.map(async (source) => {
        // Try RSS2JSON first
        try {
          const rssUrl = encodeURIComponent(source.url);
          const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}&count=15`);
          const data = await response.json();
          
          if (data.status === 'ok' && data.items && data.items.length > 0) {
            const validItems = data.items.filter((item: any) => item && (item.title || item.description));
            if (validItems.length > 0) {
              return validItems.map((item: any) => ({
                ...item,
                sourceLabel: source.label,
                sourceColor: source.color,
                pubDate: item.pubDate || new Date().toISOString()
              }));
            }
          }
        } catch (err) {
          console.warn(`RSS2JSON failed for ${source.label}, trying fallback...`);
        }

        // Fallback to FactMaven
        try {
          const response = await fetch(`https://api.factmaven.com/xml-to-json/?xml=${source.url}`);
          const data = await response.json();
          const items = data.rss?.channel?.item || data.feed?.entry || [];
          const normalizedItems = (Array.isArray(items) ? items : [items]).filter(item => item && (item.title || item.description));
          
          if (normalizedItems.length > 0) {
            return normalizedItems.slice(0, 15).map((item: any) => ({
              title: item.title || '',
              link: item.link || '',
              pubDate: item.pubDate || item.published || new Date().toISOString(),
              description: item.description || item.summary || '',
              thumbnail: item['media:content']?.['@attributes']?.url || item.enclosure?.['@attributes']?.url || item.thumbnail || item.image || '',
              sourceLabel: source.label,
              sourceColor: source.color
            }));
          }
        } catch (err) {
          console.warn(`FactMaven failed for ${source.label}`);
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
            const parsedItems = Array.from(items).slice(0, 15).map(item => {
              const title = item.querySelector("title")?.textContent || '';
              const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
              const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
              const description = item.querySelector("description, summary")?.textContent || '';
              
              return {
                title,
                link,
                pubDate,
                description,
                sourceLabel: source.label,
                sourceColor: source.color
              };
            });

            if (parsedItems.length > 0) {
              return parsedItems;
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
            const parsedItems = Array.from(items).slice(0, 15).map(item => {
              const title = item.querySelector("title")?.textContent || '';
              const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
              const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
              const description = item.querySelector("description, summary")?.textContent || '';
              
              return {
                title,
                link,
                pubDate,
                description,
                sourceLabel: source.label,
                sourceColor: source.color
              };
            });

            if (parsedItems.length > 0) {
              return parsedItems;
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
          
          const items = contents.match(/<item>([\s\S]*?)<\/item>/g) || contents.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
          
          if (items.length > 0) {
            const parsedItems = items.slice(0, 15).map((item: string) => {
              const titleMatch = item.match(/<title>(.*?)<\/title>/);
              const linkMatch = item.match(/<link>(.*?)<\/link>/) || item.match(/<link href="(.*?)"/);
              const pubDateMatch = item.match(/<(pubDate|published|updated)>(.*?)<\/\1>/);
              const descMatch = item.match(/<(description|summary)>(.*?)<\/\1>/);
              
              return {
                title: titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : 'Haber',
                link: linkMatch ? linkMatch[1] : '',
                pubDate: pubDateMatch ? pubDateMatch[2] : new Date().toISOString(),
                description: descMatch ? descMatch[2].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '',
                sourceLabel: source.label,
                sourceColor: source.color
              };
            });

            if (parsedItems.length > 0) {
              return parsedItems;
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
            const parsedItems = Array.from(items).slice(0, 15).map(item => {
              const title = item.querySelector("title")?.textContent || '';
              const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
              const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
              const description = item.querySelector("description, summary")?.textContent || '';
              
              return {
                title,
                link,
                pubDate,
                description,
                sourceLabel: source.label,
                sourceColor: source.color
              };
            });

            if (parsedItems.length > 0) {
              return parsedItems;
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
            const parsedItems = Array.from(items).slice(0, 15).map(item => {
              const title = item.querySelector("title")?.textContent || '';
              const link = item.querySelector("link")?.textContent || item.querySelector("link")?.getAttribute("href") || '';
              const pubDate = item.querySelector("pubDate, published, updated")?.textContent || new Date().toISOString();
              const description = item.querySelector("description, summary")?.textContent || '';
              
              return {
                title,
                link,
                pubDate,
                description,
                sourceLabel: source.label,
                sourceColor: source.color
              };
            });

            if (parsedItems.length > 0) {
              return parsedItems;
            }
          }
        } catch (directErr) {
          console.warn(`Direct fetch failed for ${source.label}`);
        }
        
        return [];
      });

      const results = await Promise.allSettled(fetchPromises);
      const allItems = results
        .filter((result): result is PromiseFulfilledResult<any[]> => result.status === 'fulfilled')
        .flatMap(result => result.value);

      if (allItems.length > 0) {
        // Sort by pubDate descending
        const sortedItems = allItems.sort((a, b) => {
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });
        setNews(sortedItems);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('General news fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNews();
  }, []);

  const closeReader = () => {
    setSelectedNews(null);
    setShowFullSource(false);
  };

  return (
    <div className="space-y-4 pb-10 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Newspaper className="text-blue-600" /> Son Dakika
            </h2>
            {lastUpdate && (
              <span className="text-[10px] text-gray-400 font-medium">
                Son Güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
              </span>
            )}
          </div>
          <button 
            onClick={fetchAllNews}
            disabled={loading}
            className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Globe size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
            <Shield size={12} /> Reklam Engelleyici
          </div>
          {SOURCES.map(s => (
            <div key={s.id} className="flex items-center gap-1 text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${s.color}`}></span>
              {s.label}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4">
        {loading && news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 dark:border-gray-800 rounded-full"></div>
              <div className="absolute top-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-gray-800 dark:text-white font-bold text-lg">Haberler Yükleniyor</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">7 farklı kaynak taranıyor...</p>
            </div>
          </div>
        ) : news.length > 0 ? (
          news.map((item, i) => (
            <div 
              key={i} 
              onClick={() => setSelectedNews(item)} 
              className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row"
            >
              {item.thumbnail || item.enclosure?.link ? (
                <div className="sm:w-48 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                  <img 
                    src={item.thumbnail || item.enclosure?.link} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              ) : (
                <div className="sm:w-48 h-48 sm:h-auto bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                  <Newspaper size={40} />
                </div>
              )}
              <div className="p-5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${item.sourceColor}`}></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sourceLabel}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-snug mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-3">
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[10px]">•</span>
                    <span className="text-[10px]">{new Date(item.pubDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1">
                    Oku <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <Newspaper size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-800 dark:text-white font-bold mb-1">Haberlere Erişilemiyor</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">İnternet bağlantınızı kontrol edin veya tekrar deneyin.</p>
            <button 
              onClick={fetchAllNews} 
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
            >
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      {/* Internal Reader Mode (The "App Browser" with Ad-Blocking) */}
      {selectedNews && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full h-full sm:max-w-4xl sm:h-[95vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header / Toolbar */}
            <div className="bg-white dark:bg-gray-800 p-4 border-b dark:border-gray-700 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeReader}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 uppercase">
                    <Shield size={10} /> {showFullSource ? 'Dahili Tarayıcı' : 'Güvenli Okuma Modu'}
                  </span>
                  <span className="text-xs font-medium text-gray-400 truncate max-w-[150px] sm:max-w-[300px]">
                    {selectedNews.link}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {showFullSource ? (
                  <button 
                    onClick={() => setShowFullSource(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Okuma Moduna Dön
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowFullSource(true)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                    title="Tam Sayfayı Uygulama İçinde Aç"
                  >
                    <Globe size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 relative">
              {showFullSource ? (
                <div className="w-full h-full flex flex-col">
                  <iframe 
                    src={selectedNews.link} 
                    className="w-full h-full border-none"
                    title="Haber Kaynağı"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                  />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-[10px] font-medium backdrop-blur-md pointer-events-none">
                    Bazı siteler güvenlik nedeniyle uygulama içinde açılmayabilir.
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto">
                  {selectedNews.thumbnail || selectedNews.enclosure?.link ? (
                    <div className="w-full h-64 sm:h-80 overflow-hidden">
                      <img 
                        src={selectedNews.thumbnail || selectedNews.enclosure?.link} 
                        alt={selectedNews.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </div>
                  ) : null}
                  
                  <div className="p-6 sm:p-10 max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold text-white ${selectedNews.sourceColor}`}>
                        {selectedNews.sourceLabel}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={14} /> {new Date(selectedNews.pubDate).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                      {selectedNews.title}
                    </h1>
                    
                    <div 
                      className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: selectedNews.content || selectedNews.description }}
                    />

                    <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Haberin tamamını ve orijinal sayfa yapısını uygulama içinde görüntüleyebilirsiniz.
                      </p>
                      <button 
                        onClick={() => setShowFullSource(true)}
                        className="inline-flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                      >
                        <Globe size={18} /> Kaynağı Uygulama İçinde Aç
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

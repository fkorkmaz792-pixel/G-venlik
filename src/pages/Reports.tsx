import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Download, MessageCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Reports() {
  const { personnel, visitors } = useAppStore();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, [personnel, visitors]);

  const loadStats = () => {
    try {
      // Weekly Visitors
      const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'yyyy-MM-dd');
      });

      const chartData = last7Days.map(dateStr => {
        const count = visitors.filter((v: any) => v.entryTime.startsWith(dateStr)).length;
        return {
          name: format(new Date(dateStr), 'EEE', { locale: tr }),
          Ziyaretçi: count
        };
      });
      setWeeklyData(chartData);

      // Personnel Types
      const yemekhane = personnel.filter((p: any) => p.type === 'yemekhane').length;
      const yurt = personnel.filter((p: any) => p.type === 'yurt').length;
      setTypeData([
        { name: 'Yemekhane', value: yemekhane },
        { name: 'Yurt', value: yurt }
      ]);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleExport = () => {
    alert('PDF/Excel dışa aktarma işlemi başlatılıyor...');
  };

  const handleWhatsAppShare = () => {
    const today = format(new Date(), 'dd MMMM yyyy', { locale: tr });
    const dailyVisitors = visitors.filter((v: any) => v.entryTime.startsWith(format(new Date(), 'yyyy-MM-dd'))).length;
    const yemekhane = personnel.filter((p: any) => p.type === 'yemekhane').length;
    const yurt = personnel.filter((p: any) => p.type === 'yurt').length;

    const message = `📊 *GÜNLÜK RAPOR - ${today}*\n\n` +
      `👥 *Ziyaretçi Trafiği:* today ${dailyVisitors} yeni giriş yapıldı.\n` +
      `🏢 *Personel Dağılımı:*\n` +
      `  • Yemekhane: ${yemekhane} kişi\n` +
      `  • Yurt: ${yurt} kişi\n\n` +
      `📱 _Güvenlik Asistanı tarafından oluşturuldu._`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile 
      ? `whatsapp://send?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6 pt-4 md:pt-8">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-[24px] font-bold text-black dark:text-white">Raporlar</h2>
        <div className="flex gap-2">
          <button onClick={handleWhatsAppShare} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-[13px] font-bold active:opacity-50 shadow-lg shadow-emerald-500/20">
            <MessageCircle size={16} /> Paylaş
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-[13px] font-bold active:opacity-50 shadow-lg shadow-blue-500/20">
            <Download size={16} /> Dışa Aktar
          </button>
        </div>
      </div>

      <div className="ios-list p-6">
        <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6 ml-1">Son 7 Gün Ziyaretçi Grafiği</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
              <XAxis dataKey="name" tick={{fontSize: 11, fontWeight: 600, fill: '#9ca3af'}} axisLine={false} tickLine={false} dy={10} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                cursor={{fill: '#00000005'}} 
              />
              <Bar dataKey="Ziyaretçi" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="ios-list p-6">
        <h3 className="text-[13px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6 ml-1">Personel Dağılımı</h3>
        <div className="h-64 w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={8}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

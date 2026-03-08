import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Download, LogIn, BarChart2 } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Reports() {
  const { user, login } = useAuth();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mb-4">
          <BarChart2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Raporları görüntülemek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const loadStats = async () => {
    try {
      const visitorsSnap = await getDocs(collection(db, 'visitors'));
      const personnelSnap = await getDocs(collection(db, 'personnel'));
      
      const visitors = visitorsSnap.docs.map(d => d.data());
      const personnel = personnelSnap.docs.map(d => d.data());

      // Weekly Visitors
      const last7Days = Array.from({length: 7}).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'yyyy-MM-dd');
      });

      const chartData = last7Days.map(dateStr => {
        const count = visitors.filter((v: any) => v.entryTime.startsWith(dateStr)).length;
        return {
          name: format(new Date(dateStr), 'EEEE', { locale: tr }),
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Raporlar</h2>
        <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Download size={18} /> Dışa Aktar
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Son 7 Gün Ziyaretçi Grafiği</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis allowDecimals={false} />
              <Tooltip cursor={{fill: '#f3f4f6'}} />
              <Legend />
              <Bar dataKey="Ziyaretçi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Personel Dağılımı</h3>
        <div className="h-64 w-full flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

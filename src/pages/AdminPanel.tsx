import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { ShieldAlert, Users, Activity, Lock, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser;
      if (user && user.email?.toLowerCase() === 'fkorkmaz703@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    };

    // Check immediately
    checkAuth();

    // Also listen for changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email?.toLowerCase() === 'fkorkmaz703@gmail.com') {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        // Redirect unauthorized users
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="space-y-6 pb-20 pt-4 md:pt-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Yönetici Paneli
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Hoş geldin Fatih. Sadece sana özel yönetim alanı.
          </p>
        </div>
        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
          <ShieldAlert className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Sistem Kullanıcıları</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Uygulamayı kullanan diğer güvenlik görevlilerinin erişimlerini ve loglarını buradan yönetebilirsin. (Yakında)
          </p>
          <button className="w-full py-2 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            Kullanıcıları Yönet
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Sistem Durumu</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Veritabanı bağlantısı, API durumları ve genel sistem sağlığı göstergeleri. Tüm servisler aktif.
          </p>
          <button className="w-full py-2 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            Detaylı Rapor
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
              <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Veritabanı Yedekleri</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Personel ve ziyaretçi kayıtlarının manuel yedeklerini alabilir veya önceki yedeklere dönebilirsin.
          </p>
          <button className="w-full py-2 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            Yedekleme Yöneticisi
          </button>
        </div>

        <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Güvenlik Ayarları</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Uygulama genelindeki güvenlik politikalarını, oturum sürelerini ve yetkilendirme kurallarını düzenle.
          </p>
          <button className="w-full py-2 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            Güvenlik Politikaları
          </button>
        </div>
      </div>
    </div>
  );
}

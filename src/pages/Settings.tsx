import { useAppStore } from '../store';
import { db } from '../firebase';
import { collection, getDocs, addDoc, writeBatch, doc } from 'firebase/firestore';
import { Moon, Sun, Cloud, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const { user, login, logout } = useAuth();

  const handleBackup = async () => {
    if (!user) return;
    try {
      const personnelSnap = await getDocs(collection(db, 'personnel'));
      const visitorsSnap = await getDocs(collection(db, 'visitors'));
      const notesSnap = await getDocs(collection(db, 'notes'));
      const shiftsSnap = await getDocs(collection(db, 'shifts'));

      const data = {
        personnel: personnelSnap.docs.map(d => d.data()),
        visitors: visitorsSnap.docs.map(d => d.data()),
        notes: notesSnap.docs.map(d => d.data()),
        shifts: shiftsSnap.docs.map(d => d.data())
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `guvenlik_bulut_yedek_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Yedekleme sırasında bir hata oluştu.');
    }
  };

  const handleRestore = () => {
    if (!user) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!confirm('Bulut veritabanına veri eklenecek. Mevcut veriler silinmeyecek, sadece yeniler eklenecektir. Devam etmek istiyor musunuz?')) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          
          const collections = ['personnel', 'visitors', 'notes', 'shifts'];
          for (const colName of collections) {
            if (data[colName] && Array.isArray(data[colName])) {
              for (const item of data[colName]) {
                await addDoc(collection(db, colName), item);
              }
            }
          }
          
          alert('Geri yükleme başarıyla tamamlandı!');
        } catch (err) {
          console.error(err);
          alert('Geri yükleme sırasında bir hata oluştu.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Ayarlar</h2>
        
        <div className="space-y-6">
          {/* Synchronization Section */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${user ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <Cloud size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">Bulut Senkronizasyonu</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user ? 'Verileriniz bulut ile senkronize ediliyor.' : 'Giriş yaparak verilerinizi buluta yedekleyin.'}
                </p>
              </div>
            </div>

            {user ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={logout} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <LogOut size={18} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleBackup} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                    Yedekle
                  </button>
                  <button onClick={handleRestore} className="flex-1 px-4 py-2 border border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                    Geri Yükle
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={login}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <LogIn size={20} /> Google ile Giriş Yap
              </button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Görünüm Modu</h3>
            <div className="flex gap-3">
              <button
                onClick={() => darkMode && toggleDarkMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  !darkMode 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Sun size={20} />
                <span className="font-medium">Gündüz</span>
              </button>
              <button
                onClick={() => !darkMode && toggleDarkMode()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${
                  darkMode 
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <Moon size={20} />
                <span className="font-medium">Gece</span>
              </button>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hakkında</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheck size={16} className="text-blue-500" />
              <p>Güvenlik Asistanı V2 (PWA Sürümü)<br/>Geliştirici: AI Studio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

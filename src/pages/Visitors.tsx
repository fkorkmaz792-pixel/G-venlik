import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, Search, Trash2, LogOut, MessageCircle, DoorOpen, LogIn, UserCheck } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

export default function Visitors() {
  const { user, login } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', tc: '', company: '', plate: '', material: '', fromPlace: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cGatePopup, setCGatePopup] = useState<string | null>(null);
  const [wpModal, setWpModal] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'visitors'), orderBy('entryTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVisitors(all);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
          <UserCheck size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Ziyaretçi verilerini bulut üzerinden senkronize etmek ve yönetmek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    try {
      await addDoc(collection(db, 'visitors'), {
        ...formData,
        entryTime: new Date().toISOString(),
      });
      setFormData({ name: '', tc: '', company: '', plate: '', material: '', fromPlace: '' });
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding visitor:', error);
    }
  };

  const handleExit = async (visitor: any) => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      try {
        await updateDoc(doc(db, 'visitors', visitor.id), {
          exitTime: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error updating visitor exit:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'visitors', id));
      } catch (error) {
        console.error('Error deleting visitor:', error);
      }
    }
  };

  const handleWhatsAppShare = (v: any, isCGate: boolean) => {
    const parts = [v.name];
    if (v.company) parts.push(v.company);
    if (v.plate) parts.push(v.plate);
    if (v.material) parts.push(v.material);
    if (v.fromPlace) parts.push(v.fromPlace);
    
    let message = `${parts.join(' ')} giriş olacak`;
    if (isCGate) {
      message += ' (C Kapısı)';
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setWpModal(null);
  };

  const handleCGate = (v: any) => {
    setCGatePopup(`${v.name} C kapısından giriş yaptı.`);
    const message = `Ziyaretçi Bilgisi: ${v.name} - C Kapısından giriş yaptı.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(filtered.map(v => v.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkWhatsApp = (action: 'giriş' | 'çıkış') => {
    if (selectedIds.length === 0) return;
    const selectedVisitors = visitors.filter(v => selectedIds.includes(v.id));
    const names = selectedVisitors.map(v => v.name).join(', ');
    
    const message = `${names} ${action}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedIds([]);
  };

  const handleBulkCGate = () => {
    if (selectedIds.length === 0) return;
    const selectedVisitors = visitors.filter(v => selectedIds.includes(v.id));
    const names = selectedVisitors.map(v => v.name).join(', ');
    
    setCGatePopup(`${names} C kapısından giriş yaptı.`);
    const message = `Ziyaretçi Bilgisi: ${names} - C Kapısından giriş yaptı.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedIds([]);
  };

  const filtered = visitors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.tc.includes(search) ||
    v.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="İsim, TC veya Firma ara..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-32">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Kayıt bulunamadı.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map(v => (
              <li 
                key={v.id} 
                className={`p-4 flex flex-col gap-2 hover:bg-gray-50 cursor-pointer transition-colors ${selectedIds.includes(v.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => toggleSelection(v.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-6 h-6 rounded border flex items-center justify-center flex-shrink-0 ${selectedIds.includes(v.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                      {selectedIds.includes(v.id) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{v.name}</p>
                      <p className="text-sm text-gray-600">TC: {v.tc || '-'}</p>
                      <p className="text-sm text-gray-600">Firma: {v.company || '-'}</p>
                      {(v.material || v.fromPlace || v.plate) && (
                        <p className="text-sm text-gray-500 mt-1 flex flex-col gap-0.5">
                          {v.plate && <span>Plaka: {v.plate}</span>}
                          {v.material && <span>Malzeme: {v.material}</span>}
                          {v.fromPlace && <span>Geldiği Yer: {v.fromPlace}</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Giriş: {new Date(v.entryTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                    {v.exitTime ? (
                      <p className="text-red-500 mt-1">Çıkış: {new Date(v.exitTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</p>
                    ) : (
                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">İçeride</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={(e) => { e.stopPropagation(); setWpModal(v); }} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
                    <MessageCircle size={16} /> WhatsApp
                  </button>
                  {!v.exitTime && (
                    <button onClick={(e) => { e.stopPropagation(); handleExit(v); }} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium flex items-center gap-1">
                      <LogOut size={16} /> Çıkış Yap
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Bulk Actions Bottom Bar */}
      {filtered.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 z-20">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-gray-700 max-w-md mx-auto space-y-3">
            <div className="flex gap-2">
              <button 
                onClick={selectAll}
                className="flex-1 py-2 bg-[#1e3a8a] text-white text-sm font-bold rounded flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 border border-white rounded-sm flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                TÜMÜNÜ SEÇ
              </button>
              <button 
                onClick={clearSelection}
                className="flex-1 py-2 bg-gray-700 text-white text-sm font-bold rounded flex items-center justify-center gap-2"
              >
                <div className="w-4 h-4 border border-white rounded-sm"></div>
                TEMİZLE
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleBulkCGate()}
                disabled={selectedIds.length === 0}
                className="flex-1 py-3 bg-blue-600 disabled:bg-gray-400 disabled:opacity-50 text-white font-bold rounded transition-colors flex items-center justify-center gap-1"
              >
                <DoorOpen size={18} /> C KAPISI
              </button>
              <button 
                onClick={() => handleBulkWhatsApp('giriş')}
                disabled={selectedIds.length === 0}
                className="flex-1 py-3 bg-[#059669] disabled:bg-gray-400 disabled:opacity-50 text-white font-bold rounded transition-colors"
              >
                GİRİŞ
              </button>
              <button 
                onClick={() => handleBulkWhatsApp('çıkış')}
                disabled={selectedIds.length === 0}
                className="flex-1 py-3 bg-[#b91c1c] disabled:bg-gray-400 disabled:opacity-50 text-white font-bold rounded transition-colors"
              >
                ÇIKIŞ
              </button>
            </div>
          </div>
        </div>
      )}

      <button 
        onClick={() => setShowAdd(true)}
        className="fixed bottom-48 right-4 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors z-20"
      >
        <Plus size={24} />
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm my-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-[#1e3a8a] dark:text-blue-400">Ziyaretçi Ekle</h3>
            <div className="space-y-4">
              <input required type="text" placeholder="İsim Soyisim" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="text" maxLength={11} placeholder="TC Kimlik" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.tc} onChange={e => setFormData({...formData, tc: e.target.value})} />
              <input type="text" placeholder="Araç Plakası" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
              <input type="text" placeholder="Firma Adı" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              <input type="text" placeholder="Geldiği Yer" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.fromPlace} onChange={e => setFormData({...formData, fromPlace: e.target.value})} />
              <input type="text" placeholder="Malzeme" className="w-full p-2 border-b border-gray-300 dark:border-gray-600 bg-transparent outline-none focus:border-blue-500 transition-colors text-gray-800 dark:text-gray-100 placeholder-gray-400" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
            </div>
            <div className="mt-8 flex flex-col gap-2">
              <button type="submit" className="w-full py-3 bg-[#10b981] hover:bg-[#059669] text-white font-medium rounded transition-colors">KAYDET</button>
              <button type="button" onClick={() => setShowAdd(false)} className="w-full py-3 bg-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium rounded transition-colors">KAPAT</button>
            </div>
          </form>
        </div>
      )}

      {/* WP Modal */}
      {wpModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">WhatsApp Bildirimi</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Ziyaretçi C Kapısından mı giriş yaptı?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleWhatsAppShare(wpModal, true)} 
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
              >
                Evet (C Kapısı)
              </button>
              <button 
                onClick={() => handleWhatsAppShare(wpModal, false)} 
                className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
              >
                Hayır (Normal)
              </button>
            </div>
            <button 
              onClick={() => setWpModal(null)} 
              className="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* C Kapısı Popup */}
      {cGatePopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl transform transition-all">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <DoorOpen size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">C Kapısı Bildirimi</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{cGatePopup}</p>
            <button 
              onClick={() => setCGatePopup(null)} 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

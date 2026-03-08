import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, Search, Trash2, MessageCircle, LogIn, Users } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

export default function Personnel() {
  const { user, login } = useAuth();
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'yemekhane' | 'yurt'>('yemekhane');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'personnel'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonnel(all);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
          <Users size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Personel verilerini bulut üzerinden senkronize etmek ve yönetmek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    try {
      await addDoc(collection(db, 'personnel'), {
        name: newName,
        phone: newPhone,
        type,
        createdAt: new Date().toISOString(),
      });
      setNewName('');
      setNewPhone('');
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding personnel:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'personnel', id));
      } catch (error) {
        console.error('Error deleting personnel:', error);
      }
    }
  };

  const handleWhatsAppShare = (person: any) => {
    let message = '';
    if (person.type === 'yemekhane') {
      message = `${person.name} yemekhane giriş`;
    } else {
      message = `${person.name} giriş`;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const newIds = new Set([...selectedIds, ...filtered.map(p => p.id)]);
    setSelectedIds(Array.from(newIds));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkWhatsApp = (action: 'giriş' | 'çıkış') => {
    if (selectedIds.length === 0) return;
    const selectedPersons = personnel.filter(p => selectedIds.includes(p.id));
    const names = selectedPersons.map(p => p.name).join(', ');
    
    let message = '';
    if (selectedPersons.every(p => p.type === 'yemekhane')) {
      message = `${names} yemekhane ${action}`;
    } else if (selectedPersons.every(p => p.type === 'yurt')) {
      message = `${names} ${action}`;
    } else {
      const yemekhaneNames = selectedPersons.filter(p => p.type === 'yemekhane').map(p => p.name).join(', ');
      const yurtNames = selectedPersons.filter(p => p.type === 'yurt').map(p => p.name).join(', ');
      
      const parts = [];
      if (yemekhaneNames) parts.push(`${yemekhaneNames} yemekhane ${action}`);
      if (yurtNames) parts.push(`${yurtNames} ${action}`);
      message = parts.join(' ve ');
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setSelectedIds([]);
  };

  const filtered = personnel.filter(p => 
    p.type === type && 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-gray-200 rounded-lg">
        <button 
          className={`flex-1 py-2 rounded-md font-medium transition-colors ${type === 'yemekhane' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          onClick={() => setType('yemekhane')}
        >
          Yemekhane
        </button>
        <button 
          className={`flex-1 py-2 rounded-md font-medium transition-colors ${type === 'yurt' ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
          onClick={() => setType('yurt')}
        >
          Yurt
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Personel ara..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-32">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Kayıt bulunamadı.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {filtered.map(p => (
              <li 
                key={p.id} 
                className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors ${selectedIds.includes(p.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                onClick={() => toggleSelection(p.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded border flex items-center justify-center ${selectedIds.includes(p.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                    {selectedIds.includes(p.id) && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{p.phone || 'Telefon yok'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(p); }} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-full" title="WhatsApp ile Bildir">
                    <MessageCircle size={20} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full">
                    <Trash2 size={20} />
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
        className="fixed bottom-48 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors z-20"
      >
        <Plus size={24} />
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Yeni Personel Ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input required type="text" className="w-full p-2 border rounded-lg" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon (Opsiyonel)</label>
                <input type="tel" className="w-full p-2 border rounded-lg" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg text-gray-700">İptal</button>
              <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

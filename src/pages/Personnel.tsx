import React, { useState } from 'react';
import { Plus, Search, Trash2, MessageCircle, Edit2, CheckSquare, Square, ChevronRight, LogOut, X } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../capacitor';

export default function Personnel() {
  const { personnel, addPersonnel, updatePersonnel, deletePersonnel, personnelColumns } = useAppStore();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'yemekhane' | 'yurt'>('yemekhane');
  const [statusFilter, setStatusFilter] = useState<'all' | 'inside' | 'outside'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', phone: '' });

  React.useEffect(() => {
    const handleOpenAdd = () => setShowAdd(true);
    const handleToggleSearch = () => setShowSearch(prev => !prev);
    
    window.addEventListener('open-add-modal', handleOpenAdd);
    window.addEventListener('toggle-search', handleToggleSearch);
    
    return () => {
      window.removeEventListener('open-add-modal', handleOpenAdd);
      window.removeEventListener('toggle-search', handleToggleSearch);
    };
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newName.trim().length < 3) {
      alert('İsim alanı boş geçilemez ve en az 3 karakter olmalıdır.');
      return;
    }
    
    addPersonnel({
      name: newName,
      phone: newPhone,
      type,
    });
    setNewName('');
    setNewPhone('');
    setShowAdd(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editData.name || editData.name.trim().length < 3) {
      alert('İsim alanı boş geçilemez ve en az 3 karakter olmalıdır.');
      return;
    }

    updatePersonnel(editingId, {
      name: editData.name,
      phone: editData.phone
    });
    setEditingId(null);
    setSelectedIds([]);
  };

  const openEdit = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > 1) {
      alert('Lütfen düzenlemek için sadece tek bir kişi seçin.');
      return;
    }
    const person = personnel.find(p => p.id === selectedIds[0]);
    if (person) {
      setEditData({ name: person.name, phone: person.phone || '' });
      setEditingId(person.id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      deletePersonnel(id);
    }
  };

  const handleWhatsAppShare = (person: any) => {
    let message = '';
    if (person.type === 'yemekhane') {
      message = `${person.name} Yemekhane Giriş`;
    } else {
      message = `${person.name} Giriş`;
    }
    
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

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return Array.from(newSet);
    });
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
    
    // Update status
    const newStatus = action === 'giriş' ? 'inside' : 'outside';
    selectedIds.forEach(id => {
      updatePersonnel(id, { status: newStatus });
    });

    const actionText = action === 'giriş' ? 'Giriş' : 'Çıkış';
    
    const yemekhaneNames = selectedPersons.filter(p => p.type === 'yemekhane').map(p => p.name).join(', ');
    const yurtNames = selectedPersons.filter(p => p.type === 'yurt').map(p => p.name).join(', ');
    
    const parts = [];
    if (yemekhaneNames) parts.push(encodeURIComponent(`${yemekhaneNames} Yemekhane ${actionText}`));
    if (yurtNames) parts.push(encodeURIComponent(`${yurtNames} ${actionText}`));
    
    const finalMessage = parts.join('%0A');
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile 
      ? `whatsapp://send?text=${finalMessage}`
      : `https://wa.me/?text=${finalMessage}`;
      
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
    
    setSelectedIds([]);
  };

  const handleStatusToggle = (id: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'outside' ? 'inside' : 'outside';
    updatePersonnel(id, { status: newStatus });
  };

  const filtered = personnel
    .filter(p => 
      p.type === type && 
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (statusFilter === 'all' || 
       (statusFilter === 'inside' && p.status !== 'outside') || 
       (statusFilter === 'outside' && p.status === 'outside'))
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-xl -mx-4 px-4 md:-mx-8 md:px-8 pt-4 md:pt-8 pb-4 space-y-4 border-b border-transparent transition-colors">
        <div className="flex gap-1 p-1 bg-gray-200/80 dark:bg-[#1C1C1E] rounded-lg">
          <button 
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${type === 'yemekhane' ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setType('yemekhane')}
          >
            Yemekhane
          </button>
          <button 
            className={`flex-1 py-1.5 text-[13px] font-semibold rounded-md transition-all ${type === 'yurt' ? 'bg-white dark:bg-[#2C2C2E] shadow-sm text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setType('yurt')}
          >
            Yurt
          </button>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative overflow-hidden"
            >
              <div className="pb-2">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Personel ara..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button 
            className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${statusFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300'}`}
            onClick={() => setStatusFilter('all')}
          >
            Tümü
          </button>
          <button 
            className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${statusFilter === 'inside' ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300'}`}
            onClick={() => setStatusFilter('inside')}
          >
            İçeride
          </button>
          <button 
            className={`px-4 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${statusFilter === 'outside' ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300'}`}
            onClick={() => setStatusFilter('outside')}
          >
            Dışarıda
          </button>
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-[#1C1C1E] rounded-2xl">Kayıt bulunamadı.</div>
        ) : (
          <div className={`grid gap-3 ${personnelColumns === 1 ? 'grid-cols-1' : personnelColumns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {filtered.map(p => (
              <div 
                key={p.id} 
                className={`bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl border ${selectedIds.includes(p.id) ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-white/5'} shadow-sm flex flex-col gap-3 relative transition-all`}
                onClick={() => toggleSelection(p.id)}
              >
                <div className="flex items-start justify-between">
                  <div className={`transition-colors ${selectedIds.includes(p.id) ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`}>
                    {selectedIds.includes(p.id) ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(p.id, p.status); }}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md ${p.status === 'outside' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}
                  >
                    {p.status === 'outside' ? 'DIŞARIDA' : 'İÇERİDE'}
                  </button>
                </div>
                
                <div>
                  <p className="font-bold text-[14px] text-black dark:text-white leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{p.phone || 'Telefon yok'}</p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100 dark:border-white/5">
                  <button onClick={(e) => { e.stopPropagation(); handleWhatsAppShare(p); }} className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg active:opacity-50">
                    <MessageCircle size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 text-gray-400 hover:text-red-500 active:opacity-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Bottom Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 px-4 pb-2 z-30 pointer-events-none"
          >
            <div className="bg-gray-900 dark:bg-blue-950 p-4 rounded-2xl shadow-2xl border border-white/10 max-w-md mx-auto space-y-4 pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-xs font-black px-2 py-1 rounded-full">
                    {selectedIds.length}
                  </span>
                  <span className="text-white font-bold text-sm">Personel Seçildi</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAll}
                    className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300"
                  >
                    Tümünü Seç
                  </button>
                  <button 
                    onClick={clearSelection}
                    className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-300"
                  >
                    İptal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={openEdit}
                  disabled={selectedIds.length !== 1}
                  className="py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1"
                >
                  <Edit2 size={18} />
                  DÜZENLE
                </button>
                <button 
                  onClick={() => { triggerHaptic(); handleBulkWhatsApp('giriş'); }}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={18} />
                  GİRİŞ
                </button>
                <button 
                  onClick={() => { triggerHaptic(); handleBulkWhatsApp('çıkış'); }}
                  className="py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 shadow-lg shadow-rose-500/20"
                >
                  <LogOut size={18} />
                  ÇIKIŞ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAdd} 
              className="bg-white dark:bg-[#1C1C1E] rounded-[32px] p-6 w-full max-w-sm shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <button type="button" onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Yeni Personel</h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <input type="text" id="p-name" required placeholder=" " className="peer w-full px-4 py-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={newName} onChange={e => setNewName(e.target.value)} />
                  <label htmlFor="p-name" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Ad Soyad</label>
                </div>
                <div className="relative">
                  <input type="tel" id="p-phone" placeholder=" " className="peer w-full px-4 py-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                  <label htmlFor="p-phone" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Telefon (Opsiyonel)</label>
                </div>
              </div>
              
              <div className="mt-8">
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20">
                  KAYDET
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleEdit} 
              className="bg-white dark:bg-[#1C1C1E] rounded-[32px] p-6 w-full max-w-sm shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <Edit2 size={24} />
                </div>
                <button type="button" onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Personel Düzenle</h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <input type="text" id="e-name" required placeholder=" " className="peer w-full px-4 py-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <label htmlFor="e-name" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Ad Soyad</label>
                </div>
                <div className="relative">
                  <input type="tel" id="e-phone" placeholder=" " className="peer w-full px-4 py-4 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                  <label htmlFor="e-phone" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Telefon (Opsiyonel)</label>
                </div>
              </div>
              
              <div className="mt-8">
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20">
                  GÜNCELLE
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Search, Trash2, LogOut, MessageCircle, DoorOpen, Edit2, CheckSquare, Square, ChevronRight, X } from 'lucide-react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../capacitor';

export default function Visitors() {
  const { visitors, addVisitor, updateVisitor, deleteVisitor } = useAppStore();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', tc: '', company: '', plate: '', material: '', fromPlace: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: '', tc: '', company: '', plate: '', material: '', fromPlace: '' });
  const [cGatePopup, setCGatePopup] = useState<string | null>(null);
  const [shareModal, setShareModal] = useState<{ action: 'giriş' | 'çıkış' | 'c_kapisi' } | null>(null);
  const [shareFields, setShareFields] = useState({
    name: true,
    tc: false,
    company: false,
    plate: false,
    fromPlace: true,
    material: true
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const uniqueCompanies = React.useMemo(() => {
    return Array.from(new Set(visitors.map(v => v.company?.trim()).filter(Boolean))).sort();
  }, [visitors]);

  const uniquePlaces = React.useMemo(() => {
    return Array.from(new Set(visitors.map(v => v.fromPlace?.trim()).filter(Boolean))).sort();
  }, [visitors]);

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

  const validateVisitor = (name: string, tc: string, company: string) => {
    if (!name && !tc && !company && !formData.plate && !formData.material && !formData.fromPlace) {
      // Just to prevent completely empty records if possible, but we'll let it pass if they really want
    }
    return true;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVisitor(formData.name, formData.tc, formData.company)) return;
    
    addVisitor(formData);
    setFormData({ name: '', tc: '', company: '', plate: '', material: '', fromPlace: '' });
    setShowAdd(false);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!validateVisitor(editData.name, editData.tc, editData.company)) return;

    updateVisitor(editingId, editData);
    setEditingId(null);
    setSelectedIds([]);
  };

  const openEdit = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length > 1) {
      alert('Lütfen düzenlemek için sadece tek bir kişi seçin.');
      return;
    }
    const visitor = visitors.find(v => v.id === selectedIds[0]);
    if (visitor) {
      setEditData({
        name: visitor.name || '',
        tc: visitor.tc || '',
        company: visitor.company || '',
        plate: visitor.plate || '',
        material: visitor.material || '',
        fromPlace: visitor.fromPlace || ''
      });
      setEditingId(visitor.id);
    }
  };

  const handleExit = (visitor: any) => {
    if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      updateVisitor(visitor.id, {
        exitTime: new Date().toISOString(),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Silmek istediğinize emin misiniz?')) {
      deleteVisitor(id);
    }
  };

  const executeShare = () => {
    if (!shareModal || selectedIds.length === 0) return;
    
    const selectedVisitors = visitors.filter(v => selectedIds.includes(v.id));
    
    const lines = selectedVisitors.map(v => {
      const parts = [];
      if (shareFields.name && v.name) parts.push(v.name);
      if (shareFields.tc && v.tc) parts.push(v.tc);
      if (shareFields.company && v.company) parts.push(v.company);
      if (shareFields.plate && v.plate) parts.push(v.plate);
      if (shareFields.fromPlace && v.fromPlace) parts.push(v.fromPlace);
      if (shareFields.material && v.material) parts.push(v.material);
      return parts.join(' ');
    });
    
    let message = '';
    if (shareModal.action === 'c_kapisi') {
      const names = selectedVisitors.map(v => v.name).join(', ');
      setCGatePopup(`${names} C kapısından giriş yaptı.`);
      message = `${lines.join(', ')} giriş C Kapısı`;
    } else {
      message = `${lines.join(', ')} ${shareModal.action}`;
    }
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile 
      ? `whatsapp://send?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShareModal(null);
    setSelectedIds([]);
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
    setSelectedIds(filtered.map(v => v.id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const filtered = visitors
    .filter(v => 
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.tc.includes(search) ||
      v.company.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'tr-TR'));

  return (
    <div className="space-y-4 pt-4 md:pt-8">
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
                placeholder="İsim, TC veya Firma ara..." 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ios-list">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Kayıt bulunamadı.</div>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {filtered.map(v => (
              <div 
                key={v.id} 
                className={`ios-list-item flex-col items-stretch gap-3 cursor-pointer ${selectedIds.includes(v.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
              >
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3 flex-1">
                    <div 
                      className={`transition-colors flex-shrink-0 cursor-pointer ${selectedIds.includes(v.id) ? 'text-blue-600' : 'text-gray-300 dark:text-gray-600'}`}
                      onClick={(e) => { e.stopPropagation(); toggleSelection(v.id); }}
                    >
                      {selectedIds.includes(v.id) ? <CheckSquare size={22} /> : <Square size={22} />}
                    </div>
                    <p className="font-semibold text-[16px] text-black dark:text-white">{v.name}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} className="p-2 text-gray-300 dark:text-gray-600 active:opacity-50 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <motion.div
                      animate={{ rotate: expandedId === v.id ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
                    </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === v.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-2 pb-1 border-t border-black/5 dark:border-white/5 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                          {v.tc && <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">TC:</span> {v.tc}</p>}
                          {v.company && <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">Firma:</span> {v.company}</p>}
                          {v.plate && <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">Plaka:</span> {v.plate}</p>}
                          {v.fromPlace && <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">Geldiği Yer:</span> {v.fromPlace}</p>}
                          {v.material && <p className="text-[13px] text-gray-500 dark:text-gray-400 md:col-span-2"><span className="font-medium text-gray-400 dark:text-gray-500">Malzeme:</span> {v.material}</p>}
                          <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">Giriş:</span> {new Date(v.entryTime).toLocaleString('tr-TR')}</p>
                          {v.exitTime && <p className="text-[13px] text-gray-500 dark:text-gray-400"><span className="font-medium text-gray-400 dark:text-gray-500">Çıkış:</span> {new Date(v.exitTime).toLocaleString('tr-TR')}</p>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
            <div className="bg-gray-900 dark:bg-emerald-950 p-4 rounded-2xl shadow-2xl border border-white/10 max-w-md mx-auto space-y-4 pointer-events-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white text-xs font-black px-2 py-1 rounded-full">
                    {selectedIds.length}
                  </span>
                  <span className="text-white font-bold text-sm">Ziyaretçi Seçildi</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={selectAll}
                    className="text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300"
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

              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={openEdit}
                  disabled={selectedIds.length !== 1}
                  className="py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1"
                >
                  <Edit2 size={18} />
                  DÜZENLE
                </button>
                <button 
                  onClick={() => { triggerHaptic(); setShareModal({ action: 'c_kapisi' }); }}
                  className="py-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 shadow-lg shadow-blue-500/20"
                >
                  <DoorOpen size={18} />
                  C KAPISI
                </button>
                <button 
                  onClick={() => { triggerHaptic(); setShareModal({ action: 'giriş' }); }}
                  className="py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all flex flex-col items-center gap-1 shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle size={18} />
                  GİRİŞ
                </button>
                <button 
                  onClick={() => { triggerHaptic(); setShareModal({ action: 'çıkış' }); }}
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

      {shareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm my-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 text-[#1e3a8a] dark:text-blue-400">Gönderilecek Bilgiler</h3>
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.name} onChange={e => setShareFields({...shareFields, name: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">İsim Soyisim</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.tc} onChange={e => setShareFields({...shareFields, tc: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">TC Kimlik</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.company} onChange={e => setShareFields({...shareFields, company: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">Firma</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.plate} onChange={e => setShareFields({...shareFields, plate: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">Araç Plakası</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.fromPlace} onChange={e => setShareFields({...shareFields, fromPlace: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">Geldiği Yer</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={shareFields.material} onChange={e => setShareFields({...shareFields, material: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-gray-700 dark:text-gray-200">Malzeme</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShareModal(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold rounded-xl transition-colors">
                İptal
              </button>
              <button onClick={executeShare} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <MessageCircle size={20} />
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleAdd} 
              className="bg-white dark:bg-[#1C1C1E] rounded-[32px] p-6 w-full max-w-sm my-8 shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <button type="button" onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Yeni Ziyaretçi</h3>
              
              <div className="space-y-3">
                <div className="relative">
                  <input type="text" id="v-name" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <label htmlFor="v-name" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">İsim Soyisim</label>
                </div>
                
                <div className="relative">
                  <input type="text" id="v-tc" maxLength={11} placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={formData.tc} onChange={e => setFormData({...formData, tc: e.target.value})} />
                  <label htmlFor="v-tc" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">TC Kimlik</label>
                </div>

                <div className="relative">
                  <input type="text" id="v-plate" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium uppercase" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} />
                  <label htmlFor="v-plate" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">Araç Plakası</label>
                </div>

                <div className="relative">
                  <input type="text" id="v-company" list="company-list" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                  <label htmlFor="v-company" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">Firma Adı</label>
                </div>

                <div className="relative">
                  <input type="text" id="v-from" list="place-list" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={formData.fromPlace} onChange={e => setFormData({...formData, fromPlace: e.target.value})} />
                  <label htmlFor="v-from" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">Geldiği Yer</label>
                </div>

                <div className="relative">
                  <input type="text" id="v-material" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} />
                  <label htmlFor="v-material" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-emerald-500">Malzeme</label>
                </div>
              </div>
              
              <div className="mt-8">
                <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20">
                  KAYDET
                </button>
              </div>
            </motion.form>
          </div>
        )}

        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleEdit} 
              className="bg-white dark:bg-[#1C1C1E] rounded-[32px] p-6 w-full max-w-sm my-8 shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                  <Edit2 size={24} />
                </div>
                <button type="button" onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <h3 className="text-2xl font-black mb-6 text-gray-900 dark:text-white tracking-tight">Ziyaretçi Düzenle</h3>
              
              <div className="space-y-3">
                <div className="relative">
                  <input type="text" id="e-v-name" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                  <label htmlFor="e-v-name" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">İsim Soyisim</label>
                </div>
                
                <div className="relative">
                  <input type="text" id="e-v-tc" maxLength={11} placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.tc} onChange={e => setEditData({...editData, tc: e.target.value})} />
                  <label htmlFor="e-v-tc" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">TC Kimlik</label>
                </div>

                <div className="relative">
                  <input type="text" id="e-v-plate" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium uppercase" value={editData.plate} onChange={e => setEditData({...editData, plate: e.target.value})} />
                  <label htmlFor="e-v-plate" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Araç Plakası</label>
                </div>

                <div className="relative">
                  <input type="text" id="e-v-company" list="company-list" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.company} onChange={e => setEditData({...editData, company: e.target.value})} />
                  <label htmlFor="e-v-company" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Firma Adı</label>
                </div>

                <div className="relative">
                  <input type="text" id="e-v-from" list="place-list" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.fromPlace} onChange={e => setEditData({...editData, fromPlace: e.target.value})} />
                  <label htmlFor="e-v-from" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Geldiği Yer</label>
                </div>

                <div className="relative">
                  <input type="text" id="e-v-material" placeholder=" " className="peer w-full px-4 py-3.5 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium" value={editData.material} onChange={e => setEditData({...editData, material: e.target.value})} />
                  <label htmlFor="e-v-material" className="absolute text-[13px] font-bold text-gray-500 dark:text-gray-400 duration-200 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-blue-500">Malzeme</label>
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

      {/* Detail Modal Removed */}

      <datalist id="company-list">
        {uniqueCompanies.map(c => <option key={c} value={c} />)}
      </datalist>
      <datalist id="place-list">
        {uniquePlaces.map(p => <option key={p} value={p} />)}
      </datalist>
    </div>
  );
}

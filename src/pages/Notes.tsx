import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Plus, Search, Trash2, LogIn, FileText } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

const COLORS = ['bg-yellow-100', 'bg-blue-100', 'bg-green-100', 'bg-pink-100', 'bg-purple-100'];

export default function Notes() {
  const { user, login } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', color: COLORS[0] });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(all);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-4">
          <FileText size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Notlarınızı bulut üzerinden senkronize etmek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title && !formData.content) return;
    
    try {
      await addDoc(collection(db, 'notes'), {
        ...formData,
        createdAt: new Date().toISOString(),
      });
      setFormData({ title: '', content: '', color: COLORS[0] });
      setShowAdd(false);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Notu silmek istediğinize emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'notes', id));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const filtered = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Notlarda ara..." 
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-500 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(note => (
          <div key={note.id} className={`${note.color} p-4 rounded-2xl shadow-sm relative group`}>
            <h3 className="font-bold text-gray-800 mb-2">{note.title}</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
            <p className="text-xs text-gray-500 mt-4">{new Date(note.createdAt).toLocaleDateString('tr-TR')}</p>
            <button 
              onClick={() => handleDelete(note.id)}
              className="absolute top-2 right-2 p-1.5 bg-white/50 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button 
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-yellow-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-yellow-600 transition-colors"
      >
        <Plus size={24} />
      </button>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Yeni Not</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Başlık" 
                className="w-full p-2 border-b-2 border-transparent focus:border-yellow-500 outline-none font-bold text-lg" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
              <textarea 
                placeholder="Notunuzu buraya yazın..." 
                className="w-full p-2 border rounded-lg h-32 outline-none focus:ring-2 focus:ring-yellow-500" 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
              />
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    type="button" 
                    onClick={() => setFormData({...formData, color: c})}
                    className={`w-8 h-8 rounded-full ${c} ${formData.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg text-gray-700">İptal</button>
              <button type="submit" className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-medium">Kaydet</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

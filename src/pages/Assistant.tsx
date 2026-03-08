import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, LogIn } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../components/FirebaseProvider';

export default function Assistant() {
  const { user, login } = useAuth();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Merhaba! Ben Güvenlik Asistanı yapay zekasıyım. Personel ekleme, ziyaretçi sorgulama gibi işlemlerde size yardımcı olabilirim. Nasıl yardımcı olabilirim?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mb-4">
          <Bot size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Yapay zeka asistanını kullanmak ve verileri senkronize etmek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API anahtarı bulunamadı.');
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Fetch current database state to provide context to Gemini
      const personnelSnap = await getDocs(collection(db, 'personnel'));
      const visitorsSnap = await getDocs(query(collection(db, 'visitors'), orderBy('entryTime', 'desc'), limit(10)));
      
      const personnel = personnelSnap.docs.map(d => d.data());
      const visitors = visitorsSnap.docs.map(d => d.data());

      const systemInstruction = `
        Sen bir güvenlik görevlisi asistanısın. Görevin, kullanıcının isteklerini anlamak ve veritabanı işlemleri yapmaktır.
        Şu anki veritabanı durumu (bazı kayıtlar):
        Personel: ${JSON.stringify(personnel)}
        Son Ziyaretçiler: ${JSON.stringify(visitors)}

        Eğer kullanıcı bir personel eklemek isterse (örn: "Ahmet Yılmaz'ı yemekhane personeli olarak ekle"), 
        bunu anladığını belirt ve JSON formatında bir işlem döndür. 
        ÖNEMLİ: Sadece metin yanıtı ver, eğer bir işlem yapman gerekiyorsa yanıtının sonuna şu formatta bir JSON ekle:
        \`\`\`json
        { "action": "add_personnel", "data": { "name": "Ahmet Yılmaz", "type": "yemekhane", "phone": "" } }
        \`\`\`
        Aynı şekilde "yurt" personeli de eklenebilir.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction
        }
      });

      let responseText = response.text || 'Bir hata oluştu.';
      
      // Parse JSON action if exists
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          const actionObj = JSON.parse(jsonMatch[1]);
          if (actionObj.action === 'add_personnel') {
            await addDoc(collection(db, 'personnel'), {
              ...actionObj.data,
              createdAt: new Date().toISOString()
            });
            responseText = responseText.replace(/```json\n([\s\S]*?)\n```/, '').trim();
            responseText += '\n\n✅ İşlem başarıyla gerçekleştirildi: Personel eklendi.';
          }
        } catch (err) {
          console.error('JSON parse error', err);
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Hata: ${error.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4 bg-blue-600 dark:bg-gray-900 text-white flex items-center gap-3">
        <Bot size={24} />
        <h2 className="font-bold text-lg">Yapay Zeka Asistanı</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm whitespace-pre-wrap'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Düşünüyor...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Asistana bir şey sorun veya bir işlem yaptırın..." 
          className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send size={20} className="ml-1" />
        </button>
      </form>
    </div>
  );
}

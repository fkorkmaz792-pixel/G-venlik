import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Clock, CheckCircle2 } from 'lucide-react';

export default function Alarms() {
  const [alarms, setAlarms] = useState<any[]>(() => {
    const saved = localStorage.getItem('patrol_alarms');
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    localStorage.setItem('patrol_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      alarms.forEach(alarm => {
        if (alarm.isActive && alarm.time === currentTime && !alarm.triggeredToday) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Devriye Vakti!', {
              body: alarm.label,
              icon: '/vite.svg'
            });
          } else {
            alert(`DEVRİYE VAKTİ: ${alarm.label}`);
          }
          // Mark as triggered
          setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, triggeredToday: true } : a));
        }
      });
    }, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [alarms]);

  // Reset triggered status at midnight
  useEffect(() => {
    const resetInterval = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setAlarms(prev => prev.map(a => ({ ...a, triggeredToday: false })));
      }
    }, 60000);
    return () => clearInterval(resetInterval);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime || !newLabel) return;
    setAlarms([...alarms, { id: Date.now(), time: newTime, label: newLabel, isActive: true, triggeredToday: false }]);
    setNewTime('');
    setNewLabel('');
    setShowForm(false);
  };

  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const deleteAlarm = (id: number) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Devriye Alarmları</h2>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white p-2 rounded-full shadow-md">
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
            <input type="time" required value={newTime} onChange={e => setNewTime(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devriye Noktası / Görev</label>
            <input type="text" required value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Örn: C Kapısı Kontrolü" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium">İptal</button>
            <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium">Kaydet</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {alarms.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Henüz alarm eklenmedi.</div>
        ) : (
          alarms.sort((a,b) => a.time.localeCompare(b.time)).map(alarm => (
            <div key={alarm.id} className={`flex items-center justify-between p-4 rounded-2xl border ${alarm.isActive ? 'bg-white border-blue-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
              <div className="flex items-center gap-4">
                <div className={`text-2xl font-bold ${alarm.isActive ? 'text-blue-600' : 'text-gray-500'}`}>{alarm.time}</div>
                <div>
                  <div className="font-medium text-gray-800">{alarm.label}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock size={12} /> Her gün
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => toggleAlarm(alarm.id)} className={`w-12 h-6 rounded-full transition-colors relative ${alarm.isActive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${alarm.isActive ? 'translate-x-6.5 left-0.5' : 'translate-x-0.5'}`} />
                </button>
                <button onClick={() => deleteAlarm(alarm.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

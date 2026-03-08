import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Trash2, X, LogIn, Calendar } from 'lucide-react';
import { useAuth } from '../components/FirebaseProvider';

const DEFAULT_SHIFT_TYPES = [
  { id: '1', name: 'Gündüz', color: 'bg-yellow-400', time: '08:00 - 20:00' },
  { id: '2', name: 'Gece', color: 'bg-indigo-500', time: '20:00 - 08:00' },
  { id: '3', name: 'İstirahat', color: 'bg-green-500', time: 'Tüm Gün' },
  { id: '4', name: 'İzin', color: 'bg-red-500', time: 'Yıllık İzin' }
];

export default function ShiftCalendar() {
  const { user, login } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [shifts, setShifts] = useState<any[]>([]);
  const [shiftTypes, setShiftTypes] = useState(DEFAULT_SHIFT_TYPES);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'shifts'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setShifts(all);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mb-4">
          <Calendar size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Senkronizasyon Gerekli</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">Vardiya takviminizi bulut üzerinden senkronize etmek için giriş yapmalısınız.</p>
        <button 
          onClick={login}
          className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
        >
          <LogIn size={20} /> Google ile Giriş Yap
        </button>
      </div>
    );
  }

  const handleDayClick = async (date: Date) => {
    if (!selectedType) {
      alert('Lütfen önce aşağıdaki listeden bir vardiya tipi seçin.');
      return;
    }
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    try {
      // Remove existing shift for this date if exists
      const existing = shifts.find(s => s.date === dateStr);
      if (existing) {
        await deleteDoc(doc(db, 'shifts', existing.id));
      }

      // Add new shift
      await addDoc(collection(db, 'shifts'), { 
        date: dateStr, 
        typeId: selectedType,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating shift:', error);
    }
  };

  const handleClearDay = async (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = format(date, 'yyyy-MM-dd');
    const existing = shifts.find(s => s.date === dateStr);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'shifts', existing.id));
      } catch (error) {
        console.error('Error clearing shift:', error);
      }
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start of month
  const startDay = monthStart.getDay();
  const paddingDays = startDay === 0 ? 6 : startDay - 1; // Monday start
  const paddedDays = Array(paddingDays).fill(null).concat(days);

  return (
    <div className="space-y-6 pb-24">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft /></button>
        <h2 className="text-xl font-bold text-gray-800 capitalize">{format(currentDate, 'MMMM yyyy', { locale: tr })}</h2>
        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight /></button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-gray-500">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr">
          {paddedDays.map((date, i) => {
            if (!date) return <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-gray-50 bg-gray-50/50" />;
            
            const dateStr = format(date, 'yyyy-MM-dd');
            const shift = shifts.find(s => s.date === dateStr);
            const type = shift ? shiftTypes.find(t => t.id === shift.typeId) : null;
            const isCurrentDay = isToday(date);

            return (
              <div 
                key={date.toString()} 
                onClick={() => handleDayClick(date)}
                className={`min-h-[80px] border-b border-r border-gray-100 p-1 relative cursor-pointer hover:bg-gray-50 transition-colors ${isCurrentDay ? 'bg-blue-50/30' : ''}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isCurrentDay ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
                  {format(date, 'd')}
                </div>
                
                {type && (
                  <div className={`mt-1 text-[10px] font-bold text-white p-1 rounded-md text-center leading-tight ${type.color}`}>
                    {type.name}
                    <button 
                      onClick={(e) => handleClearDay(date, e)}
                      className="absolute top-1 right-1 p-1 bg-white/20 rounded-full hover:bg-white/40 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Shift Selector */}
      <div className="fixed bottom-4 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-3 z-10">
        <div className="text-sm font-medium text-gray-300">Takvime eklemek için bir vardiya seçin:</div>
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          {shiftTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm transition-transform ${type.color} ${selectedType === type.id ? 'ring-4 ring-white ring-offset-2 ring-offset-gray-900 scale-105' : 'opacity-80 hover:opacity-100'}`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

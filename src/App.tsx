import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import Visitors from './pages/Visitors';
import Radio from './pages/Radio';
import Weather from './pages/Weather';
import ShiftCalendar from './pages/ShiftCalendar';
import Notes from './pages/Notes';
import Scanner from './pages/Scanner';
import Games from './pages/Games';
import TicTacToe from './pages/games/TicTacToe';
import MemoryGame from './pages/games/Memory';
import Snake from './pages/games/Snake';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Chats from './pages/Chats';
import News from './pages/News';
import Alarms from './pages/Alarms';
import Assistant from './pages/Assistant';
import { FirebaseProvider, useAuth } from './components/FirebaseProvider';
import { LogIn } from 'lucide-react';
import InstallPWA from './components/InstallPWA';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, login } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="text-blue-600 dark:text-blue-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Güvenlik Asistanı</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">Devam etmek için lütfen giriş yapın.</p>
          <button
            onClick={login}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-500/30"
          >
            Google ile Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <FirebaseProvider>
      <BrowserRouter>
        <InstallPWA />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="personnel" element={<Personnel />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="radio" element={<Radio />} />
            <Route path="weather" element={<Weather />} />
            <Route path="calendar" element={<ShiftCalendar />} />
            <Route path="notes" element={<Notes />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="reports" element={<Reports />} />
            <Route path="chats" element={<Chats />} />
            <Route path="news" element={<News />} />
            <Route path="alarms" element={<Alarms />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="games" element={<Games />} />
            <Route path="games/tictactoe" element={<TicTacToe />} />
            <Route path="games/memory" element={<MemoryGame />} />
            <Route path="games/snake" element={<Snake />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </FirebaseProvider>
  );
}

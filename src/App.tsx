import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Personnel from './pages/Personnel';
import Visitors from './pages/Visitors';
import Weather from './pages/Weather';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import InstallPWA from './components/InstallPWA';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './store';

export default function App() {
  const { personnel, visitors, seedData, syncFromFirebase } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        await syncFromFirebase();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [syncFromFirebase]);

  useEffect(() => {
    if (personnel.length === 0 && visitors.length === 0) {
      seedData();
    }
  }, [personnel.length, visitors.length, seedData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <InstallPWA />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="personnel" element={<Personnel />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="weather" element={<Weather />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

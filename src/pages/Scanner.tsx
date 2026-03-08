import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function Scanner() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        scanner.clear();
        handleScan(decodedText);
      },
      (error) => {
        // Ignore errors during scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleScan = async (text: string) => {
    try {
      const q = query(collection(db, 'visitors'), where('tc', '==', text));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const found = querySnapshot.docs[0].data();
        alert(`Kayıt bulundu: ${found.name}`);
        navigate('/visitors');
      } else {
        if (confirm(`Kayıt bulunamadı. "${text}" için yeni ziyaretçi kaydedilsin mi?`)) {
          navigate('/visitors');
        } else {
          setScanResult(null);
        }
      }
    } catch (error) {
      console.error('Error scanning:', error);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">QR / Barkod Okuyucu</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Kimlik kartı barkodunu veya QR kodu kameraya gösterin. Tarayıcı izinlerini verdiğinizden emin olun.</p>
        
        <div id="reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"></div>
        
        {scanResult && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-lg text-sm break-all">
            <strong>Okunan Veri:</strong> {scanResult}
          </div>
        )}
      </div>
    </div>
  );
}

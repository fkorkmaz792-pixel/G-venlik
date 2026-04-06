import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth } from './firebase';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

export interface Personnel {
  id: string;
  name: string;
  phone: string;
  type: 'yemekhane' | 'yurt';
  status?: 'inside' | 'outside';
  createdAt: string;
  uid?: string;
}

export interface Visitor {
  id: string;
  name: string;
  tc: string;
  company: string;
  plate: string;
  material: string;
  fromPlace: string;
  entryTime: string;
  exitTime?: string;
  uid?: string;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lon: number;
  uid?: string;
}

interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  
  cities: City[];
  addCity: (city: Omit<City, 'id'>) => void;
  removeCity: (id: string) => void;
  selectedCityId: string;
  setSelectedCityId: (id: string) => void;

  personnel: Personnel[];
  addPersonnel: (p: Omit<Personnel, 'id' | 'createdAt'>) => void;
  updatePersonnel: (id: string, p: Partial<Personnel>) => void;
  deletePersonnel: (id: string) => void;

  visitors: Visitor[];
  addVisitor: (v: Omit<Visitor, 'id' | 'entryTime'>) => void;
  updateVisitor: (id: string, v: Partial<Visitor>) => void;
  deleteVisitor: (id: string) => void;

  importData: (data: { personnel?: Personnel[], visitors?: Visitor[], cities?: City[] }) => void;
  seedData: () => void;
  
  syncFromFirebase: () => Promise<void>;
  backupToFirebase: () => Promise<void>;
  restoreFromFirebase: () => Promise<void>;

  personnelColumns: number;
  setPersonnelColumns: (cols: number) => void;
}

const initialPersonnel: Personnel[] = [
  { id: 'p1', name: 'Aleyna Altunsoy (Diyetisyen)', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Aleyna Yücebaş (Diyetisyen)', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p3', name: 'Aysun Daşdemir', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p4', name: 'Ayten Kılık', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p5', name: 'Ayşen Toprakkıran', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p6', name: 'Azize Gezici', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p7', name: 'Birgül Arslan', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p8', name: 'Burak Ceylan', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p9', name: 'Cahide Ulağ', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p10', name: 'Cemre Ortaç', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p11', name: 'Derya Eke', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p12', name: 'Dilek Bakır', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p13', name: 'Dilek Can', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p14', name: 'Esra Deveci', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p15', name: 'Ezgi Nur Demir', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p16', name: 'Hanife Kozan', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p17', name: 'Hatice Gürbüz', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p18', name: 'Kevser Hanım', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p19', name: 'Keziban Aydın', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p20', name: 'Mehmet Genç', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p21', name: 'Meryem Bağca', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p22', name: 'Mesut Derya Bağca', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p23', name: 'Murat Ceylan', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p24', name: 'Neşe Arslantürk', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p25', name: 'Nilay Sare Dimetokalı', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p26', name: 'Nuran Balaban', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p27', name: 'Nurgül Sert', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p28', name: 'Ramadan Şenyürek', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p29', name: 'Seher Nuhoğlu', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p30', name: 'Semiha Şabotiç', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p31', name: 'Solmaz Kösek', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p32', name: 'Zuhal Şensoy', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p33', name: 'İrem Gürses', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p34', name: 'İslim Polat', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },
  { id: 'p35', name: 'Şuheda Sekban (Diyetisyen)', phone: '', type: 'yemekhane', createdAt: new Date().toISOString() },

  { id: 'p36', name: 'Ahmet Çoban', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p37', name: 'Akın Buda', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p38', name: 'Aylin Yol', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p39', name: 'Aynur Aksu', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p40', name: 'Aysun Atan', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p41', name: 'Başak İltaş', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p42', name: 'Berivan Yalçın', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p43', name: 'Fatih Altıntop', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p44', name: 'Güler Karakurt (Spor Hocası)', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p45', name: 'Güllü Kılıç', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p46', name: 'Hamide Demir', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p47', name: 'Havva Demir', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p48', name: 'Kader Özdemir', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p49', name: 'Kasım Çakmak', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p50', name: 'Leyla Solak', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p51', name: 'Melek Şahin (Ebru Sanatı Hocası)', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p52', name: 'Murat Kaymaz', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p53', name: 'Nesrin Çakmak', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p54', name: 'Nilgün Akot', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p55', name: 'Nursel Sevük', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p56', name: 'Sabiha Topsakal', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p57', name: 'Sevda Çapar', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p58', name: 'Simanur Ural', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p59', name: 'Sümeyye Çelebi (Manevi Danışman)', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p60', name: 'Yasemin Gündüz', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p61', name: 'Yeter Özuzun', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p62', name: 'Yudum Yavuz', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p63', name: 'Yusuf Gökçınar', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p64', name: 'Zübeyde Türkşen', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p65', name: 'Şehnaz Çolak', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
  { id: 'p66', name: 'Şennur Çınar', phone: '', type: 'yurt', createdAt: new Date().toISOString() },
];

const initialVisitors: Visitor[] = [
  { id: 'v1', name: 'Abdullah Kaynarpınar', tc: '55603260726', plate: '34BCK115', company: '', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v2', name: 'Abdullah Çelik & Harun Çelik', tc: '', plate: '', company: 'Meyve Sebze', fromPlace: '', material: '', entryTime: new Date().toISOString() },
  { id: 'v3', name: 'Ali Taşkın', tc: '69331121242', plate: '34AJ8986', company: 'Özbek Gıda', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v4', name: 'Cemal Karatekin', tc: '', plate: '', company: 'İlaçlama', fromPlace: '', material: '', entryTime: new Date().toISOString() },
  { id: 'v5', name: 'Emin Yılmaz', tc: '26332346470', plate: '34DU6507', company: '', fromPlace: 'Yemekhane', material: 'Et', entryTime: new Date().toISOString() },
  { id: 'v6', name: 'Ercan sezen', tc: '', plate: '', company: 'Ptt', fromPlace: 'Yurt', material: 'Kargo', entryTime: new Date().toISOString() },
  { id: 'v7', name: 'Erdal Beybiroğlu', tc: '', plate: '', company: 'Özgıda', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v8', name: 'Erdal Koç', tc: '48055294074', plate: '34PIF059', company: 'Güzelpınar', fromPlace: 'Yemekhane', material: 'Su', entryTime: new Date().toISOString() },
  { id: 'v9', name: 'Erol Yılmaz', tc: '31562133240', plate: '34N6398', company: 'Aydos Yoğurt', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v10', name: 'Kaan Çiçek', tc: '14657868814', plate: '34FFF356', company: '', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v11', name: 'Kenan Aydoğan', tc: '60094273292', plate: '34CPD644', company: '', fromPlace: 'Yemekhane', material: 'Mutfak tamir', entryTime: new Date().toISOString() },
  { id: 'v12', name: 'Metin Polat', tc: '40054927168', plate: '34MYP211', company: 'Starfresh', fromPlace: 'Yemekhane', material: 'Sebze-Meyve', entryTime: new Date().toISOString() },
  { id: 'v13', name: 'Murat Dağ', tc: '23869036478', plate: '34HIB332', company: 'Eka Asansör', fromPlace: 'Yurt', material: '', entryTime: new Date().toISOString() },
  { id: 'v14', name: 'Ozan Altınbaş', tc: '42946121166', plate: '06FHM966', company: 'Peyman', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v15', name: 'Ramazan Tiryaki', tc: '25357521336', plate: '34PKS737', company: 'Güzelpınar', fromPlace: 'Yemekhane', material: 'Su', entryTime: new Date().toISOString() },
  { id: 'v16', name: 'Semi Şimşek', tc: '16244748400', plate: '34JT2846', company: 'Poğaçacı', fromPlace: 'Yemekhane', material: 'Poğaça', entryTime: new Date().toISOString() },
  { id: 'v17', name: 'Seyit Ali Çiçek', tc: '54715065014', plate: '34KPL460', company: 'Ekmekçi', fromPlace: 'Yemekhane', material: 'Ekmek', entryTime: new Date().toISOString() },
  { id: 'v18', name: 'Sinan Ergün', tc: '10335118776', plate: '34PGP255', company: 'Tavukçu', fromPlace: 'Yemekhane', material: 'Tavuk', entryTime: new Date().toISOString() },
  { id: 'v19', name: 'Süleyman Çakır', tc: '16612181310', plate: '34HYN855', company: '', fromPlace: 'Yemekhane', material: 'Yumurta', entryTime: new Date().toISOString() },
  { id: 'v20', name: 'Yasin Ebrem', tc: '65941072868', plate: '34FT5216', company: 'Sütaş', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v21', name: 'İlyas Albayrak', tc: '11075922142', plate: '34MEY663', company: 'Tamirci', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
  { id: 'v22', name: 'İsmet Çil', tc: '44269821242', plate: '34MNC198', company: 'Ketçap/Meyve Suyu', fromPlace: 'Yemekhane', material: '', entryTime: new Date().toISOString() },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'blue',
      setTheme: (theme) => set({ theme }),
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      isDrawerOpen: false,
      toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
      closeDrawer: () => set({ isDrawerOpen: false }),

      cities: [{ id: 'ankara', name: 'Ankara', lat: 39.9208, lon: 32.8541 }],
      addCity: async (city) => {
        const newCity = { ...city, id: crypto.randomUUID(), uid: auth.currentUser?.uid };
        set((state) => ({ cities: [...state.cities, newCity] }));
        if (auth.currentUser) {
          try { await setDoc(doc(db, `users/${auth.currentUser.uid}/cities`, newCity.id), newCity); } catch (e) { console.error(e); }
        }
      },
      removeCity: async (id) => {
        set((state) => ({
          cities: state.cities.filter(c => c.id !== id),
          selectedCityId: state.selectedCityId === id ? 'current' : state.selectedCityId
        }));
        if (auth.currentUser) {
          try { await deleteDoc(doc(db, `users/${auth.currentUser.uid}/cities`, id)); } catch (e) { console.error(e); }
        }
      },
      selectedCityId: 'current',
      setSelectedCityId: (id) => set({ selectedCityId: id }),

      personnelColumns: 1,
      setPersonnelColumns: (cols) => set({ personnelColumns: cols }),

      personnel: initialPersonnel,
      addPersonnel: async (p) => {
        const newP = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString(), uid: auth.currentUser?.uid };
        set((state) => ({ personnel: [newP, ...state.personnel] }));
        if (auth.currentUser) {
          try { await setDoc(doc(db, `users/${auth.currentUser.uid}/personnel`, newP.id), newP); } catch (e) { console.error(e); }
        }
      },
      updatePersonnel: async (id, updated) => {
        set((state) => ({ personnel: state.personnel.map(p => p.id === id ? { ...p, ...updated } : p) }));
        if (auth.currentUser) {
          const p = get().personnel.find(p => p.id === id);
          if (p) {
            try { await setDoc(doc(db, `users/${auth.currentUser.uid}/personnel`, id), { ...p, ...updated }, { merge: true }); } catch (e) { console.error(e); }
          }
        }
      },
      deletePersonnel: async (id) => {
        set((state) => ({ personnel: state.personnel.filter(p => p.id !== id) }));
        if (auth.currentUser) {
          try { await deleteDoc(doc(db, `users/${auth.currentUser.uid}/personnel`, id)); } catch (e) { console.error(e); }
        }
      },

      visitors: initialVisitors,
      addVisitor: async (v) => {
        const newV = { ...v, id: crypto.randomUUID(), entryTime: new Date().toISOString(), uid: auth.currentUser?.uid };
        set((state) => ({ visitors: [newV, ...state.visitors] }));
        if (auth.currentUser) {
          try { await setDoc(doc(db, `users/${auth.currentUser.uid}/visitors`, newV.id), newV); } catch (e) { console.error(e); }
        }
      },
      updateVisitor: async (id, updated) => {
        set((state) => ({ visitors: state.visitors.map(v => v.id === id ? { ...v, ...updated } : v) }));
        if (auth.currentUser) {
          const v = get().visitors.find(v => v.id === id);
          if (v) {
            try { await setDoc(doc(db, `users/${auth.currentUser.uid}/visitors`, id), { ...v, ...updated }, { merge: true }); } catch (e) { console.error(e); }
          }
        }
      },
      deleteVisitor: async (id) => {
        set((state) => ({ visitors: state.visitors.filter(v => v.id !== id) }));
        if (auth.currentUser) {
          try { await deleteDoc(doc(db, `users/${auth.currentUser.uid}/visitors`, id)); } catch (e) { console.error(e); }
        }
      },

      importData: (data) => set((state) => ({ 
        personnel: data.personnel || state.personnel, 
        visitors: data.visitors || state.visitors,
        cities: data.cities || state.cities
      })),
      seedData: () => set({ personnel: initialPersonnel, visitors: initialVisitors }),
      
      syncFromFirebase: async () => {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;
        try {
          const pSnap = await getDocs(collection(db, `users/${uid}/personnel`));
          const vSnap = await getDocs(collection(db, `users/${uid}/visitors`));
          const cSnap = await getDocs(collection(db, `users/${uid}/cities`));
          
          const personnel = pSnap.docs.map(d => d.data() as Personnel);
          const visitors = vSnap.docs.map(d => d.data() as Visitor);
          const cities = cSnap.docs.map(d => d.data() as City);
          
          if (personnel.length > 0 || visitors.length > 0 || cities.length > 0) {
            set({ 
              personnel: personnel.length > 0 ? personnel : get().personnel, 
              visitors: visitors.length > 0 ? visitors : get().visitors,
              cities: cities.length > 0 ? cities : get().cities
            });
          } else {
            // If empty, sync local initial data to Firebase
            get().personnel.forEach(async p => {
              const newP = { ...p, uid };
              await setDoc(doc(db, `users/${uid}/personnel`, p.id), newP);
            });
            get().visitors.forEach(async v => {
              const newV = { ...v, uid };
              await setDoc(doc(db, `users/${uid}/visitors`, v.id), newV);
            });
            get().cities.forEach(async c => {
              const newC = { ...c, uid };
              await setDoc(doc(db, `users/${uid}/cities`, c.id), newC);
            });
          }
        } catch (e) {
          console.error("Error syncing from Firebase", e);
        }
      },

      backupToFirebase: async () => {
        if (!auth.currentUser) throw new Error("Giriş yapılmadı");
        const uid = auth.currentUser.uid;
        try {
          const promises: Promise<void>[] = [];
          get().personnel.forEach(p => {
            const newP = { ...p, uid };
            promises.push(setDoc(doc(db, `users/${uid}/personnel`, p.id), newP));
          });
          get().visitors.forEach(v => {
            const newV = { ...v, uid };
            promises.push(setDoc(doc(db, `users/${uid}/visitors`, v.id), newV));
          });
          get().cities.forEach(c => {
            const newC = { ...c, uid };
            promises.push(setDoc(doc(db, `users/${uid}/cities`, c.id), newC));
          });
          await Promise.all(promises);
        } catch (e) {
          console.error("Error backing up to Firebase", e);
          throw e;
        }
      },

      restoreFromFirebase: async () => {
        if (!auth.currentUser) throw new Error("Giriş yapılmadı");
        const uid = auth.currentUser.uid;
        try {
          const pSnap = await getDocs(collection(db, `users/${uid}/personnel`));
          const vSnap = await getDocs(collection(db, `users/${uid}/visitors`));
          const cSnap = await getDocs(collection(db, `users/${uid}/cities`));
          
          const personnel = pSnap.docs.map(d => d.data() as Personnel);
          const visitors = vSnap.docs.map(d => d.data() as Visitor);
          const cities = cSnap.docs.map(d => d.data() as City);
          
          set({ 
            personnel: personnel.length > 0 ? personnel : get().personnel, 
            visitors: visitors.length > 0 ? visitors : get().visitors,
            cities: cities.length > 0 ? cities : get().cities
          });
        } catch (e) {
          console.error("Error restoring from Firebase", e);
          throw e;
        }
      }
    }),
    {
      name: 'security-assistant-storage',
    }
  )
);

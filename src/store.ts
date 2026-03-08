import { create } from 'zustand';

interface AppState {
  theme: string;
  setTheme: (theme: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  currentStation: any | null;
  isPlaying: boolean;
  setCurrentStation: (station: any) => void;
  setIsPlaying: (playing: boolean) => void;
}

const getInitialDarkMode = () => {
  try {
    return localStorage.getItem('darkMode') === 'true';
  } catch (e) {
    return false;
  }
};

export const useAppStore = create<AppState>((set) => ({
  theme: 'blue',
  setTheme: (theme) => set({ theme }),
  darkMode: getInitialDarkMode(),
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    try {
      localStorage.setItem('darkMode', String(newMode));
    } catch (e) {
      console.warn('LocalStorage access denied');
    }
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { darkMode: newMode };
  }),
  isDrawerOpen: false,
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  closeDrawer: () => set({ isDrawerOpen: false }),
  currentStation: null,
  isPlaying: false,
  setCurrentStation: (station) => set({ currentStation: station, isPlaying: true }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));

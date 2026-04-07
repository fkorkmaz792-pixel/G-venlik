import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

export async function initializeCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Handle Android Back Button
  App.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      App.exitApp();
    } else {
      window.history.back();
    }
  });

  // Configure Status Bar
  try {
    const isDarkMode = localStorage.getItem('security-assistant-storage') 
      ? JSON.parse(localStorage.getItem('security-assistant-storage')!).state.darkMode 
      : false;

    await StatusBar.setStyle({
      style: isDarkMode ? Style.Dark : Style.Light,
    });
    
    // For Android, make it transparent or match theme
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: isDarkMode ? '#000000' : '#F2F2F7' });
    }
  } catch (e) {
    console.warn('StatusBar error:', e);
  }

  // Keyboard handling
  Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-is-open');
  });
  Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-is-open');
  });
}

export function triggerHaptic() {
  if (Capacitor.isNativePlatform()) {
    Haptics.impact({ style: ImpactStyle.Light });
  }
}

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.guvenlik.asistani',
  appName: 'Güvenlik Asistanı V2',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

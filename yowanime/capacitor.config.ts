import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yumenime.app',
  appName: 'Yumenime',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

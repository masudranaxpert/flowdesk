import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.flowdesk.app',
  appName: 'FlowDesk',
  webDir: 'dist',
  server: {
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#488AFF"
    }
  },
};

export default config;

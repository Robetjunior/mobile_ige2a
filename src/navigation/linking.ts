// Dynamic linking config to support web preview ports (8081, 8083) and https
const origin =
  typeof window !== 'undefined' && (window as any)?.location?.origin
    ? (window as any).location.origin
    : 'exp://localhost';

export const linking = {
  prefixes: [origin, 'ev://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Charge: 'charge',
          Record: 'record',
          Me: 'profile',
          QRScanner: 'qr-scanner',
        },
      },
      StationDetail: 'station/:stationId',
      SessionDetail: 'record/session/:id',
      Settings: 'settings',
      SettingsLanguage: 'settings/language',
      SettingsPassword: 'settings/password',
      SettingsPhone: 'settings/phone',
      SettingsPile: 'settings/pile',
      AccountCancel: 'settings/account-cancel',
      Favorites: 'favorites',
      Cards: 'cards',
    },
  },
};

export default linking;
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import StationDetailScreen from '../screens/StationDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import linking from './linking';
import SettingsScreen from '../screens/SettingsScreen';
import SettingsLanguageScreen from '../screens/settings/SettingsLanguageScreen';
import SettingsPasswordScreen from '../screens/settings/SettingsPasswordScreen';
import SettingsPhoneScreen from '../screens/settings/SettingsPhoneScreen';
import SettingsPileScreen from '../screens/settings/SettingsPileScreen';
import AccountCancelScreen from '../screens/settings/AccountCancelScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import CardsScreen from '../screens/CardsScreen';

export type RootStackParamList = {
  Main: undefined;
  StationDetail: { stationId: string; connectorId?: string };
  QRScanner: undefined;
  SessionDetail: { id: string };
  Settings: undefined;
  SettingsLanguage: undefined;
  SettingsPassword: undefined;
  SettingsPhone: undefined;
  SettingsPile: undefined;
  AccountCancel: undefined;
  Favorites: undefined;
  Cards: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  // Using dynamic linking from navigation/linking to handle 8081/8083/https origins

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen 
          name="StationDetail" 
          component={StationDetailScreen}
          options={{
            headerShown: true,
            title: 'Station Details',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen 
          name="QRScanner" 
          component={QRScannerScreen}
          options={{
            headerShown: true,
            title: 'Scan QR Code',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen 
          name="SessionDetail" 
          component={SessionDetailScreen}
          options={{
            headerShown: true,
            title: 'Session Details',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsLanguage" component={SettingsLanguageScreen} options={{ headerShown: true, title: 'Language', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPassword" component={SettingsPasswordScreen} options={{ headerShown: true, title: 'Change Password', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPhone" component={SettingsPhoneScreen} options={{ headerShown: true, title: 'Phone', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPile" component={SettingsPileScreen} options={{ headerShown: true, title: 'Pile setting', headerBackTitleVisible: false }} />
        <Stack.Screen name="AccountCancel" component={AccountCancelScreen} options={{ headerShown: true, title: 'Account Cancellation', headerBackTitleVisible: false }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Favorites', headerBackTitleVisible: false }} />
        <Stack.Screen name="Cards" component={CardsScreen} options={{ headerShown: true, title: 'My Card', headerBackTitleVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
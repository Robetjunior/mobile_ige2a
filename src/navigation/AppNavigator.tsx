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
import SupportScreen from '../screens/SupportScreen';
import AboutScreen from '../screens/AboutScreen';

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
  Support: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
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
            title: 'Detalhes da Estação',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{
            headerShown: true,
            title: 'Escanear QR Code',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen
          name="SessionDetail"
          component={SessionDetailScreen}
          options={{
            headerShown: true,
            title: 'Detalhes da Sessão',
            headerBackTitleVisible: false,
          }}
        />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Configurações', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsLanguage" component={SettingsLanguageScreen} options={{ headerShown: true, title: 'Idioma', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPassword" component={SettingsPasswordScreen} options={{ headerShown: true, title: 'Alterar Senha', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPhone" component={SettingsPhoneScreen} options={{ headerShown: true, title: 'Telefone', headerBackTitleVisible: false }} />
        <Stack.Screen name="SettingsPile" component={SettingsPileScreen} options={{ headerShown: true, title: 'Configurações do Carregador', headerBackTitleVisible: false }} />
        <Stack.Screen name="AccountCancel" component={AccountCancelScreen} options={{ headerShown: true, title: 'Cancelamento de Conta', headerBackTitleVisible: false }} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: true, title: 'Favoritos', headerBackTitleVisible: false }} />
        <Stack.Screen name="Cards" component={CardsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: true, title: 'Ajuda/Suporte', headerBackTitleVisible: false }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: true, title: 'Sobre', headerBackTitleVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;



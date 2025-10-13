import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import StationDetailScreen from '../screens/StationDetailScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import linking from './linking';

export type RootStackParamList = {
  Main: undefined;
  StationDetail: { stationId: string; connectorId?: string };
  QRScanner: undefined;
  SessionDetail: { id: string };
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens (we'll create these next)
import HomeScreen from '../screens/HomeScreen';
import ChargeScreen from '../screens/ChargeScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import RecordScreen from '../screens/RecordScreen';
import ProfileMeScreen from '../screens/ProfileMeScreen';
import ErrorBoundary from '../components/ErrorBoundary';

export type TabParamList = {
  Home: undefined;
  Charge: { chargeBoxId?: string } | undefined;
  QRScanner: undefined;
  Record: undefined;
  Me: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<CustomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter((r: any) => r.name !== 'QRScanner');
  const leftRoutes = visibleRoutes.slice(0, 2);
  const rightRoutes = visibleRoutes.slice(2);

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 0), }] }>
      {/* Left icons */}
      <View style={styles.sideGroup}>
      {leftRoutes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIconName = (routeName: string, focused: boolean) => {
          switch (routeName) {
            case 'Home':
              return focused ? 'home' : 'home-outline';
            case 'Charge':
              return focused ? 'flash' : 'flash-outline';
            case 'Record':
              return focused ? 'document-text' : 'document-text-outline';
            case 'Me':
              return focused ? 'person' : 'person-outline';
            default:
              return 'help-outline';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={getIconName(route.name, isFocused) as any}
              size={SIZES.iconMD}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>

      {/* Center placeholder for FAB */}
      <View style={styles.centerPlaceholder} />

      {/* Right icons */}
      <View style={styles.sideGroup}>
      {rightRoutes.map((route: any) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const getIconName = (routeName: string, focused: boolean) => {
          switch (routeName) {
            case 'Home':
              return focused ? 'home' : 'home-outline';
            case 'Charge':
              return focused ? 'flash' : 'flash-outline';
            case 'Record':
              return focused ? 'document-text' : 'document-text-outline';
            case 'Me':
              return focused ? 'person' : 'person-outline';
            default:
              return 'help-outline';
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons
              name={getIconName(route.name, isFocused) as any}
              size={SIZES.iconMD}
              color={isFocused ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
      </View>

      {/* Central FAB QR */}
      <TouchableOpacity
        style={[styles.qrFab, { bottom: Math.max(insets.bottom, 0) + 36 }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('QRScanner')}
      >
        <View style={styles.qrRing} />
        <Ionicons name="qr-code" size={28} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" children={() => (<ErrorBoundary><HomeScreen /></ErrorBoundary>)} />
      <Tab.Screen name="Charge" children={() => (<ErrorBoundary><ChargeScreen /></ErrorBoundary>)} />
      <Tab.Screen name="QRScanner" component={QRScannerScreen} />
      <Tab.Screen name="Record" children={() => (<ErrorBoundary><RecordScreen /></ErrorBoundary>)} />
      <Tab.Screen name="Me" children={() => (<ErrorBoundary><ProfileMeScreen /></ErrorBoundary>)} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    paddingTop: 8,
    paddingHorizontal: 24,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 68,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 10,
  },
  sideGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24 as any,
    flex: 1,
  },
  centerPlaceholder: {
    width: 72,
    height: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.xs,
  },
  tabLabel: {
    marginTop: 4,
    fontSize: SIZES.fontXS,
    color: COLORS.textSecondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  qrFab: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -32 }],
    width: 64,
    height: 64,
    borderRadius: 64,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 20,
    pointerEvents: 'auto',
  },
  qrRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 64,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default TabNavigator;
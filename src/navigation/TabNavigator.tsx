import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

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
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel !== undefined ? options.tabBarLabel : route.name;
        const isFocused = state.index === index;

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

        // Skip rendering the QRScanner tab as it's handled by the FAB
        if (route.name === 'QRScanner') {
          return null;
        }

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
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 6,
    paddingTop: 6,
    paddingHorizontal: SIZES.md,
    position: 'relative',
    height: 60,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
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
});

export default TabNavigator;
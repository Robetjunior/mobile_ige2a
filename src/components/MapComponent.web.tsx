import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Station } from '../types';
import { COLORS, SIZES } from '../constants';

interface MapComponentProps {
  mapRef: any;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onRegionChangeComplete: (region: any) => void;
  hasPermission: boolean;
  stations: Station[];
  onMarkerPress: (station: Station) => void;
  getMarkerColor: (status: string) => string;
}

export const MapComponent: React.FC<MapComponentProps> = () => {
  return <View style={{ flex: 1 }} />;
};
import React from 'react';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
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

export const MapComponent: React.FC<MapComponentProps> = ({
  mapRef,
  mapRegion,
  onRegionChangeComplete,
  hasPermission,
  stations,
  onMarkerPress,
  getMarkerColor,
}) => {
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="map" size={48} color={COLORS.gray} />
        <Text style={{ color: COLORS.gray, marginTop: SIZES.base }}>
          Mapa indisponível no web. Use o app móvel.
        </Text>
      </View>
    );
  }

  // Lazy require to avoid bundling on web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { default: MapView, Marker, Callout } = require('react-native-maps');

  const stationsWithCoords = stations.filter(
    (s) => typeof s.latitude === 'number' && typeof s.longitude === 'number'
  );

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      initialRegion={mapRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={hasPermission}
      accessibilityLabel="Mapa de estações"
    >
      {stationsWithCoords.map((s) => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.latitude as number, longitude: s.longitude as number }}
          pinColor={getMarkerColor(s.status)}
          accessibilityLabel={`Estação ${s.name}`}
          onPress={() => onMarkerPress(s)}
        >
          <Callout onPress={() => onMarkerPress(s)}>
            <View style={{ maxWidth: 240 }}>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>{s.name}</Text>
              <Text style={{ color: COLORS.textSecondary, marginBottom: 6 }}>{s.address}</Text>
              <TouchableOpacity
                onPress={() => onMarkerPress(s)}
                accessibilityLabel={`Abrir detalhes de ${s.name}`}
                style={{ backgroundColor: COLORS.primary, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Detalhes</Text>
              </TouchableOpacity>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
};
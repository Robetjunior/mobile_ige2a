import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { Station } from '../types';
import { COLORS } from '../constants';

type HomeMapProps = {
  stations: Station[];
  onMarkerPress: (station: Station) => void;
  getMarkerColor?: (status: string) => string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
};

const DEFAULT_CENTER = { lat: -23.5231248, lng: -46.7073544 };

export const HomeMap: React.FC<HomeMapProps> = ({
  stations,
  onMarkerPress,
  getMarkerColor,
  initialCenter = DEFAULT_CENTER,
  initialZoom = 13,
}) => {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const apiKey =
    (process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string) ||
    (process?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) ||
    '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  });

  const markers = useMemo(() => {
    const fromStore = (stations || [])
      .filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number')
      .map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        position: { lat: s.latitude as number, lng: s.longitude as number },
        station: s,
      }));
    return fromStore;
  }, [stations]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const statusToIcon = useCallback((status: string) => {
    const color = getMarkerColor ? getMarkerColor(status) : undefined;
    if (color === COLORS.success || status === 'online') return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (color === COLORS.warning || status === 'busy') return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    return 'http://maps.google.com/mapfiles/ms/icons/grey-dot.png';
  }, [getMarkerColor]);

  if (loadError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Falha ao carregar Google Maps</Text>
        {!apiKey && (
          <Text style={{ color: '#6B7280', marginTop: 6 }}>Defina EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</Text>
        )}
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Carregando mapa…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} accessible accessibilityLabel="Mapa de carregadores">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={initialCenter}
        zoom={initialZoom}
        options={{
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          backgroundColor: '#FFFFFF',
        }}
      >
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={m.position}
            onClick={() => setSelectedId(m.id)}
            icon={statusToIcon(m.status)}
            title={m.name}
          />
        ))}

        {markers.map((m) => (
          selectedId === m.id ? (
            <InfoWindow key={`info-${m.id}`} position={m.position} onCloseClick={() => setSelectedId(null)}>
              <div style={{ maxWidth: 220 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                <div style={{ color: '#6B7280', marginBottom: 8 }}>Status: {m.status}</div>
                <button
                  onClick={() => onMarkerPress(m.station)}
                  style={{
                    background: '#16A34A',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Ver detalhes
                </button>
              </div>
            </InfoWindow>
          ) : null
        ))}
      </GoogleMap>
    </View>
  );
};

export default HomeMap;
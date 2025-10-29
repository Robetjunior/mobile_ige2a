import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useJsApiLoader, GoogleMap, Marker, InfoWindow, MarkerClustererF } from '@react-google-maps/api';
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

  // Ajusta marcadores com mesma coordenada para evitar sobreposição total
  const offsetMarkers = useMemo(() => {
    const groups = new Map<string, typeof markers>();
    const keyOf = (p: { lat: number; lng: number }) => `${p.lat.toFixed(6)}:${p.lng.toFixed(6)}`;
    for (const m of markers) {
      const k = keyOf(m.position);
      const arr = groups.get(k) || [];
      arr.push(m);
      groups.set(k, arr);
    }

    const adjusted: typeof markers = [];
    const baseDelta = 0.00025; // ~27m aprox.
    groups.forEach((arr) => {
      if (arr.length === 1) {
        adjusted.push(arr[0]);
        return;
      }
      // Distribui em círculo ao redor da posição original
      const center = arr[0].position;
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n;
        const dy = Math.sin(angle) * baseDelta;
        const dx = Math.cos(angle) * baseDelta;
        adjusted.push({
          ...arr[i],
          position: { lat: center.lat + dy, lng: center.lng + dx },
        });
      }
    });

    return adjusted;
  }, [markers]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Gera marcador SVG com cor definida, evitando pixelização em zoom.
  const buildSvgMarker = (hex: string) => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
  <g fill="none">
    <path d="M18 2c8 0 14 6 14 14 0 9-12 17-14 18-2-1-14-9-14-18 0-8 6-14 14-14z" fill="${hex}" stroke="#1F2937" stroke-width="1"/>
    <circle cx="18" cy="16" r="5" fill="#FFFFFF"/>
  </g>
 </svg>`;
    const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    const g = (window as any)?.google?.maps;
    if (g) {
      const size = new g.Size(36, 36);
      return {
        url,
        scaledSize: size,
        anchor: new g.Point(18, 36),
      } as google.maps.Icon;
    }
    return url;
  };

  const statusToIcon = useCallback((status: string) => {
    const custom = getMarkerColor ? getMarkerColor(status) : undefined;
    const hex = custom
      || (status === 'online' ? COLORS.online : status === 'busy' ? COLORS.busy : COLORS.offline);

    const g = (window as any)?.google?.maps;
    if (g) {
      const symbol: google.maps.Symbol = {
        path: g.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: hex,
        fillOpacity: 1,
        strokeColor: '#1F2937',
        strokeOpacity: 0.9,
        strokeWeight: 1.2,
        anchor: new g.Point(0, 0),
      };
      return symbol;
    }

    return buildSvgMarker(hex);
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
        <MarkerClustererF options={{ gridSize: 60, minimumClusterSize: 2 }}>
          {(clusterer) => (
            <>
              {offsetMarkers.map((m) => (
                <Marker
                  key={m.id}
                  position={m.position}
                  onClick={() => setSelectedId(m.id)}
                  icon={statusToIcon(m.status)}
                  options={{ optimized: false }}
                  title={m.name}
                  clusterer={clusterer}
                />
              ))}
            </>
          )}
        </MarkerClustererF>

        {offsetMarkers.map((m) => (
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
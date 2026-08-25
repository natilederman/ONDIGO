import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../lib/theme';

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  color?: string;
}

// react-native-maps needs native code that isn't included in the standard Expo Go
// client (only a custom dev build has it). Require it lazily and fall back to a
// plain list of locations if it's unavailable, instead of crashing the whole screen.
let NativeMaps: typeof import('react-native-maps') | null = null;
let nativeMapsLoadFailed = false;
try {
  NativeMaps = require('react-native-maps');
} catch {
  nativeMapsLoadFailed = true;
}

function Fallback({ markers }: { markers: MapMarker[] }) {
  return (
    <View style={[styles.wrap, styles.fallback]}>
      <Text style={styles.fallbackTitle}>Map preview unavailable</Text>
      <Text style={styles.fallbackHint}>
        (react-native-maps needs a custom dev build — it doesn&apos;t run inside Expo Go)
      </Text>
      {markers.map((m, i) => (
        <View key={i} style={styles.fallbackRow}>
          <View style={[styles.dot, { backgroundColor: m.color ?? colors.ink }]} />
          <Text style={styles.fallbackLabel}>{m.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function OndigoMapView({
  markers,
  polyline,
  height = 220,
}: {
  markers: MapMarker[];
  polyline?: [number, number][];
  height?: number;
}) {
  const ref = useRef<any>(null);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    if (!NativeMaps || markers.length < 2 || !ref.current) return;
    try {
      ref.current.fitToCoordinates(
        markers.map((m) => ({ latitude: m.lat, longitude: m.lng })),
        { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true }
      );
    } catch {
      // ignore — native view may not be ready yet
    }
  }, [markers]);

  if (markers.length === 0) return null;
  if (!NativeMaps || nativeMapsLoadFailed || renderError) {
    return <Fallback markers={markers} />;
  }

  const { default: MapView, Marker, Polyline } = NativeMaps;

  return (
    <View style={[styles.wrap, { height }]}>
      <ErrorGuard onError={() => setRenderError(true)}>
        <MapView
          ref={ref}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: markers[0].lat,
            longitude: markers[0].lng,
            latitudeDelta: 4,
            longitudeDelta: 4,
          }}
        >
          {polyline && (
            <Polyline
              coordinates={polyline.map(([lat, lng]) => ({ latitude: lat, longitude: lng }))}
              strokeColor={colors.accent}
              strokeWidth={3}
            />
          )}
          {markers.map((m, i) => (
            <Marker key={i} coordinate={{ latitude: m.lat, longitude: m.lng }} title={m.label}>
              <View style={[styles.dot, { backgroundColor: m.color ?? colors.ink }]} />
            </Marker>
          ))}
        </MapView>
      </ErrorGuard>
    </View>
  );
}

class ErrorGuard extends Component<{ children: ReactNode; onError: () => void }> {
  static getDerivedStateFromError() {
    return {};
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  fallback: { padding: 16, gap: 10, backgroundColor: '#FAFAFA' },
  fallbackTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  fallbackHint: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  fallbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fallbackLabel: { fontSize: 13, color: colors.ink },
});

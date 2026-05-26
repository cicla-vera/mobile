import { Feather } from '@expo/vector-icons';
import { Component, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Platform, UIManager, View, type LayoutChangeEvent } from 'react-native';

import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import { colors } from '@/constants/theme';

import { LocationMapPickerControls } from '@/components/vera/location-map-picker-controls';
import {
  DEFAULT_DELTA,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  formatCoordinate,
  getSelectionState,
  locationMapPickerStyles as styles,
  type LocationMapPickerProps,
} from '@/components/vera/location-map-picker.shared';

import { AppText } from '@/components/ui/app-text';

function regionForLocation(
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Region {
  const radiusFactor = Math.max(radiusMeters / 111_000, 0.002);
  const latitudeDelta = Math.max(radiusFactor * 4, DEFAULT_DELTA);
  const longitudeDelta =
    latitudeDelta / Math.max(Math.cos((latitude * Math.PI) / 180), 0.2);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

function isNativeMapAvailable() {
  return (
    UIManager.getViewManagerConfig?.('AIRMap') != null ||
    UIManager.hasViewManagerConfig?.('AIRMap') === true
  );
}

type MapErrorBoundaryProps = {
  fallback: ReactNode;
  children: ReactNode;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export function LocationMapPicker(props: LocationMapPickerProps) {
  const fallback = (
    <LocationMapPickerFallback {...props} unavailableNativeModule />
  );

  if (!isNativeMapAvailable()) {
    return fallback;
  }

  return (
    <MapErrorBoundary fallback={fallback}>
      <LocationMapPickerNative {...props} />
    </MapErrorBoundary>
  );
}

function LocationMapPickerFallback({
  latitude,
  longitude,
  radiusMeters,
  type,
  disabled = false,
  onRadiusChange,
  unavailableNativeModule = false,
}: LocationMapPickerProps & { unavailableNativeModule?: boolean }) {
  const { hasSelection } = getSelectionState(latitude, longitude);

  return (
    <View style={styles.container}>
      <View style={styles.fallbackPanel}>
        <Feather name="map" size={24} color={colors.mint} />
        <AppText variant="label">Mapa indisponivel neste ambiente</AppText>
        <AppText variant="caption" tone="muted" style={styles.fallbackText}>
          {unavailableNativeModule
            ? 'O mapa nativo nao esta no app instalado. Rode: npx expo prebuild --clean && npx expo run:android --device'
            : 'Use "Usar localizacao atual" para marcar o ponto.'}
        </AppText>
        {hasSelection ? (
          <AppText variant="caption" style={styles.coordinateSummary}>
            {latitude}, {longitude}
          </AppText>
        ) : null}
      </View>

      <LocationMapPickerControls
        latitude={latitude}
        longitude={longitude}
        radiusMeters={radiusMeters}
        type={type}
        hasSelection={hasSelection}
        disabled={disabled}
        onRadiusChange={onRadiusChange}
      />
    </View>
  );
}

function LocationMapPickerNative({
  latitude,
  longitude,
  radiusMeters,
  type,
  disabled = false,
  onLocationChange,
  onRadiusChange,
}: LocationMapPickerProps) {
  const mapRef = useRef<MapView>(null);
  const { parsedLatitude, parsedLongitude, hasSelection } = getSelectionState(
    latitude,
    longitude,
  );
  const parsedRadius = Number(radiusMeters);
  const isRisk = type === 'RISK';
  const circleColor = isRisk ? colors.coral : colors.mint;
  const fillColor = isRisk
    ? 'rgba(242, 97, 126, 0.18)'
    : 'rgba(142, 207, 184, 0.28)';

  const mapRegion = useMemo(() => {
    if (hasSelection && parsedLatitude !== null && parsedLongitude !== null) {
      return regionForLocation(
        parsedLatitude,
        parsedLongitude,
        Number.isFinite(parsedRadius) ? parsedRadius : 100,
      );
    }

    return {
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    };
  }, [hasSelection, parsedLatitude, parsedLongitude, parsedRadius]);

  useEffect(() => {
    if (!hasSelection || parsedLatitude === null || parsedLongitude === null) {
      return;
    }

    mapRef.current?.animateToRegion(
      regionForLocation(
        parsedLatitude,
        parsedLongitude,
        Number.isFinite(parsedRadius) ? parsedRadius : 100,
      ),
      350,
    );
  }, [hasSelection, parsedLatitude, parsedLongitude, parsedRadius]);

  function handleMapPress(coordinate: { latitude: number; longitude: number }) {
    if (disabled) {
      return;
    }

    onLocationChange(
      formatCoordinate(coordinate.latitude),
      formatCoordinate(coordinate.longitude),
    );
  }

  function handleMapLayout(event: LayoutChangeEvent) {
    if (!hasSelection || parsedLatitude === null || parsedLongitude === null) {
      return;
    }

    const { width, height } = event.nativeEvent.layout;

    if (width > 0 && height > 0) {
      mapRef.current?.animateToRegion(
        regionForLocation(
          parsedLatitude,
          parsedLongitude,
          Number.isFinite(parsedRadius) ? parsedRadius : 100,
        ),
        0,
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={mapRegion}
          onLayout={handleMapLayout}
          onPress={(event) => handleMapPress(event.nativeEvent.coordinate)}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          rotateEnabled={false}
        >
          {hasSelection && parsedLatitude !== null && parsedLongitude !== null ? (
            <>
              <Circle
                center={{
                  latitude: parsedLatitude,
                  longitude: parsedLongitude,
                }}
                radius={
                  Number.isFinite(parsedRadius) && parsedRadius >= 25
                    ? parsedRadius
                    : 100
                }
                fillColor={fillColor}
                strokeColor={circleColor}
                strokeWidth={2}
              />
              <Marker
                coordinate={{
                  latitude: parsedLatitude,
                  longitude: parsedLongitude,
                }}
                pinColor={isRisk ? colors.coral : colors.mint}
              />
            </>
          ) : null}
        </MapView>

        {!hasSelection ? (
          <View pointerEvents="none" style={styles.mapHint}>
            <AppText variant="caption" style={styles.mapHintText}>
              Toque no mapa para escolher o ponto
            </AppText>
          </View>
        ) : null}
      </View>

      <LocationMapPickerControls
        latitude={latitude}
        longitude={longitude}
        radiusMeters={radiusMeters}
        type={type}
        hasSelection={hasSelection}
        disabled={disabled}
        onRadiusChange={onRadiusChange}
      />
    </View>
  );
}

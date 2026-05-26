import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';

import { LocationMapPickerControls } from '@/components/vera/location-map-picker-controls';
import {
  getSelectionState,
  locationMapPickerStyles as styles,
  type LocationMapPickerProps,
} from '@/components/vera/location-map-picker.shared';

export function LocationMapPicker({
  latitude,
  longitude,
  radiusMeters,
  type,
  disabled = false,
  onRadiusChange,
}: LocationMapPickerProps) {
  const { hasSelection } = getSelectionState(latitude, longitude);

  return (
    <View style={styles.container}>
      <View style={styles.fallbackPanel}>
        <Feather name="map" size={24} color={colors.mint} />
        <AppText variant="label">Mapa no app mobile</AppText>
        <AppText variant="caption" tone="muted" style={styles.fallbackText}>
          O mapa interativo funciona no iOS e Android. Use &quot;Usar localizacao
          atual&quot; ou teste no celular.
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

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { VERA_HELP_RESOURCES } from '@/constants/vera-help-resources';
import { veraTheme } from '@/constants/vera-theme';
import { colors, radius, spacing } from '@/constants/theme';
import type { EmergencyContact, EvidenceRecord, SafetyLocation } from '@/types/vera.types';

type VaultSectionHeaderProps = {
  title: string;
  subtitle: string;
};

export function VaultSectionHeader({ title, subtitle }: VaultSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <AppText style={styles.sectionSubtitle}>{subtitle}</AppText>
    </View>
  );
}

type VaultContactsRowProps = {
  contacts: EmergencyContact[];
  loading: boolean;
  onAddPress: () => void;
};

export function VaultContactsRow({
  contacts,
  loading,
  onAddPress,
}: VaultContactsRowProps) {
  const enabledContacts = contacts.filter((contact) => contact.enabled);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContent}
    >
      {loading ? (
        <View style={styles.loadingChip}>
          <ActivityIndicator color={colors.muted} size="small" />
        </View>
      ) : (
        enabledContacts.map((contact) => (
          <Pressable
            key={contact.id}
            accessibilityRole="button"
            accessibilityLabel={`Contato ${contact.name}`}
            onPress={() => router.push('/(interior)/contacts')}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <View style={styles.avatarCircle}>
              <Feather name="user" size={22} color={colors.ink} />
            </View>
            <AppText style={styles.chipLabel} numberOfLines={2}>
              {contact.name}
            </AppText>
          </Pressable>
        ))
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar contato de emergencia"
        onPress={onAddPress}
        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      >
        <View style={[styles.avatarCircle, styles.addCircle]}>
          <Feather name="plus" size={22} color={colors.ink} />
        </View>
        <AppText style={styles.chipLabel}>Adicionar</AppText>
      </Pressable>
    </ScrollView>
  );
}

type VaultLocationsRowProps = {
  locations: SafetyLocation[];
  loading: boolean;
  onAddPress: () => void;
};

export function VaultLocationsRow({
  locations,
  loading,
  onAddPress,
}: VaultLocationsRowProps) {
  const enabledLocations = locations.filter((location) => location.enabled);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContent}
    >
      {loading ? (
        <View style={styles.loadingChip}>
          <ActivityIndicator color={colors.muted} size="small" />
        </View>
      ) : (
        enabledLocations.map((location) => (
          <Pressable
            key={location.id}
            accessibilityRole="button"
            accessibilityLabel={`Local ${location.name}`}
            onPress={() => router.push('/(interior)/locations')}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <View style={styles.avatarCircle}>
              <Feather name="map-pin" size={20} color={colors.ink} />
            </View>
            <AppText style={styles.chipLabel} numberOfLines={2}>
              {location.name}
            </AppText>
          </Pressable>
        ))
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Adicionar local monitorado"
        onPress={onAddPress}
        style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
      >
        <View style={[styles.avatarCircle, styles.addCircle]}>
          <Feather name="plus" size={22} color={colors.ink} />
        </View>
        <AppText style={styles.chipLabel}>Adicionar</AppText>
      </Pressable>
    </ScrollView>
  );
}

type VaultRecordingsRowProps = {
  records: EvidenceRecord[];
  loading: boolean;
};

function getRecordingIcon(type: EvidenceRecord['type']) {
  if (type === 'VIDEO') {
    return 'video' as const;
  }

  if (type === 'IMAGE') {
    return 'image' as const;
  }

  return 'music' as const;
}

export function VaultRecordingsRow({ records, loading }: VaultRecordingsRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rowContent}
    >
      {loading ? (
        <View style={styles.loadingChip}>
          <ActivityIndicator color={colors.muted} size="small" />
        </View>
      ) : records.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(interior)/evidence')}
          style={({ pressed }) => [styles.emptyRecording, pressed && styles.pressed]}
        >
          <Feather name="archive" size={22} color={colors.muted} />
          <AppText style={styles.emptyRecordingText}>
            Nenhuma gravacao no cofre
          </AppText>
        </Pressable>
      ) : (
        records.map((record) => (
          <Pressable
            key={record.id}
            accessibilityRole="button"
            accessibilityLabel={`Gravacao ${record.originalName ?? record.id}`}
            onPress={() => router.push('/(interior)/evidence')}
            style={({ pressed }) => [styles.recordingChip, pressed && styles.pressed]}
          >
            <View style={styles.recordingIcon}>
              <Feather
                name={getRecordingIcon(record.type)}
                size={22}
                color={colors.ink}
              />
            </View>
            <AppText style={styles.recordingLabel} numberOfLines={2}>
              {record.originalName ?? `Gravacao ${record.type.toLowerCase()}`}
            </AppText>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

export function VaultHelpResourcesRow() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.helpRowContent}
    >
      {VERA_HELP_RESOURCES.map((resource) => (
        <View key={resource.id} style={styles.helpChip}>
          <View style={styles.helpBadge}>
            <Feather name="heart" size={22} color={colors.pink} />
          </View>
          <AppText style={styles.helpLabel} numberOfLines={2}>
            {resource.name}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    gap: spacing[1],
    paddingHorizontal: spacing[6],
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: veraTheme.sectionTitle,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    color: veraTheme.sectionSubtitle,
  },
  rowContent: {
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  helpRowContent: {
    gap: spacing[3],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  chip: {
    width: 68,
    alignItems: 'center',
    gap: spacing[2],
  },
  avatarCircle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: veraTheme.chipBackground,
  },
  addCircle: {
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  chipLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.88)',
    textAlign: 'center',
  },
  loadingChip: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  recordingChip: {
    width: 72,
    alignItems: 'center',
    gap: spacing[2],
  },
  recordingIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  recordingLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: colors.ink,
    textAlign: 'center',
  },
  emptyRecording: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: veraTheme.emptyBorder,
    backgroundColor: veraTheme.emptyBackground,
  },
  emptyRecordingText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
  helpChip: {
    width: 72,
    alignItems: 'center',
    gap: spacing[2],
  },
  helpBadge: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  helpLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.62)',
    textAlign: 'center',
  },
});

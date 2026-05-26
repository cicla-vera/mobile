import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import {
  useImportAppleHealthMutation,
  useImportFloMutation,
  useImportHealthConnectMutation,
} from '@/hooks/useDataImport';
import { getApiErrorMessage } from '@/services/api-error';
import type { AppleHealthImportPayload } from '@/services/data-import.service';
import type {
  DataImportCounters,
  DataImportResult,
} from '@/types/api.types';

type ImportSource = 'flo' | 'apple-health' | 'health-connect';

type SelectedImportFile = {
  name: string;
  size?: number;
  records: number;
};

type ImportConfig = {
  source: ImportSource;
  eyebrow: string;
  title: string;
  heroIcon: keyof typeof Feather.glyphMap;
  heroTitle: string;
  heroText: string;
  fileTypeLabel: string;
  pickerTypes: string[];
  emptyText: string;
  invalidFileMessage: string;
  selectButtonLabel: string;
  importButtonLabel: string;
};

type ParsedImportPayload = {
  payload: unknown;
  records: number;
};

const importConfigs: Record<ImportSource, ImportConfig> = {
  flo: {
    source: 'flo',
    eyebrow: 'Importacao',
    title: 'Dados do Flo',
    heroIcon: 'upload-cloud',
    heroTitle: 'JSON exportado',
    heroText:
      'Traga historico de ciclo, sintomas e bem-estar sem preencher tudo novamente.',
    fileTypeLabel: '.json',
    pickerTypes: ['application/json', 'text/json', 'text/plain'],
    emptyText: 'Selecione o arquivo JSON exportado pelo Flo.',
    invalidFileMessage:
      'Nao foi possivel ler esse arquivo. Selecione um JSON valido do Flo.',
    selectButtonLabel: 'Selecionar JSON',
    importButtonLabel: 'Importar dados',
  },
  'apple-health': {
    source: 'apple-health',
    eyebrow: 'Integracao',
    title: 'Apple Health',
    heroIcon: 'heart',
    heroTitle: 'export.xml',
    heroText:
      'Importe ciclo, temperatura, peso, agua, sono e outros registros do app Saude.',
    fileTypeLabel: '.xml',
    pickerTypes: ['application/xml', 'text/xml', 'text/plain'],
    emptyText: 'Selecione o export.xml gerado pelo Apple Health.',
    invalidFileMessage:
      'Nao foi possivel ler esse arquivo. Selecione um export.xml valido do Apple Health.',
    selectButtonLabel: 'Selecionar XML',
    importButtonLabel: 'Importar Apple Health',
  },
  'health-connect': {
    source: 'health-connect',
    eyebrow: 'Integracao',
    title: 'Health Connect',
    heroIcon: 'activity',
    heroTitle: 'JSON do Android',
    heroText:
      'Traga registros do Saude Connect, como ciclo, sono, agua, peso e atividade.',
    fileTypeLabel: '.json',
    pickerTypes: ['application/json', 'text/json', 'text/plain'],
    emptyText: 'Selecione um JSON exportado ou preparado do Health Connect.',
    invalidFileMessage:
      'Nao foi possivel ler esse arquivo. Selecione um JSON valido do Health Connect.',
    selectButtonLabel: 'Selecionar JSON',
    importButtonLabel: 'Importar Health Connect',
  },
};

const counterLabels: Array<{
  key: keyof DataImportCounters;
  label: string;
}> = [
  { key: 'cycles', label: 'ciclos' },
  { key: 'flowEntries', label: 'fluxo' },
  { key: 'symptomEntries', label: 'sintomas' },
  { key: 'moodEntries', label: 'humor' },
  { key: 'notes', label: 'notas' },
  { key: 'temperatureEntries', label: 'temperatura' },
  { key: 'weightEntries', label: 'peso' },
  { key: 'waterEntries', label: 'agua' },
  { key: 'activityEntries', label: 'atividade' },
  { key: 'sleepEntries', label: 'sono' },
  { key: 'intercourseEntries', label: 'relacoes' },
  { key: 'medicationEntries', label: 'medicamentos' },
  { key: 'skipped', label: 'ignorados' },
];

export default function DataImportRoute() {
  const params = useLocalSearchParams<{ source?: string }>();
  const config = importConfigs[getImportSource(params.source)];
  const insets = useSafeAreaInsets();
  const importFloMutation = useImportFloMutation();
  const importAppleHealthMutation = useImportAppleHealthMutation();
  const importHealthConnectMutation = useImportHealthConnectMutation();
  const [payload, setPayload] = useState<unknown | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedImportFile | null>(
    null,
  );
  const [result, setResult] = useState<DataImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeMutation =
    config.source === 'apple-health'
      ? importAppleHealthMutation
      : config.source === 'health-connect'
        ? importHealthConnectMutation
      : importFloMutation;
  const importedTotal = useMemo(
    () => (result ? getImportedTotal(result.imported) : 0),
    [result],
  );

  async function handlePickFile() {
    setErrorMessage(null);
    setResult(null);

    try {
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: config.pickerTypes,
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets[0];

      if (!asset) {
        setErrorMessage('Nenhum arquivo foi selecionado.');
        return;
      }

      const text = await readDocumentText(asset);
      const parsed = parseImportPayload(text, config.source);

      setPayload(parsed.payload);
      setSelectedFile({
        name: asset.name,
        size: asset.size,
        records: parsed.records,
      });
    } catch {
      setPayload(null);
      setSelectedFile(null);
      setErrorMessage(config.invalidFileMessage);
    }
  }

  async function handleImport() {
    if (!payload) {
      setErrorMessage('Selecione um arquivo antes de importar.');
      return;
    }

    setErrorMessage(null);
    setResult(null);

    try {
      const importResult = await submitImportPayload(payload);

      setResult(importResult);
      setSelectedFile((current) =>
        current
          ? {
              ...current,
              records: importResult.processedRecords,
            }
          : current,
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, 'Nao foi possivel importar esse arquivo.'),
      );
    }
  }

  function submitImportPayload(currentPayload: unknown) {
    if (config.source === 'apple-health') {
      return importAppleHealthMutation.mutateAsync(
        currentPayload as AppleHealthImportPayload,
      );
    }

    if (config.source === 'health-connect') {
      return importHealthConnectMutation.mutateAsync(currentPayload);
    }

    return importFloMutation.mutateAsync(currentPayload);
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, spacing[8]) + spacing[6] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCopy}>
            <AppText variant="caption" tone="muted" style={styles.eyebrow}>
              {config.eyebrow}
            </AppText>
            <AppText variant="heading">{config.title}</AppText>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Feather name={config.heroIcon} size={23} color={colors.cream} />
          </View>
          <View style={styles.heroCopy}>
            <AppText variant="heading" tone="cream">
              {config.heroTitle}
            </AppText>
            <AppText style={styles.heroText}>{config.heroText}</AppText>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Arquivo</AppText>
            <AppText variant="caption" tone="muted">
              {config.fileTypeLabel}
            </AppText>
          </View>

          {selectedFile ? (
            <View style={styles.filePreview}>
              <View style={styles.fileIcon}>
                <Feather name="file-text" size={18} color={colors.blue} />
              </View>
              <View style={styles.fileCopy}>
                <AppText variant="label">{selectedFile.name}</AppText>
                <AppText variant="caption" tone="muted">
                  {formatFileSize(selectedFile.size)} -{' '}
                  {selectedFile.records} registros encontrados
                </AppText>
              </View>
            </View>
          ) : (
            <View style={styles.emptyBlock}>
              <Feather name="file-plus" size={18} color={colors.soft} />
              <AppText variant="caption" tone="muted" style={styles.emptyText}>
                {config.emptyText}
              </AppText>
            </View>
          )}

          {errorMessage ? (
            <View style={styles.notice}>
              <Feather name="alert-circle" size={17} color={colors.danger} />
              <AppText variant="caption" style={styles.noticeText}>
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              variant="secondary"
              onPress={() => void handlePickFile()}
              disabled={activeMutation.isPending}
              style={styles.actionButton}
            >
              {config.selectButtonLabel}
            </Button>
            <Button
              onPress={() => void handleImport()}
              loading={activeMutation.isPending}
              disabled={!payload || activeMutation.isPending}
              style={styles.actionButton}
            >
              {config.importButtonLabel}
            </Button>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Resultado</AppText>
            {activeMutation.isPending ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : (
              <AppText variant="caption" tone="muted">
                {result ? formatDate(result.generatedAt) : 'aguardando'}
              </AppText>
            )}
          </View>

          {result ? (
            <>
              <View style={styles.resultHero}>
                <AppText variant="heading">{importedTotal}</AppText>
                <AppText variant="caption" tone="muted">
                  itens importados de {result.processedRecords} registros
                  processados
                </AppText>
              </View>
              <View style={styles.countGrid}>
                {counterLabels.map((item) => (
                  <View key={item.key} style={styles.countItem}>
                    <AppText variant="label">
                      {String(result.imported[item.key])}
                    </AppText>
                    <AppText variant="caption" tone="muted">
                      {item.label}
                    </AppText>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyBlock}>
              <Feather name="bar-chart-2" size={18} color={colors.soft} />
              <AppText variant="caption" tone="muted" style={styles.emptyText}>
                O resumo aparece aqui depois da importacao.
              </AppText>
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

async function readDocumentText(asset: DocumentPicker.DocumentPickerAsset) {
  if (asset.file) {
    return asset.file.text();
  }

  return FileSystem.readAsStringAsync(asset.uri);
}

function getImportSource(value?: string): ImportSource {
  if (value === 'apple-health' || value === 'health-connect') {
    return value;
  }

  return 'flo';
}

function parseImportPayload(
  value: string,
  source: ImportSource,
): ParsedImportPayload {
  if (source === 'apple-health') {
    return parseAppleHealthPayload(value);
  }

  if (source === 'health-connect') {
    return parseJsonPayload(value);
  }

  return parseFloPayload(value);
}

function parseFloPayload(value: string): ParsedImportPayload {
  return parseJsonPayload(value);
}

function parseJsonPayload(value: string): ParsedImportPayload {
  const parsed = JSON.parse(value) as unknown;

  if (!isJsonRecord(parsed) && !Array.isArray(parsed)) {
    throw new Error('Invalid JSON root');
  }

  return {
    payload: parsed,
    records: countRecords(parsed),
  };
}

function parseAppleHealthPayload(value: string): ParsedImportPayload {
  const xml = value.trim();

  if (!/<HealthData[\s>]/.test(xml) || !/<Record[\s/>]/.test(xml)) {
    throw new Error('Invalid Apple Health export');
  }

  return {
    payload: { xml },
    records: countAppleHealthRecords(xml),
  };
}

function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function countRecords(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countRecords(item), 0);
  }

  if (!isJsonRecord(value)) {
    return 0;
  }

  const nestedRecords = Object.values(value).reduce<number>(
    (total, child) => total + countRecords(child),
    0,
  );

  return 1 + nestedRecords;
}

function countAppleHealthRecords(value: string) {
  return value.match(/<Record[\s/>]/g)?.length ?? 0;
}

function getImportedTotal(counters: DataImportCounters) {
  return counterLabels.reduce((total, item) => {
    if (item.key === 'skipped') {
      return total;
    }

    return total + counters[item.key];
  }, 0);
}

function formatFileSize(value?: number) {
  if (!value) {
    return 'tamanho desconhecido';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${Math.round(value / 102.4) / 10} KB`;
  }

  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'concluido';
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.md,
    backgroundColor: colors.plum,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: 0.16,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    backgroundColor: colors.coral,
  },
  heroCopy: {
    flex: 1,
  },
  heroText: {
    marginTop: spacing[1],
    color: 'rgba(255, 245, 236, 0.76)',
  },
  formCard: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  section: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  filePreview: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  fileIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.shell,
  },
  fileCopy: {
    flex: 1,
  },
  emptyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  emptyText: {
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[4],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  noticeText: {
    flex: 1,
    color: colors.danger,
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  actionButton: {
    alignSelf: 'stretch',
  },
  resultHero: {
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  countGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  countItem: {
    width: '48%',
    minHeight: 58,
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
});

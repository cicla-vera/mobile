import * as FileSystem from 'expo-file-system/legacy';

import type { EvidenceAnalysis } from '@/types/vera.types';

export type CachedEvidenceAnalysis = EvidenceAnalysis & {
  cachedAt: string;
};

const ANALYSIS_CACHE_FILE_NAME = 'vera-evidence-analysis-cache.json';

export async function getCachedEvidenceAnalysis(evidenceRecordId: string) {
  const cache = await readAnalysisCache();

  return cache[evidenceRecordId] ?? null;
}

export async function setCachedEvidenceAnalysis(analysis: EvidenceAnalysis) {
  const cache = await readAnalysisCache();

  cache[analysis.evidenceRecordId] = {
    ...analysis,
    cachedAt: new Date().toISOString(),
  };

  await writeAnalysisCache(cache);

  return cache[analysis.evidenceRecordId];
}

async function readAnalysisCache() {
  const fileUri = getAnalysisCacheFileUri();

  if (!fileUri) {
    return {};
  }

  const info = await FileSystem.getInfoAsync(fileUri);

  if (!info.exists) {
    return {};
  }

  try {
    const raw = await FileSystem.readAsStringAsync(fileUri);
    const parsed = JSON.parse(raw) as unknown;

    return isAnalysisCache(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAnalysisCache(
  cache: Record<string, CachedEvidenceAnalysis>,
) {
  const fileUri = getAnalysisCacheFileUri();

  if (!fileUri) {
    return;
  }

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(cache, null, 2));
}

function getAnalysisCacheFileUri() {
  return FileSystem.documentDirectory
    ? `${FileSystem.documentDirectory}${ANALYSIS_CACHE_FILE_NAME}`
    : null;
}

function isAnalysisCache(
  value: unknown,
): value is Record<string, CachedEvidenceAnalysis> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

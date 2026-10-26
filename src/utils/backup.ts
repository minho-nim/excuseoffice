import type { IssuedDocument, UserStats } from '../types';
import { getAllDocuments, importDocuments } from './db';
import { getUserStats, mergeUserStats, normalizeUserStats, saveUserStats } from './storage';

export function createBackup(documents: IssuedDocument[], stats: UserStats) {
  return {
    format: 'ExcuseOfficeBackup' as const,
    version: 1,
    createdAt: new Date().toISOString(),
    documents,
    stats: normalizeUserStats(stats),
  };
}

export async function restoreBackup(value: unknown): Promise<{ added: number; skipped: number; legacy: boolean }> {
  let documents: unknown[];
  let restoredStats: unknown;
  const legacy = Array.isArray(value);
  if (legacy) {
    documents = value;
  } else {
    if (!value || typeof value !== 'object') throw new Error('백업 파일인지 확인해 주세요.');
    const backup = value as Record<string, unknown>;
    if (backup.format !== 'ExcuseOfficeBackup' || backup.version !== 1 || !Array.isArray(backup.documents) ||
        !backup.stats || typeof backup.stats !== 'object' || Array.isArray(backup.stats)) {
      throw new Error('지원하지 않는 백업 형식이에요.');
    }
    documents = backup.documents;
    restoredStats = backup.stats;
  }
  const current = getUserStats();
  const result = await importDocuments(documents);
  const allDocuments = await getAllDocuments();
  saveUserStats(mergeUserStats(current, restoredStats, allDocuments), true);
  return { ...result, legacy };
}

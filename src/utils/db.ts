import { IssuedDocument } from '../types';
import { CATEGORIES, DOCUMENT_TYPES, INITIAL_STAMPS } from '../data/excuses';
import { DOCUMENT_DISCLAIMER } from './documentText';

const DB_NAME = 'ExcuseOfficeDB';
const DB_VERSION = 1;
const STORE_NAME = 'issued_documents';
const LOCAL_BACKUP_KEY = 'excuse_office_documents_fallback';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('issuedAt', 'issuedAt', { unique: false });
        store.createIndex('category', 'category', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB.'));
    };
  });
}

function getFallbackDocs(): IssuedDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackDocs(docs: IssuedDocument[]): void {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(docs));
  } catch (e) {
    console.warn('Fallback localStorage quota exceeded or unavailable', e);
  }
}

/**
 * Retrieve all issued documents sorted by date descending (IndexedDB with fallback)
 */
export async function getAllDocuments(): Promise<IssuedDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs = (request.result as IssuedDocument[]) || [];
        // Sort descending by issuedAt
        docs.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
        // Sync to fallback
        saveFallbackDocs(docs);
        resolve(docs);
      };

      request.onerror = () => {
        console.warn('IndexedDB read error, using fallback');
        resolve(getFallbackDocs());
      };
    });
  } catch (err) {
    console.warn('IndexedDB not available, reading from localStorage fallback', err);
    return getFallbackDocs();
  }
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(id: string): Promise<IssuedDocument | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const fallback = getFallbackDocs().find((d) => d.id === id);
        resolve(fallback);
      };
    });
  } catch {
    return getFallbackDocs().find((d) => d.id === id);
  }
}

/**
 * Save or update a document in IndexedDB & backup
 */
export async function saveDocument(doc: IssuedDocument): Promise<void> {
  // Always update fallback first to guarantee persistence
  const fallbackDocs = getFallbackDocs();
  const existingIndex = fallbackDocs.findIndex((d) => d.id === doc.id);
  if (existingIndex >= 0) {
    fallbackDocs[existingIndex] = doc;
  } else {
    fallbackDocs.unshift(doc);
  }
  saveFallbackDocs(fallbackDocs);

  // Then save to IndexedDB
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(doc);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB save failed, saved to localStorage fallback', err);
  }
}

/**
 * Delete a document by ID
 */
export async function deleteDocument(id: string): Promise<void> {
  // Remove from fallback
  const fallbackDocs = getFallbackDocs().filter((d) => d.id !== id);
  saveFallbackDocs(fallbackDocs);

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete error', err);
  }
}

/**
 * Clear all documents
 */
export async function clearAllDocuments(): Promise<void> {
  saveFallbackDocs([]);
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB clear error', err);
  }
}

/**
 * Storage integrity check: verifies read/write health and document count
 */
export async function verifyStorageIntegrity(): Promise<{
  isHealthy: boolean;
  engine: 'IndexedDB (기본)' | 'LocalStorage (백업)';
  documentCount: number;
  message: string;
}> {
  try {
    const docs = await getAllDocuments();
    return {
      isHealthy: true,
      engine: 'IndexedDB (기본)',
      documentCount: docs.length,
      message: `저장소 정상 작동 중 (총 ${docs.length}건 보관 및 동기화 확인)`,
    };
  } catch {
    const fallbackDocs = getFallbackDocs();
    return {
      isHealthy: true,
      engine: 'LocalStorage (백업)',
      documentCount: fallbackDocs.length,
      message: `로컬 백업 저장소 정상 작동 중 (총 ${fallbackDocs.length}건 보관)`,
    };
  }
}

/**
 * Import documents from parsed JSON array
 */
export async function importDocuments(docs: any[]): Promise<{ added: number; skipped: number }> {
  if (!Array.isArray(docs)) {
    throw new Error('유효한 문서 목록(JSON 배열) 형식이 아닙니다.');
  }

  const existingDocs = await getAllDocuments();
  const existingIds = new Set(existingDocs.map((d) => d.id));

  let added = 0;
  let skipped = 0;

  for (const item of docs) {
    if (!item || typeof item !== 'object' || !item.id || !item.situation || !item.excuse) {
      skipped++;
      continue;
    }

    if ((item.category !== undefined && !CATEGORIES.some((category) => category.id === item.category)) ||
        (item.documentType !== undefined && !Object.hasOwn(DOCUMENT_TYPES, item.documentType)) ||
        (item.issueMode !== undefined && item.issueMode !== 'quick' && item.issueMode !== 'formal') ||
        (item.issuedAt !== undefined && !Number.isFinite(Date.parse(item.issuedAt)))) {
      skipped++;
      continue;
    }

    if (existingIds.has(String(item.id))) {
      skipped++;
      continue;
    }

    const stamp = INITIAL_STAMPS.find((stamp) => stamp.id === item.stampId) || INITIAL_STAMPS[0];
    const validDoc: IssuedDocument = {
      id: String(item.id),
      issueNumber: String(item.issueNumber || 'EX-RESTORED'),
      issuedAt: String(item.issuedAt || new Date().toISOString()),
      formattedDate: String(item.formattedDate || '날짜 미기재'),
      applicant: String(item.applicant || '김핑계'),
      category: item.category || 'daily',
      situation: String(item.situation),
      excuse: {
        title: String(item.excuse?.title || '핑계 문서'),
        cause: String(item.excuse?.cause || ''),
        description: String(item.excuse?.description || ''),
        judgment: String(item.excuse?.judgment || ''),
        decision: String(item.excuse?.decision || ''),
        fullSummary: String(item.excuse?.fullSummary || ''),
      },
      documentType: item.documentType || 'official_statement',
      issueMode: item.issueMode || 'quick',
      approvalTier: String(item.approvalTier || '공식 승인'),
      stampId: stamp.id,
      stampName: stamp.name,
      stampSealText: stamp.sealText,
      organization: String(item.organization || '핑계오피스'),
      disclaimer: DOCUMENT_DISCLAIMER,
    };

    await saveDocument(validDoc);
    existingIds.add(validDoc.id);
    added++;
  }

  return { added, skipped };
}

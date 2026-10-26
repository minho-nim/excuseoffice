import React, { useState, useRef } from 'react';
import { IssuedDocument, ExcuseCategory } from '../types';
import { CATEGORIES, DOCUMENT_TYPES } from '../data/excuses';
import {
  Archive,
  Search,
  Trash2,
  Eye,
  Download,
  Upload,
  AlertTriangle,
  Calendar,
  FolderOpen,
} from 'lucide-react';
import { deleteDocument, clearAllDocuments } from '../utils/db';
import { createBackup, restoreBackup } from '../utils/backup';
import { getUserStats } from '../utils/storage';

interface DocumentArchiveProps {
  documents: IssuedDocument[];
  onRefresh: () => Promise<void>;
  onSelectDocument: (doc: IssuedDocument) => void;
  onExportDocPng: (doc: IssuedDocument) => Promise<void>;
  onExportDocPdf: (doc: IssuedDocument) => Promise<void>;
}

export const DocumentArchive: React.FC<DocumentArchiveProps> = ({
  documents,
  onRefresh,
  onSelectDocument,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ExcuseCategory | 'all'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents
    .filter((doc) => {
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.issueNumber.toLowerCase().includes(q) ||
        doc.excuse.title.toLowerCase().includes(q) ||
        doc.situation.toLowerCase().includes(q) ||
        doc.applicant.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.issuedAt).getTime();
      const timeB = new Date(b.issuedAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!window.confirm('이 문서를 삭제할까요? 삭제하면 되돌릴 수 없어요.')) return;
    try {
      await deleteDocument(docId);
      await onRefresh();
      setStatusMessage({ type: 'success', text: '문서를 삭제했어요.' });
    } catch {
      setStatusMessage({ type: 'error', text: '문서를 삭제하지 못했어요.' });
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllDocuments();
      await onRefresh();
      setConfirmClearOpen(false);
      setStatusMessage({ type: 'success', text: '모든 기록을 지웠어요.' });
    } catch {
      setStatusMessage({ type: 'error', text: '기록을 지우지 못했어요.' });
    }
  };

  const handleExportJSON = () => {
    const data = createBackup(documents, getUserStats());
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const nowStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `ExcuseOffice_Backup_${nowStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportJSONClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await restoreBackup(parsed);
      await onRefresh();
      setStatusMessage({
        type: 'success',
        text: `문서 ${result.added}개를 추가했고 ${result.skipped}개는 건너뛰었어요. ${result.legacy ? '예전 백업에 있는 문서로 활동 기록을 보완했어요.' : '도장과 활동 기록도 불러왔어요.'}`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `파일을 불러오지 못했어요. 백업 파일인지 확인해 주세요. (${err?.message || ''})`,
      });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-stone-800" />
            <h2 className="text-lg font-serif font-bold text-stone-900">내 문서</h2>
            <span className="text-xs bg-stone-100 text-stone-700 font-mono px-2 py-0.5 rounded-full font-medium">
              {documents.length}건
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            문서·도장·활동 기록은 이 브라우저에 저장돼요. 백업 파일로 다른 기기에 옮길 수 있어요.
          </p>
        </div>

        {/* JSON Backup & Restore buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={isRestoring}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>백업 파일 저장</span>
          </button>
          <button
            type="button"
            onClick={handleImportJSONClick}
            disabled={isRestoring}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isRestoring ? '불러오는 중…' : '백업 불러오기'}</span>
          </button>
          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              disabled={isRestoring}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            <span>모두 삭제</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            닫기
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmClearOpen && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-3">
          <div className="flex items-center space-x-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>저장된 문서를 모두 지울까요?</span>
          </div>
          <p className="text-xs text-amber-800">
            삭제한 문서는 되돌릴 수 없어요. 필요하면 먼저 백업 파일을 저장해 주세요.
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-bold hover:bg-rose-800 cursor-pointer"
            >
              전체 삭제
            </button>
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="px-3 py-1.5 bg-stone-200 text-stone-800 rounded-lg text-xs font-medium hover:bg-stone-300 cursor-pointer"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="문서 번호, 제목, 상황으로 찾기"
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white text-stone-900"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="w-full py-2 px-3 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-medium cursor-pointer"
          >
            <option value="all">모든 종류</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="w-full py-2 px-3 text-xs font-semibold bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-stone-700 flex items-center justify-center space-x-1 cursor-pointer transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{sortOrder === 'desc' ? '최근 문서부터' : '오래된 문서부터'}</span>
          </button>
        </div>
      </div>

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
          <FolderOpen className="w-10 h-10 text-stone-400 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-bold text-stone-700">저장된 문서가 없어요</p>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery ? '찾는 문서가 없어요.' : '핑계 문서를 하나 만들어 보세요!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDocs.map((doc) => {
            const docType = DOCUMENT_TYPES[doc.documentType] || DOCUMENT_TYPES.official_statement;
            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="group p-4 bg-stone-50 hover:bg-amber-50/30 border border-stone-200 hover:border-stone-300 rounded-xl transition-all cursor-pointer shadow-2xs relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className="font-bold text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {doc.issueNumber}
                    </span>
                    <span className="text-stone-500">{doc.formattedDate}</span>
                    <span className="text-[11px] font-sans font-semibold text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded-md">
                      {docType.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <span className="text-[11px] text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {doc.stampName}
                    </span>
                    <button
                      type="button"
                      title="문서 열기"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDocument(doc);
                      }}
                      className="p-1.5 bg-white hover:bg-stone-200 rounded-md text-stone-600 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="삭제"
                      onClick={(e) => handleDelete(e, doc.id)}
                      className="p-1.5 bg-white hover:bg-rose-100 rounded-md text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-stone-900 group-hover:text-red-900 transition-colors">
                  {doc.excuse.title}
                </h3>

                <p className="text-xs text-stone-600 line-clamp-1 italic mt-1 bg-white p-2 rounded-lg border border-stone-100">
                  "{doc.situation}"
                </p>

                <div className="mt-2 text-xs text-stone-600 flex items-center justify-between border-t border-stone-200/60 pt-2 font-serif">
                  <span className="font-sans text-[11px] text-stone-500">
                    이름: <strong className="text-stone-800">{doc.applicant}</strong>
                  </span>
                  <span className="text-red-700 font-semibold text-[11px] truncate max-w-[260px] sm:max-w-md">
                    핑계: {doc.excuse.decision}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

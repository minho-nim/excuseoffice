import React, { useState } from 'react';
import { ExcuseCategory, DocumentType, IssuedDocument, UserStats, StampInfo, IssueMode, DocumentDetails } from '../types';
import { DocumentSettings } from './DocumentSettings';
import { CATEGORIES, RECOMMENDED_SITUATIONS, DOCUMENT_TYPES } from '../data/excuses';
import { getDocumentShareText } from '../utils/documentText';
import {
  Sparkles,
  Shuffle,
  RefreshCw,
  Download,
  FileDown,
  Copy,
  Check,
  AlertCircle,
  FileCheck2,
  FileText,
  User,
  Stamp,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MainGeneratorProps {
  currentCategory: ExcuseCategory;
  onCategoryChange: (cat: ExcuseCategory) => void;
  situation: string;
  onSituationChange: (text: string) => void;
  applicant: string;
  onApplicantChange: (name: string) => void;
  documentDetails: DocumentDetails;
  onDocumentDetailsChange: (details: DocumentDetails) => void;
  documentType: DocumentType;
  onDocumentTypeChange: (dt: DocumentType) => void;
  issueMode: IssueMode;
  onIssueModeChange: (mode: IssueMode) => void;
  selectedStampId: string;
  onStampChange: (stampId: string) => void;
  unlockedStamps: StampInfo[];
  userStats: UserStats;
  currentDocument: IssuedDocument | null;
  onIssueNewDocument: () => void;
  onRegenerateExcuse: () => void;
  onExportPng: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  isExporting: boolean;
}

export const MainGenerator: React.FC<MainGeneratorProps> = ({
  currentCategory,
  onCategoryChange,
  situation,
  onSituationChange,
  applicant,
  onApplicantChange,
  documentDetails,
  onDocumentDetailsChange,
  documentType,
  onDocumentTypeChange,
  issueMode,
  onIssueModeChange,
  selectedStampId,
  onStampChange,
  unlockedStamps,
  userStats,
  currentDocument,
  onIssueNewDocument,
  onRegenerateExcuse,
  onExportPng,
  onExportPdf,
  isExporting,
}) => {
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const presets = RECOMMENDED_SITUATIONS[currentCategory] || [];

  const handleRandomPick = () => {
    const list = RECOMMENDED_SITUATIONS[currentCategory];
    if (list && list.length > 0) {
      const randomItem = list[Math.floor(Math.random() * list.length)];
      onSituationChange(randomItem);
      setErrorMessage(null);
    }
  };

  const handlePresetClick = (item: string) => {
    onSituationChange(item);
    setErrorMessage(null);
  };

  const handleIssueClick = () => {
    if (!situation.trim()) {
      setErrorMessage('상황을 적거나 아래 예시를 골라 주세요.');
      return;
    }
    setErrorMessage(null);
    onIssueNewDocument();

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#b91c1c', '#1e293b', '#f59e0b', '#4f46e5'],
      });
    } catch {
      // ignore
    }
  };

  const handleCopyText = async () => {
    if (!currentDocument) return;
    const shareText = getDocumentShareText(currentDocument);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white p-5 sm:p-6 space-y-6 shadow-[0_8px_32px_-16px_rgba(15,23,42,0.12)]">
      {/* 1. Header: Document Style Segmented Toggle */}
      <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-bold text-slate-900 tracking-tight">문서 스타일</span>
        <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onIssueModeChange('quick')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
              issueMode === 'quick'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>요약 문서</span>
          </button>
          <button
            type="button"
            onClick={() => onIssueModeChange('formal')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
              issueMode === 'formal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-slate-600" />
            <span>결재 문서</span>
          </button>
        </div>
      </div>

      {/* 2. Category Tabs */}
      <div>
        <label className="text-xs font-bold text-slate-700 block mb-2">어떤 상황인가요?</label>
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = currentCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Situation Input Area */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="excuse-situation" className="text-xs font-bold text-slate-700">상황을 적어 주세요</label>
          <button
            type="button"
            onClick={handleRandomPick}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            <span>예시 바꾸기</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            id="excuse-situation"
            rows={3}
            maxLength={180}
            value={situation}
            onChange={(e) => {
              onSituationChange(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="예: 침대에서 나오기 싫어요. 일이 너무 많아요."
            className="w-full text-xs sm:text-sm p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:bg-white text-slate-900 placeholder:text-slate-400 resize-none leading-relaxed transition-all"
          />
          <div className="absolute right-3 bottom-2.5 text-[10px] text-slate-400 font-mono">
            {situation.length}/180
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 flex items-center space-x-1 mt-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {/* Recommended Chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {presets.slice(0, 3).map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border text-left transition-colors cursor-pointer ${
                situation === preset
                  ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      <DocumentSettings applicant={applicant} onApplicantChange={onApplicantChange} stamps={unlockedStamps} selectedStampId={selectedStampId} onStampChange={onStampChange} details={documentDetails} onDetailsChange={onDocumentDetailsChange} />

      {/* Primary action */}
      <div>
        <button
          type="button"
          onClick={handleIssueClick}
          className="w-full py-4 px-4 bg-brand-600 hover:bg-brand-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-[0_6px_18px_-6px_rgba(113,56,68,0.25)] transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
        >
          <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>핑계 문서 만들기</span>
        </button>
      </div>

      {/* 6. Action Bar (When Document is present) */}
      {currentDocument && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onRegenerateExcuse}
            className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>다른 핑계</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-500" />
                <span>텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

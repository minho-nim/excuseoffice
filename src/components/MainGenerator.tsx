import React, { useState } from 'react';
import { ExcuseCategory, DocumentType, IssuedDocument, UserStats, StampInfo, IssueMode } from '../types';
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
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      {/* 1. Header: Document Style Segmented Toggle */}
      <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-stone-700 tracking-tight">문서 모양</span>
        <div className="inline-flex p-1 bg-stone-100 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onIssueModeChange('quick')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
              issueMode === 'quick'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>간단한 문서</span>
          </button>
          <button
            type="button"
            onClick={() => onIssueModeChange('formal')}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center space-x-1 ${
              issueMode === 'formal'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            <span>긴 문서</span>
          </button>
        </div>
      </div>

      {/* 2. Category Tabs */}
      <div>
        <label className="text-xs font-bold text-stone-700 block mb-2">어떤 상황인가요?</label>
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
                    ? 'bg-stone-900 text-stone-50 shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/70'
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
          <label className="text-xs font-bold text-stone-700">상황을 적어 주세요</label>
          <button
            type="button"
            onClick={handleRandomPick}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            <span>예시 바꾸기</span>
          </button>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            maxLength={180}
            value={situation}
            onChange={(e) => {
              onSituationChange(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder="예: 침대에서 나오기 싫어요. 일이 너무 많아요."
            className="w-full text-xs sm:text-sm p-3.5 bg-stone-50/80 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-stone-800 focus:bg-white text-stone-900 placeholder:text-stone-400 resize-none leading-relaxed transition-all"
          />
          <div className="absolute right-3 bottom-2.5 text-[10px] text-stone-400 font-mono">
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
                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Primary Issue CTA */}
      <div>
        <button
          type="button"
          onClick={handleIssueClick}
          className="w-full py-3.5 px-4 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer tracking-wide"
        >
          <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>핑계 문서 만들기</span>
        </button>
      </div>

      {/* 5. Minimal Settings Expander (Nickname & Stamp selection) */}
      <div className="pt-2 border-t border-stone-100">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-stone-500 hover:text-stone-800 font-medium flex items-center justify-between w-full py-1 cursor-pointer transition-colors"
        >
          <span className="flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" />
            <span>이름과 도장 바꾸기 (선택)</span>
          </span>
          {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showSettings && (
          <div className="mt-3 p-3 bg-stone-50 rounded-xl space-y-3 text-xs border border-stone-200/60">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">이름 또는 별명</label>
              <input
                type="text"
                maxLength={12}
                value={applicant}
                onChange={(e) => onApplicantChange(e.target.value)}
                placeholder="김핑계"
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700">문서에 찍을 도장</label>
                <span className="text-[10px] text-stone-500">
                  {unlockedStamps.filter((s) => s.isUnlocked).length}/{unlockedStamps.length} 사용 가능
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {unlockedStamps.map((stamp) => {
                  const isSelected = selectedStampId === stamp.id;
                  return (
                    <button
                      key={stamp.id}
                      type="button"
                      disabled={!stamp.isUnlocked}
                      onClick={() => stamp.isUnlocked && onStampChange(stamp.id)}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer truncate ${
                        isSelected
                          ? 'border-red-600 bg-red-50 text-red-950 font-bold'
                          : stamp.isUnlocked
                          ? 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                          : 'border-stone-200 bg-stone-100 text-stone-400 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <span className="truncate block">
                        {stamp.isUnlocked ? stamp.name : `🔒 ${stamp.name}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Action Bar (When Document is present) */}
      {currentDocument && (
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onRegenerateExcuse}
            className="flex-1 py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-stone-500" />
            <span>다른 핑계</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="flex-1 py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-stone-500" />
                <span>텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

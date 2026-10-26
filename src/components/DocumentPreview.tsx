import React, { forwardRef, useState } from 'react';
import { IssuedDocument, IssueMode } from '../types';
import { DOCUMENT_TYPES } from '../data/excuses';
import { Shield, Sparkles, FileText, Download, FileDown, Copy, Check, ZoomIn, ZoomOut, RefreshCw, CheckCircle2 } from 'lucide-react';

interface DocumentPreviewProps {
  document: IssuedDocument;
  className?: string;
  onModeChange?: (mode: IssueMode) => void;
  onExportPng?: () => Promise<void>;
  onExportPdf?: () => Promise<void>;
  onRegenerate?: () => void;
  isExporting?: boolean;
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  (
    {
      document: doc,
      className = '',
      onModeChange,
      onExportPng,
      onExportPdf,
      onRegenerate,
      isExporting = false,
    },
    ref
  ) => {
    const [fontSizeScale, setFontSizeScale] = useState<'normal' | 'large'>('normal');
    const [copied, setCopied] = useState(false);

    const docTypeInfo = DOCUMENT_TYPES[doc.documentType] || DOCUMENT_TYPES.official_statement;
    const isQuickMode = doc.issueMode === 'quick';
    const isLargeFont = fontSizeScale === 'large';

    const handleCopy = async () => {
      const shareText = `[공식 공문] ${doc.excuse.title}\n발급번호: ${doc.issueNumber}\n수신: 각 부서장 및 관계 임직원 일동\n신청인: ${doc.applicant}\n\n1. 신청 사유: "${doc.situation}"\n2. 발생 경위: ${doc.excuse.cause}\n3. 승인 및 조치 사항: ${doc.excuse.decision}\n\n(주식회사 핑계오피스 대표이사 공인)`;
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // fallback
      }
    };

    const renderStamp = (sizeClass = 'w-20 h-20 sm:w-24 sm:h-24') => {
      return (
        <div className="relative inline-flex flex-col items-center justify-center select-none shrink-0">
          <div
            className={`stamp-seal relative flex flex-col items-center justify-center transition-transform ${sizeClass} ${
              doc.stampId === 'stamp_special'
                ? 'rounded-lg border-4'
                : doc.stampId === 'stamp_force_majeure'
                ? 'rounded-[50%] border-4'
                : 'rounded-full border-4'
            }`}
            style={{
              borderColor: '#b91c1c',
              color: '#b91c1c',
              boxShadow: '0 0 1px 1px rgba(185, 28, 28, 0.4), inset 0 0 6px rgba(185, 28, 28, 0.25)',
              transform: 'rotate(-7deg)',
            }}
          >
            <div className="absolute inset-1 border border-dashed border-red-700/60 rounded-full pointer-events-none" />
            <span className="text-[9px] tracking-widest text-red-800 font-bold">★ 認 可 ★</span>
            <span className="font-stamp text-xs sm:text-[13px] font-black text-center leading-tight tracking-tight px-1 py-0.5 text-red-700 drop-shadow-xs">
              {doc.stampSealText}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-red-800 font-semibold tracking-tighter">
              {doc.issuedAt ? doc.issuedAt.slice(0, 10).replace(/-/g, '.') : 'OFFICIAL'}
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-serif text-stone-500 mt-1 font-medium tracking-tight">
            [직인생략/전자서명]
          </span>
        </div>
      );
    };

    return (
      <div className={`w-full max-w-[680px] mx-auto space-y-3 ${className}`}>
        {/* Floating Quick Utility Bar */}
        <div className="bg-white px-3 sm:px-4 py-2.5 rounded-xl border border-stone-200/90 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Format Switcher */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onModeChange && onModeChange('quick')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                isQuickMode
                  ? 'bg-stone-900 text-stone-50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>간편 확인서</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange && onModeChange('formal')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1 ${
                !isQuickMode
                  ? 'bg-stone-900 text-stone-50'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>정식 기업 공문</span>
            </button>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-1.5 ml-auto">
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
                title="핑계 다시 뽑기"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setFontSizeScale(isLargeFont ? 'normal' : 'large')}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
              title={isLargeFont ? '보통 글자' : '큰 글자'}
            >
              {isLargeFont ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
              title="텍스트 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {onExportPng && (
              <button
                type="button"
                disabled={isExporting}
                onClick={onExportPng}
                className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-50 font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1"
              >
                <Download className="w-3 h-3 text-amber-400" />
                <span>PNG</span>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                disabled={isExporting}
                onClick={onExportPdf}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center space-x-1"
              >
                <FileDown className="w-3 h-3" />
                <span>PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: 간편 사유 승인 확인서 (QUICK PASS / CERTIFICATE)                     */}
        {/* ========================================================================= */}
        {isQuickMode ? (
          <div
            ref={ref}
            id="excuse-official-document"
            className="relative paper-pattern bg-[#faf7ee] text-slate-900 shadow-xl rounded-xl p-5 sm:p-8 border-4 border-slate-800 transition-all overflow-hidden"
            style={{
              fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
            }}
          >
            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-7 h-7 rounded-md bg-stone-900 text-amber-100 flex items-center justify-center font-bold text-xs font-serif shadow-xs">
                  (주)
                </span>
                <div>
                  <h3 className="font-bold text-xs text-slate-900 tracking-wider">
                    주식회사 핑계오피스
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    EXCUSE OFFICE CORP. • 사유승인원
                  </p>
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <span className="font-bold text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded border border-stone-300">
                  {doc.issueNumber}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="text-center my-5">
              <span className="inline-block px-2.5 py-0.5 bg-red-700 text-white text-[10px] sm:text-[11px] font-sans font-bold tracking-widest rounded-xs mb-1.5 shadow-xs">
                【 사유 승인 및 업무 유예 확인서 】
              </span>
              <h2
                className={`font-black text-slate-950 tracking-tight leading-tight mt-1 break-keep ${
                  isLargeFont ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
                }`}
              >
                {doc.excuse.title}
              </h2>
            </div>

            {/* Quick Content Blocks */}
            <div className="space-y-3 font-serif">
              {/* 1. Situation */}
              <div className="bg-white/90 border border-slate-300 p-3.5 rounded-sm shadow-2xs">
                <div className="text-[11px] font-sans font-bold text-slate-600 mb-1 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  <span>신청인 사유 진술</span>
                </div>
                <p className={`font-semibold text-slate-900 break-keep leading-relaxed ${isLargeFont ? 'text-base' : 'text-sm'}`}>
                  "{doc.situation}"
                </p>
              </div>

              {/* 2. Cause & Circumstances */}
              <div className="bg-amber-50/80 border border-amber-300/80 p-3.5 rounded-sm shadow-2xs">
                <div className="text-[11px] font-sans font-bold text-amber-950 mb-1 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                  <span>발생 경위 및 사유</span>
                </div>
                <p className={`font-medium text-slate-900 break-keep leading-relaxed ${isLargeFont ? 'text-base' : 'text-sm'}`}>
                  {doc.excuse.cause}
                </p>
              </div>

              {/* 3. Action Directives (Final Approval) */}
              <div className="bg-red-50/90 border-2 border-red-800 p-4 rounded-sm shadow-xs">
                <div className="text-[11px] font-sans font-bold text-red-900 mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-700" />
                  <span>승인 및 부서 조치 사항 (허가)</span>
                </div>
                <p className={`font-black text-red-950 break-keep leading-snug ${isLargeFont ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
                  {doc.excuse.decision}
                </p>
                <p className="text-[11px] text-red-800 mt-2 pt-2 border-t border-red-200/80 font-sans leading-normal">
                  ※ 본 확인서를 수령한 부서장 및 관계자는 신청인에게 불필요한 질책 및 눈치 주기를 엄격히 금하며, 온전한 심신 회복을 보장할 것.
                </p>
              </div>
            </div>

            {/* Bottom Sign-off & Stamp */}
            <div className="mt-6 pt-4 border-t-2 border-slate-800 flex items-center justify-between">
              <div className="space-y-1 text-left">
                <p className="text-xs text-slate-700">
                  신청자: <strong className="font-bold text-slate-950">{doc.applicant}</strong>
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  시행일자: {doc.formattedDate}
                </p>
                <p className="text-xs font-bold text-slate-900 font-serif">
                  주식회사 핑계오피스 대표이사
                </p>
              </div>

              {renderStamp('w-20 h-20 sm:w-24 sm:h-24')}
            </div>

            {/* Parody Disclaimer */}
            <div className="mt-4 pt-2 border-t border-slate-300 text-center">
              <p className="text-[10px] font-bold text-red-700 tracking-tight">
                {doc.disclaimer}
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODE 2: 정식 기업 공문 (AUTHENTIC CORPORATE OFFICIAL MEMO & DECREE)       */
          /* ========================================================================= */
          <div
            ref={ref}
            id="excuse-official-document"
            className="relative paper-pattern bg-[#faf7ee] text-slate-900 shadow-xl rounded-sm p-6 sm:p-10 border-4 sm:border-8 border-[#2d3748] transition-all overflow-hidden"
            style={{
              fontFamily: "'Noto Serif KR', 'Gowun Batang', serif",
              minHeight: '820px',
            }}
          >
            {/* Corporate Letterhead Banner */}
            <div className="text-center border-b-2 border-slate-800 pb-3 mb-5">
              <div className="text-2xl sm:text-3xl font-black text-slate-950 tracking-[0.2em] font-serif">
                주식회사 핑계오피스
              </div>
              <div className="text-[10px] text-slate-500 font-sans tracking-tight mt-1">
                우 04524 서울특별시 중구 세종대로 110 / TEL: 02-777-4242 / FAX: 02-777-4243
              </div>
            </div>

            {/* Corporate Metadata & 3-Step Approval Box (결재란) */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 border-b border-slate-400/80 pb-4">
              {/* Left: Dispatch Metadata */}
              <div className="space-y-1.5 text-xs text-slate-800">
                <div className="flex items-center">
                  <span className="w-16 font-bold text-slate-700">문서번호 :</span>
                  <span className="font-mono font-semibold">{doc.issueNumber}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-bold text-slate-700">시행일자 :</span>
                  <span className="font-mono">{doc.formattedDate}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-bold text-slate-700">수　　신 :</span>
                  <span className="font-semibold text-slate-900">수신처 참조 (소속 부서장 및 관계 임직원 제위)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-bold text-slate-700">참　　조 :</span>
                  <span>인사총무팀장, 업무일정관리부</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 font-bold text-slate-700">기 안 자 :</span>
                  <span className="font-bold text-slate-950">{doc.applicant}</span>
                </div>
              </div>

              {/* Right: Korean Corporate Approval Box (결재란) */}
              <div className="shrink-0 self-end sm:self-start">
                <div className="border-2 border-slate-800 bg-white text-[11px] text-center">
                  <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-100 font-bold divide-x divide-slate-800">
                    <div className="px-3 py-1">기 안</div>
                    <div className="px-3 py-1">검 토</div>
                    <div className="px-3 py-1">승 인</div>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-slate-800 h-14 items-center font-serif text-slate-800">
                    <div className="px-2 font-bold text-[11px] text-stone-700">
                      {doc.applicant.slice(0, 3)}<br />(인)
                    </div>
                    <div className="px-2 font-medium text-[11px] text-slate-500">
                      팀장<br />(인)
                    </div>
                    <div className="px-2 font-bold text-[11px] text-red-700 flex flex-col items-center justify-center">
                      <span className="border border-red-600 rounded px-1 py-0.2 bg-red-50 text-[10px]">
                        전결
                      </span>
                      <span>대표이사</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Box */}
            <div className="mb-6 bg-slate-100/90 border-l-4 border-slate-900 p-3.5 shadow-2xs">
              <div className="text-[10px] font-sans font-bold text-slate-500 mb-0.5 tracking-wider">
                【 제　목 】
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-950 leading-snug break-keep">
                {doc.excuse.title}
              </h2>
            </div>

            {/* 5 Real Corporate Clauses */}
            <div className={`space-y-4 leading-relaxed text-slate-900 ${isLargeFont ? 'text-sm sm:text-base' : 'text-xs sm:text-[13px]'}`}>
              {/* Clause 1: Basis & Situation */}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-950 flex items-center space-x-1.5">
                  <span className="font-mono">1.</span>
                  <span>관련 근거 및 신청 내역</span>
                </h3>
                <div className="pl-4 space-y-1 text-slate-800">
                  <p>가. 사내 복무 규정 제14조 (부득이한 사정에 따른 업무 조정 및 유예 조항)</p>
                  <p className="bg-white/80 p-2.5 rounded border border-slate-300 italic break-keep">
                    나. 신청인 제출 사유: <strong>"{doc.situation}"</strong>
                  </p>
                </div>
              </div>

              {/* Clause 2: Circumstances & Cause */}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-950 flex items-center space-x-1.5">
                  <span className="font-mono">2.</span>
                  <span>발생 사유 및 상세 경위</span>
                </h3>
                <p className="pl-4 text-justify break-keep">
                  상기 신청인이 제출한 사유와 관련하여 관련 정황을 파악한바, <strong>{doc.excuse.cause}</strong> 등 불가피한 물리적·심리적 요인으로 인하여 정상적인 과업 추진에 중대한 장애가 발생한 것으로 확인됨.
                </p>
              </div>

              {/* Clause 3: Department Review & Feasibility */}
              <div className="space-y-1">
                <h3 className="font-bold text-slate-950 flex items-center space-x-1.5">
                  <span className="font-mono">3.</span>
                  <span>내부 검토 의견 및 타당성</span>
                </h3>
                <p className="pl-4 text-justify break-keep">
                  {doc.excuse.judgment} 이에 따라 본 사안을 단순 개인의 태만이나 과실로 간주하기 어려우며, 인적 자원의 심신 보호 및 2차 생산성 저하를 방지하기 위해 사유의 타당성이 인정됨.
                </p>
              </div>

              {/* Clause 4: Final Approval & Directives (진술에 대한 최종 허가 및 조치 사항) */}
              <div className="space-y-1 border-2 border-red-800 bg-red-50/70 p-3.5 rounded-sm shadow-xs">
                <h3 className="font-bold text-red-950 flex items-center space-x-1.5">
                  <span className="font-mono">4.</span>
                  <span>최종 승인 및 조치 사항 (허가 사항)</span>
                </h3>
                <div className="pl-4 space-y-1 text-slate-950 font-medium">
                  <p>가. 『{doc.situation}』 사안에 따른 관련 업무 및 일정의 <strong>공식 유예(사유 인정) 승인</strong></p>
                  <p>나. <strong>{doc.excuse.decision}</strong></p>
                  <p>다. 유관 부서 및 관계자의 불필요한 질책, 눈치 주기, 추가 연락 일체 금지</p>
                  <p>라. 충분한 심신 안정 및 에너지 충전 후 정상 과업 복귀 조치</p>
                </div>
              </div>

              {/* Clause 5: Attachments & End */}
              <div className="space-y-1 text-slate-600 text-xs">
                <h3 className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <span className="font-mono">5.</span>
                  <span>첨부 서류</span>
                </h3>
                <p className="pl-4">
                  1) 사유 증빙 확인서 1부.<br />
                  2) 심신 안정 비상 처방전 1부.&nbsp;&nbsp;<strong className="text-slate-900 font-bold">- 끝. -</strong>
                </p>
              </div>
            </div>

            {/* Corporate Sign-off & Red Seal */}
            <div className="mt-8 pt-6 border-t-2 border-slate-800 flex items-center justify-between">
              <div className="space-y-1 text-left">
                <p className="text-xs text-slate-500 font-sans">
                  위 사안이 사규 및 결재 지침에 따라 적법하게 승인되었음을 증명함.
                </p>
                <p className="text-xl sm:text-2xl font-black text-slate-950 tracking-wider font-serif">
                  주식회사 핑계오피스 대표이사
                </p>
              </div>

              <div className="shrink-0 pl-3">
                {renderStamp()}
              </div>
            </div>

            {/* Parody Disclaimer */}
            <div className="mt-6 pt-3 border-t border-slate-300 text-center">
              <p className="text-[10px] sm:text-[11px] font-bold text-red-700 tracking-tight">
                {doc.disclaimer}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';

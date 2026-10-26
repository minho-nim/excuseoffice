import React, { forwardRef, useState } from 'react';
import type { IssuedDocument, IssueMode } from '../types';
import { INITIAL_STAMPS } from '../data/excuses';
import { DOCUMENT_DISCLAIMER, getDocumentDetails, getDocumentShareText } from '../utils/documentText';
import { getReviewOpinion } from '../utils/review';
import { Check, CheckCircle2, Copy, Download, FileDown, FileText, RefreshCw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

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
  ({ document: doc, className = '', onModeChange, onExportPng, onExportPdf, onRegenerate, isExporting = false }, ref) => {
    const [largeFont, setLargeFont] = useState(false);
    const [copied, setCopied] = useState(false);
    const details = getDocumentDetails(doc);
    const quick = doc.issueMode === 'quick';
    const dateText = details.date.split('-').join('. ');
    const stamp = INITIAL_STAMPS.find((item) => item.id === doc.stampId) || INITIAL_STAMPS[0];
    const review = getReviewOpinion(doc.situation);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(getDocumentShareText(doc));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        setCopied(false);
      }
    };

    const renderStamp = () => (
      <div className={'relative flex h-20 w-20 shrink-0 flex-col items-center justify-center border-[3px] text-center ' + (stamp.shape === 'square' ? 'rounded-md' : stamp.shape === 'oval' ? 'rounded-[45%]' : 'rounded-full')}
        style={{ color: stamp.color, borderColor: stamp.color, transform: 'rotate(-8deg)' }}>
        <span className="text-[8px] font-semibold tracking-widest">핑계오피스</span>
        <span className="px-1 font-stamp text-[11px] font-black leading-tight">{stamp.sealText}</span>
        <span className="mt-0.5 text-[8px]">{details.date.split('-').join('.')}</span>
      </div>
    );

    const section = (number: string, title: string, children: React.ReactNode) => (
      <section className="space-y-2">
        <h3 className="font-sans text-[13px] font-bold text-slate-950">{number}. {title}</h3>
        <div className="pl-4 text-justify leading-[1.95] break-words">{children}</div>
      </section>
    );

    return (
      <div className={'space-y-4 ' + className}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">문서 미리보기</h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><span className="h-1 w-1 rounded-full bg-emerald-500" />실시간 반영</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">이름과 결재 정보가 문서에 바로 들어가요.</p>
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {onRegenerate && <button type="button" aria-label="다른 핑계" title="다른 핑계" onClick={onRegenerate} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><RefreshCw className="h-4 w-4" /></button>}
            <button type="button" aria-label={largeFont ? '보통 글자' : '큰 글자'} onClick={() => setLargeFont(!largeFont)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50">{largeFont ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}</button>
            <button type="button" aria-label="텍스트 복사" title="텍스트 복사" onClick={handleCopy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-[#e9edf2] p-3 sm:p-5">
          <div className="mb-4 flex justify-center">
            <div className="inline-flex gap-1 rounded-full bg-white/90 p-1 shadow-sm">
              <button type="button" onClick={() => onModeChange?.('formal')} aria-pressed={!quick} className={'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ' + (!quick ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}><FileText className="h-3.5 w-3.5" />결재 문서</button>
              <button type="button" onClick={() => onModeChange?.('quick')} aria-pressed={quick} className={'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ' + (quick ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50')}><Sparkles className="h-3.5 w-3.5" />요약 문서</button>
            </div>
          </div>

          <div ref={ref} id="excuse-official-document" className={'relative mx-auto w-full max-w-[680px] border border-slate-200 bg-white p-5 text-slate-900 shadow-[0_5px_18px_-8px_rgba(15,23,42,0.2)] sm:p-9 ' + (largeFont ? 'text-sm' : 'text-xs sm:text-[13px]')} style={{ fontFamily: "'Noto Serif KR', serif" }}>
            <header className="mb-6 flex items-end justify-between border-b-2 border-slate-900 pb-3 font-sans">
              <div><p className="text-[10px] font-bold tracking-[0.18em] text-slate-400">EXCUSE OFFICE</p><p className="mt-1 text-base font-extrabold tracking-tight text-slate-950">주식회사 핑계오피스</p></div>
              <span className="text-[10px] font-medium text-slate-400">사유 검토 · 결재</span>
            </header>

            {!quick && (
              <div className="mb-5 flex justify-end">
                <table className="w-full max-w-[300px] table-fixed border-collapse border border-slate-400 text-center font-sans text-[11px]" aria-label="결재란">
                  <colgroup><col className="w-7" /><col /><col /><col /></colgroup>
                  <tbody>
                    <tr className="bg-slate-50"><th rowSpan={3} className="border border-slate-400 px-1 font-semibold leading-6">결<br />재</th><th className="border border-slate-400 py-1.5 font-semibold">기안</th><th className="border border-slate-400 py-1.5 font-semibold">팀장 검토</th><th className="border border-slate-400 py-1.5 font-semibold">대표 결재</th></tr>
                    <tr className="h-14"><td className="break-all border border-slate-400 px-1 font-bold">{doc.applicant}</td><td className="break-all border border-slate-400 px-1 font-semibold">{details.teamLeader}</td><td className="break-all border border-slate-400 px-1 font-bold text-red-800">{details.representative}</td></tr>
                    <tr className="text-[9px] text-slate-500">{['작성', '검토', '승인'].map((label) => <td key={label} className="border border-slate-400 px-1 py-1">{label} · {details.date.slice(5).split('-').join('.')}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            )}

            <h2 className="mb-6 text-center font-sans text-2xl font-bold tracking-[0.5em] text-slate-950 sm:text-3xl">사유서</h2>
            <dl className="mb-5 grid grid-cols-[72px_1fr] gap-y-2 border-y border-slate-300 py-3 font-sans text-[11px] sm:text-xs">
              <dt className="font-semibold text-slate-500">문서번호</dt><dd className="break-all font-medium">{doc.issueNumber}</dd>
              <dt className="font-semibold text-slate-500">작성일자</dt><dd>{dateText}</dd>
              <dt className="font-semibold text-slate-500">수신</dt><dd className="min-w-0 break-words">{details.recipient}</dd>
              <dt className="font-semibold text-slate-500">기안자</dt><dd className="min-w-0 break-words">{doc.applicant}</dd>
            </dl>
            <div className="mb-6 flex items-start gap-3 border-b-2 border-slate-800 pb-3 font-sans">
              <span className="shrink-0 pt-0.5 text-xs font-bold">제목</span>
              <h3 className="text-sm font-bold leading-relaxed break-words sm:text-base">{doc.excuse.title}</h3>
            </div>

            <div className="space-y-5">
              {section('1', '신청 내용', <p>다음 사유에 대한 인정 및 일정 조정을 요청드리오니 검토 후 결재하여 주시기 바랍니다.<br /><strong className="mt-2 block rounded-sm bg-slate-50 px-3 py-2 font-medium">“{doc.situation}”</strong></p>)}
              {section('2', '발생 사유', <p>{doc.excuse.cause}</p>)}
              {!quick && section('3', '검토 의견', <p>{review}</p>)}
              <section className="border border-slate-400">
                <h3 className="border-b border-slate-300 bg-slate-50 px-3 py-2 font-sans text-[13px] font-bold text-slate-950">{quick ? '3' : '4'}. 처리 내용 <span className="ml-1 text-[10px] font-normal text-slate-500">최종 핑계</span></h3>
                <p className="p-3.5 font-semibold leading-[1.95] break-words">{doc.excuse.decision}</p>
              </section>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 pt-5">
              <div className="min-w-0 text-right font-sans"><p className="text-[10px] text-slate-500">{dateText}</p><p className="mt-2 text-sm font-bold">주식회사 핑계오피스</p><p className="mt-1 text-xs">대표 {details.representative}</p></div>
              {renderStamp()}
            </div>
            <p data-document-disclaimer="true" className="mt-5 border-t border-slate-200 pt-3 text-center font-sans text-[9px] leading-relaxed text-slate-400">{DOCUMENT_DISCLAIMER}</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          {onExportPng && <button type="button" disabled={isExporting} onClick={onExportPng} className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"><Download className="h-4 w-4" />{isExporting ? '파일 만드는 중…' : '이미지로 저장하기'}</button>}
          {onExportPdf && <button type="button" disabled={isExporting} onClick={onExportPdf} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><FileDown className="h-4 w-4" />PDF</button>}
        </div>
      </div>
    );
  }
);
DocumentPreview.displayName = 'DocumentPreview';


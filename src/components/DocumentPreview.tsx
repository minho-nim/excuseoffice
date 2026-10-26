import React, { forwardRef, useState } from 'react';
import type { IssuedDocument, IssueMode } from '../types';
import { INITIAL_STAMPS } from '../data/excuses';
import { DOCUMENT_DISCLAIMER, getDocumentDetails, getDocumentShareText } from '../utils/documentText';
import { getReviewOpinion } from '../utils/review';
import { Check, Copy, Download, FileDown, FileText, RefreshCw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

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

    const cell = 'border border-neutral-400 px-2 py-2 align-middle break-words';
    const labelCell = cell + ' text-center font-medium tracking-widest';
    const condition = '위 사유와 작성일에 한해 1회 적용하며, 다른 일정에는 별도로 양해를 구합니다.';
    const approvalPeople = [
      { role: '기안', name: doc.applicant, action: '작성' },
      { role: '팀장', name: details.teamLeader, action: '검토' },
      { role: '대표', name: details.representative, action: '승인' },
    ];
    const section = (number: string, title: string, children: React.ReactNode) => (
      <section className="space-y-2">
        <h3 className="font-semibold">{number}. {title}</h3>
        <div className="pl-3 leading-[1.9] break-words">{children}</div>
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

          <p className="mb-2 text-center text-[10px] text-slate-500 sm:hidden">문서를 옆으로 밀면 결재란까지 볼 수 있어요.</p>
          <div className="overflow-x-auto pb-2" role="region" aria-label="결재 문서 미리보기" tabIndex={0}>
          <div ref={ref} id="excuse-official-document" className={'mx-auto min-w-[560px] w-full max-w-[720px] bg-white p-5 text-neutral-950 shadow-sm sm:p-6 font-sans ' + (largeFont ? 'text-[13px]' : 'text-[11px]')}>
            <h2 className="mb-4 text-center text-[25px] font-bold tracking-[0.12em]">사유 인정 품의서</h2>
            <table className="w-full table-fixed border-collapse border-2 border-neutral-500 leading-relaxed" aria-label="품의서">
              <colgroup><col className="w-[15%]" /><col className={quick ? 'w-[85%]' : 'w-[35%]'} />{!quick && <col className="w-[50%]" />}</colgroup>
              <tbody>
                <tr>
                  <th scope="row" className={labelCell}>품의번호</th><td className={cell + ' break-all'}>{doc.issueNumber}</td>
                  {!quick && <td rowSpan={4} className="border border-neutral-400 p-0 align-top">
                    <table className="h-full w-full table-fixed border-collapse text-center text-[10px]" aria-label="결재란">
                      <colgroup><col className="w-6" /><col /><col /><col /></colgroup>
                      <tbody>
                        <tr><th rowSpan={3} className="border-r border-neutral-400 font-normal leading-6">결<br />재</th>{approvalPeople.map((person) => <th key={person.role} className="border-r border-b border-neutral-400 py-1 font-normal last:border-r-0">{person.role}</th>)}</tr>
                        <tr>{approvalPeople.map((person, index) => <td key={person.role} className="border-r border-neutral-400 px-1 py-3 align-middle last:border-r-0">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center border-2 p-1 font-stamp text-[13px] font-bold leading-tight" style={{ color: index === 2 ? stamp.color : '#713844', borderColor: index === 2 ? stamp.color : '#713844', borderRadius: index === 2 && stamp.shape === 'square' ? '5px' : index === 2 && stamp.shape === 'oval' ? '40%' : '50%', transform: 'rotate(-6deg)', wordBreak: 'break-all', fontSize: person.name.length > 6 ? '9px' : '13px' }}>{person.name}</div>
                          {index === 2 && <p className="mt-1 text-[8px]" style={{ color: stamp.color }}>{stamp.sealText}</p>}
                        </td>)}</tr>
                        <tr>{approvalPeople.map((person) => <td key={person.role} className="border-r border-t border-neutral-400 px-1 py-1 last:border-r-0"><p>{details.date}</p><p className="break-all">{person.name} · {person.action}</p></td>)}</tr>
                      </tbody>
                    </table>
                  </td>}
                </tr>
                <tr><th scope="row" className={labelCell}>작성일자</th><td className={cell}>{dateText}</td></tr>
                <tr><th scope="row" className={labelCell}>기안부서</th><td className={cell}>핑계오피스 · 사유검토팀</td></tr>
                <tr><th scope="row" className={labelCell}>기안자</th><td className={cell}>{doc.applicant}</td></tr>
                <tr><th scope="row" className={labelCell}>수신 및 참조</th><td colSpan={quick ? 1 : 2} className={cell}>{details.recipient}</td></tr>
                <tr><th scope="row" className={labelCell}>시행일자</th><td colSpan={quick ? 1 : 2} className={cell}>{dateText}</td></tr>
                <tr><th scope="row" className={labelCell}>제목</th><td colSpan={quick ? 1 : 2} className={cell + ' font-medium'}>{doc.excuse.title}</td></tr>
                <tr><td colSpan={quick ? 2 : 3} className="border border-neutral-400 px-3 py-5 align-top">
                  <p className="mb-5 leading-[1.9]">아래와 같이 사유를 제출하오니 검토 후 승인하여 주시기 바랍니다.</p>
                  <div className={quick ? 'space-y-4' : 'min-h-[390px] space-y-5'}>
                    {section('1', '신청 사유', <p>{doc.situation}</p>)}
                    {section('2', '발생 경위', <p>{doc.excuse.cause}</p>)}
                    {!quick && section('3', '검토 의견', <p>{review}</p>)}
                    {section(quick ? '3' : '4', '처리 내역', <div className="space-y-3"><p><span className="font-medium">가. 처리 결과 (최종 핑계)</span><br />{doc.excuse.decision}</p>{!quick && <p><span className="font-medium">나. 적용 조건</span><br />{condition}</p>}</div>)}
                  </div>
                  <p className="mt-8">첨부: 없음. 끝.</p>
                </td></tr>
              </tbody>
            </table>
            <p className="mt-3 text-right text-[10px] text-neutral-500">핑계오피스 · 사유검토팀</p>
            <p data-document-disclaimer="true" className="mt-4 text-center text-[9px] leading-relaxed text-neutral-400">{DOCUMENT_DISCLAIMER}</p>
          </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2">
          {onExportPng && <button type="button" disabled={isExporting} onClick={onExportPng} className="flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"><Download className="h-4 w-4" />{isExporting ? '파일 만드는 중…' : '이미지로 저장하기'}</button>}
          {onExportPdf && <button type="button" disabled={isExporting} onClick={onExportPdf} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><FileDown className="h-4 w-4" />PDF</button>}
        </div>
      </div>
    );
  }
);
DocumentPreview.displayName = 'DocumentPreview';


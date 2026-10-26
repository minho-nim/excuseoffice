import React from 'react';
import { Check, ChevronDown, SlidersHorizontal, Stamp } from 'lucide-react';
import type { DocumentDetails, StampInfo } from '../types';

export interface DocumentSettingsProps {
  applicant: string;
  onApplicantChange: (value: string) => void;
  stamps: StampInfo[];
  selectedStampId: string;
  onStampChange: (id: string) => void;
  details: DocumentDetails;
  onDetailsChange: (details: DocumentDetails) => void;
}

export function DocumentSettings({ applicant, onApplicantChange, stamps, selectedStampId, onStampChange, details, onDetailsChange }: DocumentSettingsProps) {
  const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50';
  const update = (key: keyof DocumentDetails, value: string) => onDetailsChange({ ...details, [key]: value });
  return (
    <section className="space-y-4 border-t border-slate-100 pt-5" aria-label="이름과 도장 바꾸기">
      <h2 className="text-sm font-bold text-slate-900">이름과 도장 바꾸기</h2>
      <div>
        <label htmlFor="applicant-name" className="mb-2 block text-xs font-semibold text-slate-500">내 이름 또는 별명</label>
        <input id="applicant-name" maxLength={12} value={applicant} onChange={(event) => onApplicantChange(event.target.value)} placeholder="김핑계" className={inputClass} />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">문서에 찍을 도장</span>
          <span className="text-[11px] text-slate-400">모두 바로 쓸 수 있어요</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5" aria-label="도장 선택">
          {stamps.map((stamp) => {
            const selected = stamp.id === selectedStampId;
            return (
              <button key={stamp.id} type="button" aria-label={stamp.name} aria-pressed={selected} onClick={() => onStampChange(stamp.id)} className={'relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border px-1 py-3 text-[11px] font-semibold transition ' + (selected ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')}>
                {selected && <Check className="absolute right-1 top-1 h-3 w-3" />}
                <Stamp className="h-5 w-5" style={{ color: stamp.color }} />
                <span>{stamp.name.replace(' 도장', '')}</span>
              </button>
            );
          })}
        </div>
      </div>
      <details className="group rounded-2xl border border-slate-100 bg-slate-50/80">
        <summary className="flex cursor-pointer list-none items-center gap-2 p-3.5 text-xs font-semibold text-slate-600 [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="flex-1">팀장·대표·받는 사람·날짜 바꾸기</span>
          <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-3.5">
          <div>
            <label htmlFor="team-leader" className="mb-1.5 block text-xs font-medium text-slate-500">팀장 이름</label>
            <input id="team-leader" maxLength={12} value={details.teamLeader} onChange={(event) => update('teamLeader', event.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="representative-name" className="mb-1.5 block text-xs font-medium text-slate-500">대표 이름</label>
            <input id="representative-name" maxLength={12} value={details.representative} onChange={(event) => update('representative', event.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label htmlFor="document-recipient" className="mb-1.5 block text-xs font-medium text-slate-500">받는 사람</label>
            <input id="document-recipient" maxLength={40} value={details.recipient} onChange={(event) => update('recipient', event.target.value)} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label htmlFor="document-date" className="mb-1.5 block text-xs font-medium text-slate-500">문서 날짜</label>
            <input id="document-date" type="date" min="1900-01-01" max="9999-12-31" value={details.date} onChange={(event) => update('date', event.target.value)} className={inputClass} />
          </div>
        </div>
      </details>
    </section>
  );
}

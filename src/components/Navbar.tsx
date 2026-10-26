import React from 'react';
import type { ActiveTab } from '../types';
import { FileCheck2, FileText, Archive, Stamp, Sparkles, UserRound } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  documentCount: number;
  unlockedStampsCount: number;
  totalStampsCount: number;
  applicant: string;
  onOpenTodayModal: () => void;
}
export function Navbar({ activeTab, onTabChange, documentCount, totalStampsCount, applicant, onOpenTodayModal }: NavbarProps) {
  const tabs = [
    { id: 'issue' as const, label: '만들기', icon: FileText, count: 0 },
    { id: 'archive' as const, label: '내 문서', icon: Archive, count: documentCount },
    { id: 'stamps' as const, label: '도장', icon: Stamp, count: totalStampsCount },
  ];
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={() => onTabChange('issue')} className="flex shrink-0 items-center gap-2.5 text-left" aria-label="핑계오피스 홈">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]"><FileCheck2 className="h-5 w-5" /></span>
            <span><span className="block text-[17px] font-extrabold tracking-tight text-slate-900">핑계오피스</span><span className="hidden text-[10px] font-medium tracking-wide text-slate-400 sm:block">EXCUSE OFFICE</span></span>
          </button>
          <nav aria-label="주 메뉴" className="hidden items-center gap-1 md:flex">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onTabChange(id)} className={'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ' + (activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50')}>
                <Icon className="h-4 w-4" />{label}{count > 0 && <span className="text-[10px] opacity-60">{count}</span>}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onOpenTodayModal} className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700"><Sparkles className="h-3.5 w-3.5" />오늘의 핑계</button>
            <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 lg:flex"><UserRound className="h-3.5 w-3.5" />{applicant}</span>
          </div>
        </div>
      </header>
      <nav aria-label="모바일 메뉴" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-slate-200 bg-white/95 px-3 pt-2 backdrop-blur-xl md:hidden" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}>
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => onTabChange(id)} className={'flex flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold ' + (activeTab === id ? 'text-blue-600' : 'text-slate-400')}>
            <span className="relative"><Icon className="h-5 w-5" />{id === 'archive' && count > 0 && <span className="absolute -right-3 -top-1 rounded-full bg-blue-600 px-1 text-[8px] text-white">{count}</span>}</span>{label}
          </button>
        ))}
      </nav>
    </>
  );
}


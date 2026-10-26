import React from 'react';
import { ActiveTab } from '../types';
import { Sparkles, User, FileText, Archive, Stamp } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  documentCount: number;
  unlockedStampsCount: number;
  totalStampsCount: number;
  applicant: string;
  onOpenTodayModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  documentCount,
  unlockedStampsCount,
  totalStampsCount,
  applicant,
  onOpenTodayModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fbf9f5]/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div
            onClick={() => onTabChange('issue')}
            className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-red-700 text-stone-50 flex items-center justify-center font-serif text-sm font-bold shadow-xs">
              認
            </div>
            <div>
              <span className="font-serif font-bold text-stone-900 text-base sm:text-lg tracking-tight">
                ExcuseOffice
              </span>
              <span className="text-[11px] text-stone-500 font-sans ml-1.5 hidden sm:inline">
                공식 핑계 발급소
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => onTabChange('issue')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'issue'
                  ? 'bg-stone-900 text-stone-50 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>공문 발급</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'archive'
                  ? 'bg-stone-900 text-stone-50 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>보관소</span>
              {documentCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === 'archive' ? 'bg-stone-700 text-stone-200' : 'bg-stone-200 text-stone-700'
                }`}>
                  {documentCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('stamps')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'stamps'
                  ? 'bg-stone-900 text-stone-50 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>도감</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'stamps' ? 'bg-red-800 text-stone-100' : 'bg-red-50 text-red-700'
              }`}>
                {unlockedStampsCount}/{totalStampsCount}
              </span>
            </button>
          </nav>

          {/* Zone 3: Today's Excuse & Applicant */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onOpenTodayModal}
              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg border border-amber-200/80 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">오늘의 핑계</span>
              <span className="sm:hidden">오늘</span>
            </button>

            <div className="hidden md:flex items-center space-x-1.5 text-xs text-stone-600 px-2 py-1 bg-stone-100/80 rounded-lg border border-stone-200/60">
              <User className="w-3 h-3 text-stone-400" />
              <span className="font-medium text-stone-800">{applicant}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

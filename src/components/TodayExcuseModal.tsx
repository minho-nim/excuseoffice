import React from 'react';
import { getTodayExcuse } from '../utils/generator';
import { Sparkles, Calendar, ArrowRight, X } from 'lucide-react';

interface TodayExcuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdoptExcuse: (category: any, situation: string) => void;
}

export const TodayExcuseModal: React.FC<TodayExcuseModalProps> = ({
  isOpen,
  onClose,
  onAdoptExcuse,
}) => {
  if (!isOpen) return null;

  const today = getTodayExcuse();

  const handleAdopt = () => {
    onAdoptExcuse(today.category, today.situation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative text-slate-900">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center border-b border-slate-200 pb-4 mb-4">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-amber-600 mr-0.5" />
            <span>오늘의 추천 핑계</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
            {today.excuse.title}
          </h2>
          <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 mt-1 font-mono">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>{today.dateFormatted}</span>
            <span>·</span>
            <span>종류: {today.categoryName}</span>
          </div>
        </div>

        {/* Excuse Content Box */}
        <div className="space-y-3 text-xs sm:text-sm font-serif bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs leading-relaxed">
          <div>
            <span className="text-[11px] font-sans font-bold text-slate-500">이유</span>
            <p className="text-slate-800 mt-0.5">{today.excuse.cause}</p>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-sans font-bold text-red-800">추천 문구</span>
            <p className="text-red-950 font-bold bg-red-50/80 p-2.5 rounded-lg border border-red-200/80 mt-1">
              {today.excuse.decision}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleAdopt}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <span>이 핑계로 문서 만들기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

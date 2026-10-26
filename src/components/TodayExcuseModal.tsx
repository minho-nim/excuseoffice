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
    onAdoptExcuse(today.category, today.excuse.title);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#fcfaf7] border border-stone-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-stone-900">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-stone-200/80 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center border-b border-stone-200 pb-4 mb-4">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-amber-600 mr-0.5" />
            <span>오늘의 공식 핑계 공표안</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900">
            {today.excuse.title}
          </h2>
          <div className="flex items-center justify-center space-x-2 text-xs text-stone-500 mt-1 font-mono">
            <Calendar className="w-3 h-3 text-stone-400" />
            <span>{today.dateFormatted}</span>
            <span>·</span>
            <span>관할: {today.categoryName}과</span>
          </div>
        </div>

        {/* Excuse Content Box */}
        <div className="space-y-3 text-xs sm:text-sm font-serif bg-white p-4 rounded-xl border border-stone-200/80 shadow-2xs leading-relaxed">
          <div>
            <span className="text-[11px] font-sans font-bold text-stone-500">주요 발생 원인</span>
            <p className="text-stone-800 mt-0.5">{today.excuse.cause}</p>
          </div>

          <div className="pt-2 border-t border-stone-100">
            <span className="text-[11px] font-sans font-bold text-red-800">행정적 최종 의결</span>
            <p className="text-red-950 font-bold bg-red-50/80 p-2.5 rounded-lg border border-red-200/80 mt-1">
              {today.excuse.decision}
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end space-x-2 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleAdopt}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <span>이 핑계로 발급하기</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { UserStats, StampInfo, Achievement } from '../types';
import { CATEGORIES } from '../data/excuses';
import {
  Stamp,
  Award,
  Lock,
  CheckCircle2,
  Flame,
  FileCheck2,
  Crown,
  BarChart3,
  Moon,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface StampBookProps {
  userStats: UserStats;
  stamps: StampInfo[];
  achievements: Achievement[];
  onSelectStampToUse?: (stampId: string) => void;
}

export const StampBook: React.FC<StampBookProps> = ({
  userStats,
  stamps,
  achievements,
}) => {
  const unlockedStampCount = stamps.filter((s) => s.isUnlocked).length;
  const unlockedAchCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="space-y-6">
      {/* 4 KPI Metric Strips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-stone-500 text-xs mb-1">
            <FileCheck2 className="w-4 h-4 text-red-700" />
            <span className="font-medium">만든 문서</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 font-mono">
            {userStats.totalIssued} <span className="text-xs font-normal text-stone-400">건</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-stone-500 text-xs mb-1">
            <Stamp className="w-4 h-4 text-amber-600" />
            <span className="font-medium">모은 도장</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 font-mono">
            {unlockedStampCount} / {stamps.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-stone-500 text-xs mb-1">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-medium">연속으로 온 날</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 font-mono">
            {userStats.streakDays || 1} <span className="text-xs font-normal text-stone-400">일차</span>
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-stone-500 text-xs mb-1">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="font-medium">모은 기록</span>
          </div>
          <p className="text-2xl font-bold text-stone-900 font-mono">
            {unlockedAchCount} / {achievements.length}
          </p>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
        <h3 className="text-xs font-bold text-stone-700 uppercase tracking-tight mb-3 flex items-center space-x-1.5">
          <BarChart3 className="w-4 h-4 text-stone-400" />
          <span>종류별 문서 수</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const count = userStats.categoryCount[cat.id] || 0;
            return (
              <div key={cat.id} className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/70 text-center">
                <p className="text-xs font-semibold text-stone-700">{cat.name}</p>
                <p className="text-lg font-bold text-stone-900 font-mono mt-0.5">{count}</p>
                <div className="w-full bg-stone-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-stone-800 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, count * 20)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stamp Collection */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Stamp className="w-5 h-5 text-red-700" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">내 도장</h2>
          </div>
          <span className="text-xs text-red-700 font-semibold bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
            {unlockedStampCount === stamps.length ? '모든 도장을 모았어요' : `${unlockedStampCount}개 사용 가능`}
          </span>
        </div>

        <p className="text-xs text-stone-500">
          문서를 만들면 새 도장을 모을 수 있어요. 모은 도장은 문서에 찍을 수 있습니다.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {stamps.map((stamp) => {
            return (
              <div
                key={stamp.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  stamp.isUnlocked
                    ? 'bg-amber-50/30 border-amber-200/80 shadow-2xs'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-stone-800">{stamp.name}</span>
                    {stamp.isUnlocked ? (
                      <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> 사용 가능
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3 mr-0.5" /> 아직 못 씀
                      </span>
                    )}
                  </div>

                  {/* Stamp Graphic */}
                  <div className="h-28 flex items-center justify-center my-1">
                    {stamp.isUnlocked ? (
                      <div
                        className={`stamp-seal relative flex flex-col items-center justify-center ${
                          stamp.shape === 'square'
                            ? 'w-20 h-20 rounded-md border-4'
                            : stamp.shape === 'oval'
                            ? 'w-24 h-18 rounded-[50%] border-4'
                            : 'w-20 h-20 rounded-full border-4'
                        }`}
                        style={{
                          borderColor: stamp.color,
                          color: stamp.color,
                          boxShadow: `0 0 1px 1px ${stamp.color}30`,
                        }}
                      >
                        <span className="text-[9px] font-bold tracking-widest">★ 認可 ★</span>
                        <span className="font-stamp text-[11px] font-black leading-tight text-center px-1">
                          {stamp.sealText}
                        </span>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400">
                        <Lock className="w-5 h-5 mb-1 opacity-40" />
                        <span className="text-[10px] font-mono">잠김</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 font-medium mb-1 mt-1">{stamp.description}</p>
                </div>

                <div className="pt-2 border-t border-stone-200/80 text-[11px] text-stone-500">
                  <span className="font-medium text-stone-700">모으는 방법: </span>
                  <span>{stamp.unlockRequirement}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements Section */}
      <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-700" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-stone-900">모은 기록</h2>
          </div>
          <span className="text-xs font-mono text-stone-500">
            {unlockedAchCount}/{achievements.length} 달성
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {achievements.map((ach) => {
            const renderIcon = () => {
              switch (ach.icon) {
                case 'Crown':
                  return <Crown className="w-4 h-4" />;
                case 'ShieldCheck':
                  return <CheckCircle2 className="w-4 h-4" />;
                case 'AlertTriangle':
                  return <AlertTriangle className="w-4 h-4" />;
                case 'Moon':
                  return <Moon className="w-4 h-4" />;
                case 'Flame':
                  return <Flame className="w-4 h-4" />;
                default:
                  return <FileText className="w-4 h-4" />;
              }
            };

            return (
              <div
                key={ach.id}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-colors ${
                  ach.isUnlocked
                    ? 'bg-indigo-50/30 border-indigo-200 text-stone-900'
                    : 'bg-stone-50 border-stone-200 text-stone-400 opacity-60'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    ach.isUnlocked ? 'bg-indigo-600 text-white' : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {renderIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${ach.isUnlocked ? 'text-stone-900' : 'text-stone-500'}`}>
                      {ach.title}
                    </p>
                    {ach.isUnlocked && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-mono">
                        달성
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

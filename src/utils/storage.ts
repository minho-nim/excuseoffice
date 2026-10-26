import { UserStats, ExcuseCategory, StampInfo, Achievement } from '../types';
import { INITIAL_STAMPS } from '../data/excuses';

const STORAGE_KEY = 'excuse_office_user_stats';

const INITIAL_STATS: UserStats = {
  totalIssued: 0,
  categoryCount: {
    daily: 0,
    work_school: 0,
    health_fitness: 0,
    social: 0,
    etc: 0,
  },
  unlockedStampIds: ['stamp_default'],
  nickname: '김핑계',
  lastVisitDate: '',
  streakDays: 1,
  unlockedAchievements: [],
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach_first_excuse',
    title: '첫 문서 만들기',
    description: '처음으로 핑계 문서를 만들었어요.',
    icon: 'FileText',
    isUnlocked: false,
  },
  {
    id: 'ach_triple_threat',
    title: '문서 세 개 만들기',
    description: '핑계 문서를 세 개 만들었어요.',
    icon: 'Award',
    isUnlocked: false,
  },
  {
    id: 'ach_urgent_master',
    title: '급한 문서 만들기',
    description: '급한 핑계 문서를 만들었어요.',
    icon: 'AlertTriangle',
    isUnlocked: false,
  },
  {
    id: 'ach_bureaucrat',
    title: '문서 열 개 만들기',
    description: '핑계 문서를 열 개 만들었어요.',
    icon: 'ShieldCheck',
    isUnlocked: false,
  },
  {
    id: 'ach_all_rounder',
    title: '다섯 종류 모두 만들기',
    description: '다섯 가지 상황으로 문서를 하나씩 만들었어요.',
    icon: 'Crown',
    isUnlocked: false,
  },
  {
    id: 'ach_night_owl',
    title: '밤에 문서 만들기',
    description: '밤 12시부터 새벽 5시 사이에 문서를 만들었어요.',
    icon: 'Moon',
    isUnlocked: false,
  },
  {
    id: 'ach_streak_3',
    title: '사흘 연속 방문',
    description: '3일 연속으로 핑계오피스에 왔어요.',
    icon: 'Flame',
    isUnlocked: false,
  },
];

/**
 * Load user stats from localStorage with fallback and streak calculation
 */
export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return INITIAL_STATS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let stats: UserStats = raw ? JSON.parse(raw) : { ...INITIAL_STATS };

    // Update streak based on local date
    const todayStr = getTodayString();
    if (!stats.lastVisitDate) {
      stats.lastVisitDate = todayStr;
      stats.streakDays = 1;
    } else if (stats.lastVisitDate !== todayStr) {
      const last = new Date(stats.lastVisitDate);
      const today = new Date(todayStr);
      const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        stats.streakDays = (stats.streakDays || 1) + 1;
      } else if (diffDays > 1) {
        stats.streakDays = 1;
      }
      stats.lastVisitDate = todayStr;

      if (stats.streakDays >= 3 && !stats.unlockedAchievements.includes('ach_streak_3')) {
        stats.unlockedAchievements.push('ach_streak_3');
      }
      saveUserStats(stats);
    }

    return stats;
  } catch (e) {
    console.warn('Failed to parse user stats from localStorage', e);
    return INITIAL_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save user stats', e);
  }
}

export function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Update stats after issuing a document and check stamp / achievement unlocks
 */
export function recordDocumentIssuance(
  category: ExcuseCategory,
  documentType: string
): {
  newStats: UserStats;
  newlyUnlockedStamps: StampInfo[];
  newlyUnlockedAchievements: Achievement[];
} {
  const stats = getUserStats();

  stats.totalIssued += 1;
  stats.categoryCount[category] = (stats.categoryCount[category] || 0) + 1;

  const previousStampIds = new Set(stats.unlockedStampIds);
  const previousAchIds = new Set(stats.unlockedAchievements);

  // Check stamps unlock conditions
  // 1. stamp_default is always unlocked
  if (!stats.unlockedStampIds.includes('stamp_default')) {
    stats.unlockedStampIds.push('stamp_default');
  }

  // 2. stamp_special: >= 3 total
  if (stats.totalIssued >= 3 && !stats.unlockedStampIds.includes('stamp_special')) {
    stats.unlockedStampIds.push('stamp_special');
  }

  // 3. stamp_urgent: documentType === 'urgent_dispatch' or totalIssued >= 5
  if ((documentType === 'urgent_dispatch' || stats.totalIssued >= 5) && !stats.unlockedStampIds.includes('stamp_urgent')) {
    stats.unlockedStampIds.push('stamp_urgent');
  }

  // 4. stamp_force_majeure: >= 10 total
  if (stats.totalIssued >= 10 && !stats.unlockedStampIds.includes('stamp_force_majeure')) {
    stats.unlockedStampIds.push('stamp_force_majeure');
  }

  // 5. stamp_legendary: all 5 categories have >= 1 count
  const allCatsFilled = (['daily', 'work_school', 'health_fitness', 'social', 'etc'] as ExcuseCategory[]).every(
    (c) => (stats.categoryCount[c] || 0) >= 1
  );
  if (allCatsFilled && !stats.unlockedStampIds.includes('stamp_legendary')) {
    stats.unlockedStampIds.push('stamp_legendary');
  }

  // Check achievements unlock conditions
  // First excuse
  if (stats.totalIssued >= 1 && !stats.unlockedAchievements.includes('ach_first_excuse')) {
    stats.unlockedAchievements.push('ach_first_excuse');
  }
  // 3 excuses
  if (stats.totalIssued >= 3 && !stats.unlockedAchievements.includes('ach_triple_threat')) {
    stats.unlockedAchievements.push('ach_triple_threat');
  }
  // Urgent master
  if (documentType === 'urgent_dispatch' && !stats.unlockedAchievements.includes('ach_urgent_master')) {
    stats.unlockedAchievements.push('ach_urgent_master');
  }
  // 10 excuses
  if (stats.totalIssued >= 10 && !stats.unlockedAchievements.includes('ach_bureaucrat')) {
    stats.unlockedAchievements.push('ach_bureaucrat');
  }
  // All rounder
  if (allCatsFilled && !stats.unlockedAchievements.includes('ach_all_rounder')) {
    stats.unlockedAchievements.push('ach_all_rounder');
  }
  // Night owl (between 00:00 and 05:00)
  const currentHour = new Date().getHours();
  if (currentHour >= 0 && currentHour < 5 && !stats.unlockedAchievements.includes('ach_night_owl')) {
    stats.unlockedAchievements.push('ach_night_owl');
  }

  saveUserStats(stats);

  // Determine what was newly unlocked
  const newlyUnlockedStamps = INITIAL_STAMPS.filter(
    (s) => stats.unlockedStampIds.includes(s.id) && !previousStampIds.has(s.id)
  );

  const newlyUnlockedAchievements = ACHIEVEMENTS.filter(
    (a) => stats.unlockedAchievements.includes(a.id) && !previousAchIds.has(a.id)
  );

  return {
    newStats: stats,
    newlyUnlockedStamps,
    newlyUnlockedAchievements,
  };
}

/**
 * Returns list of stamps with dynamic unlock status based on user stats
 */
export function getStampsWithStatus(stats: UserStats): StampInfo[] {
  return INITIAL_STAMPS.map((stamp) => ({
    ...stamp,
    isUnlocked: stats.unlockedStampIds.includes(stamp.id),
  }));
}

/**
 * Returns list of achievements with dynamic unlock status based on user stats
 */
export function getAchievementsWithStatus(stats: UserStats): Achievement[] {
  return ACHIEVEMENTS.map((ach) => ({
    ...ach,
    isUnlocked: stats.unlockedAchievements.includes(ach.id),
  }));
}

/**
 * Update applicant nickname in user stats
 */
export function setApplicantNickname(nickname: string): void {
  const stats = getUserStats();
  stats.nickname = nickname.trim() || '김핑계';
  saveUserStats(stats);
}

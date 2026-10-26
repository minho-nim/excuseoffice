import { ExcuseCategory, DocumentType, GeneratedExcuse, IssuedDocument, IssueMode } from '../types';
import { APPROVAL_TIERS, INITIAL_STAMPS } from '../data/excuses';
import { SIMPLE_THEMES, type ExcuseVariant } from '../data/simpleThemes';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const recentVariants = new Map<string, string[]>();

function findVariants(category: ExcuseCategory, situation: string): ExcuseVariant[] {
  const text = situation.toLowerCase().replace(/\s+/g, '');
  const ranked = SIMPLE_THEMES.map((theme) => ({
    theme,
    score: theme.keywords.reduce((sum, keyword) => text.includes(keyword) ? sum + keyword.length : sum, 0),
  })).sort((a, b) => b.score - a.score);
  if (ranked[0].score > 0) return ranked[0].theme.variants;
  const options = SIMPLE_REASONS[category] || SIMPLE_REASONS.etc;
  return options.causes.map((cause, index) => ({ cause, decision: options.decisions[index] }));
}

const SIMPLE_REASONS: Record<ExcuseCategory, { causes: string[]; decisions: string[] }> = {
  daily: {
    causes: ['계획은 세웠지만 몸과 마음이 조금 늦게 따라왔어요.', '하루 계획에 예상하지 못한 쉼표가 생겼어요.', '바로 시작하려 했지만 준비 시간이 더 필요했어요.'],
    decisions: ['오늘은 조금 늦게 시작해도 괜찮아요.', '남은 일은 할 수 있을 때 다시 해요.', '잠깐 쉬고 천천히 움직여도 됩니다.'],
  },
  work_school: {
    causes: ['해야 할 일이 많아 머리가 복잡했어요.', '과제나 일을 시작하기가 쉽지 않았어요.', '잠깐 쉬는 사이 시간이 지나갔어요.'],
    decisions: ['오늘 할 일은 가능한 만큼만 해요.', '급하지 않은 일은 나중에 해도 괜찮아요.', '잠깐 쉬고 하나씩 다시 시작해요.'],
  },
  health_fitness: {
    causes: ['몸과 마음이 평소보다 천천히 움직이고 싶었어요.', '오늘 쓸 기운을 잠깐 충전할 시간이 필요했어요.', '계획보다 컨디션을 먼저 챙기기로 했어요.'],
    decisions: ['오늘은 몸을 쉬게 해 주세요.', '컨디션이 좋아지면 다시 해요.', '하루의 계획이 달라졌다고 너무 걱정하지 않아도 돼요.'],
  },
  social: {
    causes: ['마음을 정리하는 시간이 조금 필요했어요.', '생각한 계획과 실제 상황이 조금 달랐어요.', '서두르기보다 잠깐 쉬어 가고 싶었어요.'],
    decisions: ['필요한 이야기는 미리 전하고 쉬어도 돼요.', '편할 때 마음을 전해도 괜찮아요.', '다음에는 더 좋은 기분으로 이어가요.'],
  },
  etc: {
    causes: ['생각한 계획과 실제 상황이 조금 달랐어요.', '마음이 복잡해서 쉬고 싶었어요.', '생각보다 일이 잘 풀리지 않았어요.'],
    decisions: ['오늘은 너무 자책하지 않아도 돼요.', '한 번에 하나씩 다시 해봐요.', '잠깐 쉬고 나서 이어가도 괜찮아요.'],
  },
};

const SIMPLE_JUDGMENTS = [
  '누구나 이런 날이 있어요.',
  '조금 쉬어 가도 괜찮은 상황이에요.',
  '너무 무리하지 말고 천천히 해도 됩니다.',
];

const TODAY_SITUATIONS: Record<ExcuseCategory, string[]> = {
  daily: ['침대에서 나오기 싫어요.', '아침 준비가 늦어졌어요.', '청소를 미루고 싶어요.'],
  work_school: ['일이 너무 많아요.', '과제를 시작하기 어려워요.', '회의에 갈 힘이 없어요.'],
  health_fitness: ['오늘은 운동을 쉬고 싶어요.', '몸이 피곤해요.', '간식을 많이 먹었어요.'],
  social: ['약속에 갈 기운이 없어요.', '답장을 미루고 있어요.', '오늘은 혼자 쉬고 싶어요.'],
  etc: ['딴짓을 하다 시간이 갔어요.', '마음이 복잡해요.', '오늘은 아무것도 하기 싫어요.'],
};

export function generateExcuse(
  category: ExcuseCategory,
  userSituation: string,
  forceReroll = false,
  previousExcuse?: GeneratedExcuse
): GeneratedExcuse {
  const situation = userSituation.trim();
  const key = category + ':' + situation.replace(/\s+/g, '').toLowerCase();
  const variants = findVariants(category, situation);
  const history = recentVariants.get(key) || [];
  const excluded = new Set(history);
  if (forceReroll && previousExcuse) excluded.add(previousExcuse.cause);
  let available = variants.filter((variant) => !excluded.has(variant.cause));
  if (!available.length) {
    const lastCause = previousExcuse?.cause || history[history.length - 1];
    available = variants.filter((variant) => variant.cause !== lastCause);
    history.length = 0;
  }
  const variant = pick(available.length ? available : variants);
  history.push(variant.cause);
  recentVariants.delete(key);
  recentVariants.set(key, history);
  if (recentVariants.size > 100) recentVariants.delete(recentVariants.keys().next().value!);
  return buildExcuse(situation, variant, pick(SIMPLE_JUDGMENTS));
}

function buildExcuse(situation: string, variant: ExcuseVariant, judgment: string): GeneratedExcuse {
  const shortSituation = situation.length > 28 ? situation.slice(0, 28) + '…' : situation;
  const { cause, decision } = variant;
  const title = shortSituation
    ? '“' + shortSituation + '”에 대한 핑계'
    : '오늘은 쉬어도 되는 이유';

  return {
    title,
    cause,
    description: situation
      ? '“' + situation + '” 때문에 만든 재미용 가짜 문서예요.'
      : '오늘 겪은 일을 가볍게 웃어넘길 수 있게 만든 문서예요.',
    judgment,
    decision,
    fullSummary: cause + ' ' + decision,
  };
}

export function getTodayExcuse(dateString?: string): {
  category: ExcuseCategory;
  categoryName: string;
  situation: string;
  excuse: GeneratedExcuse;
  dateFormatted: string;
} {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const key = dateString || yyyy + '-' + mm + '-' + dd;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(Date.parse(key + 'T00:00:00Z')) ||
      new Date(key + 'T00:00:00Z').toISOString().slice(0, 10) !== key) {
    throw new Error('날짜를 확인해 주세요.');
  }

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const categories: ExcuseCategory[] = ['daily', 'work_school', 'health_fitness', 'social', 'etc'];
  const category = categories[seed % categories.length];
  const situations = TODAY_SITUATIONS[category];
  const situation = situations[Math.floor(seed / 7) % situations.length];
  const variants = findVariants(category, situation);
  const excuse = buildExcuse(situation, variants[Math.floor(seed / 17) % variants.length], SIMPLE_JUDGMENTS[Math.floor(seed / 23) % SIMPLE_JUDGMENTS.length]);
  const [year, month, day] = key.split('-');

  return {
    category,
    categoryName: {
      daily: '일상',
      work_school: '일과 공부',
      health_fitness: '건강과 운동',
      social: '약속과 모임',
      etc: '기타',
    }[category],
    situation,
    excuse,
    dateFormatted: year + '년 ' + month + '월 ' + day + '일',
  };
}

export function generateIssueNumber(sequenceNumber: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return '(주)핑계-' + yyyy + mm + dd + '-' + seq;
}

export function getRandomApprovalTier(): string {
  return pick(APPROVAL_TIERS);
}

export function createIssuedDocument(params: {
  applicant: string;
  category: ExcuseCategory;
  situation: string;
  excuse: GeneratedExcuse;
  documentType: DocumentType;
  issueMode: IssueMode;
  approvalTier: string;
  stampId: string;
  totalIssuedSoFar: number;
}): IssuedDocument {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const stamp = INITIAL_STAMPS.find((item) => item.id === params.stampId) || INITIAL_STAMPS[0];

  return {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    issueNumber: generateIssueNumber(params.totalIssuedSoFar + 1),
    issuedAt: now.toISOString(),
    formattedDate: yyyy + '년 ' + mm + '월 ' + dd + '일',
    applicant: params.applicant.trim() || '김핑계',
    category: params.category,
    situation: params.situation.trim() || '상황을 적지 않았어요.',
    excuse: params.excuse,
    documentType: params.documentType,
    issueMode: params.issueMode || 'quick',
    approvalTier: params.approvalTier,
    stampId: stamp.id,
    stampName: stamp.name,
    stampSealText: stamp.sealText,
    organization: '핑계오피스',
    disclaimer: '재미로 만든 가짜 문서입니다. 실제 서류로 쓸 수 없어요.',
  };
}

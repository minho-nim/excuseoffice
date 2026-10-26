import { ExcuseCategory, DocumentType, GeneratedExcuse, IssuedDocument, IssueMode, DocumentDetails } from '../types';
import { APPROVAL_TIERS, INITIAL_STAMPS } from '../data/excuses';
import { findSimpleTheme, type ExcuseVariant } from '../data/simpleThemes';
import { getReviewOpinion } from './review';
import { DOCUMENT_DISCLAIMER, applyDocumentDetails } from './documentText';

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const recentVariants = new Map<string, string[]>();

function findVariants(category: ExcuseCategory, situation: string): ExcuseVariant[] {
  const theme = findSimpleTheme(situation);
  if (theme) return theme.variants;
  const options = SIMPLE_REASONS[category] || SIMPLE_REASONS.etc;
  return options.causes.map((cause, index) => ({ cause, decision: options.decisions[index] }));
}

const SIMPLE_REASONS: Record<ExcuseCategory, { causes: string[]; decisions: string[] }> = {
  daily: {
    causes: ['계획은 세웠지만 몸과 마음이 조금 늦게 따라왔어요.', '하루 계획에 예상하지 못한 쉼표가 생겼어요.', '바로 시작하려 했지만 준비 시간이 더 필요했어요.'],
    decisions: ['계획과 몸의 의견이 달라 생긴 일입니다. 오늘 한 번만 너그럽게 봐주시기 바랍니다.', '오늘 일정에 예상 밖의 쉼표가 들어갔습니다. 친구 여러분은 마침표로 오해하지 말아 주시기 바랍니다.', '준비 중이었으므로 아무것도 안 했다는 주장은 받아들이기 어렵습니다. 마음속 노력도 인정해 주시기 바랍니다.'],
  },
  work_school: {
    causes: ['해야 할 일이 많아 머리가 복잡했어요.', '과제나 일을 시작하기가 쉽지 않았어요.', '잠깐 쉬는 사이 시간이 지나갔어요.'],
    decisions: ['머릿속 업무가 밀려 처리가 늦어졌습니다. 친구 여러분의 재촉은 잠시 뒤에 접수하겠습니다.', '과제와 일이 시간을 먼저 가져갔습니다. 오늘의 느린 답변과 늦은 등장을 한 번만 봐주시기 바랍니다.', '일할 마음은 분명히 있었습니다. 마음과 결과 사이의 시차를 인정해 주시기 바랍니다.'],
  },
  health_fitness: {
    causes: ['몸과 마음이 평소보다 천천히 움직이고 싶었어요.', '오늘 쓸 기운을 잠깐 충전할 시간이 필요했어요.', '계획보다 컨디션을 먼저 챙기기로 했어요.'],
    decisions: ['오늘은 몸이 휴업을 선언했습니다. 본인의 의사와 별개로 일정 변경을 요청합니다.', '기운이 돌아올 때까지 임시 충전 중입니다. 우정에는 이상이 없으니 안심해 주시기 바랍니다.', '오늘 계획은 몸의 반대로 취소됐습니다. 잔소리는 몸과 직접 협의해 주시기 바랍니다.'],
  },
  social: {
    causes: ['마음을 정리하는 시간이 조금 필요했어요.', '생각한 계획과 실제 상황이 조금 달랐어요.', '서두르기보다 잠깐 쉬어 가고 싶었어요.'],
    decisions: ['친구를 피한 게 아니라 오늘의 에너지가 먼저 도망갔습니다. 우정은 그대로 유지합니다.', '예상 밖의 상황으로 일정이 꼬였습니다. 다음 만남의 웃긴 이야기로 대신 갚겠습니다.', '오늘은 잠깐 연락과 외출을 쉬겠습니다. 친구 명단에서 삭제하는 일은 보류해 주시기 바랍니다.'],
  },
  etc: {
    causes: ['생각한 계획과 실제 상황이 조금 달랐어요.', '마음이 복잡해서 쉬고 싶었어요.', '생각보다 일이 잘 풀리지 않았어요.'],
    decisions: ['사정이 이러하므로 오늘 한 번만 봐주시기 바랍니다. 다음 핑계는 더 잘 준비하겠습니다.', '설명은 조금 부족하지만 도장은 확실히 찍었습니다. 친구 여러분의 넓은 이해를 요청합니다.', '본 사유를 오늘의 공식 핑계로 제출합니다. 추가 질문은 간식과 함께 부탁드립니다.'],
  },
};

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
  return buildExcuse(situation, variant);
}

function buildExcuse(situation: string, variant: ExcuseVariant): GeneratedExcuse {
  const shortSituation = situation.length > 28 ? situation.slice(0, 28) + '…' : situation;
  const { cause, decision } = variant;
  const title = shortSituation
    ? '“' + shortSituation + '”에 대한 핑계'
    : '오늘의 공식 핑계';

  return {
    title,
    cause,
    description: situation
      ? '“' + situation + '” 사유로 친구 여러분의 봐주기를 요청합니다.'
      : '친구 여러분에게 오늘의 핑계를 제출합니다.',
    judgment: getReviewOpinion(situation),
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
  const excuse = buildExcuse(situation, variants[Math.floor(seed / 17) % variants.length]);
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
  details?: DocumentDetails;
}): IssuedDocument {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const stamp = INITIAL_STAMPS.find((item) => item.id === params.stampId) || INITIAL_STAMPS[0];

  const document: IssuedDocument = {
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
    disclaimer: DOCUMENT_DISCLAIMER,
  };
  return applyDocumentDetails(document, params.details);
}

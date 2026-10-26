import { ExcuseCategory, DocumentType, GeneratedExcuse, IssuedDocument, IssueMode } from '../types';
import { COMPLETED_EXCUSES, APPROVAL_TIERS, INITIAL_STAMPS } from '../data/excuses';

const recentTitles: string[] = [];
const MAX_RECENT = 10;

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface SemanticTheme {
  theme: string;
  keywords: string[];
  causeTemplates: string[];
  judgmentTemplates: string[];
  decisionTemplates: string[];
}

// Corporate / Administrative Semantic Clauses
const SEMANTIC_THEMES: SemanticTheme[] = [
  {
    theme: 'sleep_bed',
    keywords: ['이불', '침대', '기상', '늦잠', '아침', '알람', '졸림', '수면', '잠', '베개'],
    causeTemplates: [
      '대기 기온 급락에 따른 침구류 극세사 분자와 체표면 간의 국소적 물리 흡착력 급증',
      '수면 주기 렘(REM) 상태에서 현실 인지 신경망으로의 접속 지연 및 대뇌 전압 일시 저하',
      '알람 음향 신호에 대한 자율신경계의 비자발적 방어 본능 발동으로 인한 기상 불가',
    ],
    judgmentTemplates: [
      '신청인의 진술 및 물리적 환경을 검토한 결과, 극심한 체온 저하 상태에서의 강제 기상은 당일 전체 업무 효율성을 70% 이상 저하시킬 위험이 있음.',
      '수면 부족 상태에서의 억지 출근은 인적 자원의 안전 및 사내 생산성에 유해하므로 적정 수면 회복이 타당함.',
    ],
    decisionTemplates: [
      '금일 기상 지연 사태에 대한 정당한 사유를 인정하며, 정상 컨디션 회복 시까지 오전 일정을 공식 유예함.',
      '지각 및 오전 공백에 대한 인사상 불이익 일체를 금지하며, 포근한 침대 잔류 권리를 행정적으로 승인함.',
    ],
  },
  {
    theme: 'work_career',
    keywords: ['출근', '퇴근', '야근', '월요병', '월요일', '회의', '업무', '회사', '상사', '보고서', '슬랙', '엑셀', '칼퇴'],
    causeTemplates: [
      '과중한 직무 스트레스 및 모니터 블루라이트 누적에 따른 뇌 신경망 일시 보호 모드 가동',
      '사내 분위기 및 상사 레이더 감지에 따른 근로자 헌법상 칼퇴근 자기방어권 긴급 발동',
      '월요일 체감 시공간 왜곡 현상에 기인한 신체 기립 및 이동 추진력 급락',
    ],
    judgmentTemplates: [
      '무리한 연장 근로 및 과업 강행은 번아웃 참사 및 대형 업무 오류를 야기할 가능성이 명백함.',
      '형식적 야근보다 적시 퇴근과 심신 휴식이 중장기적 조직 생산성과 사기 진작에 훨씬 기여함.',
    ],
    decisionTemplates: [
      '금일 부과된 잔여 업무의 즉각적인 동결을 승인하고, 칼퇴근 및 업무 연락 차단을 공식 허가함.',
      '해당 업무 지체 건에 대한 일체의 문책을 면제하며, 신청인의 충분한 재충전을 사내 권고사항으로 통고함.',
    ],
  },
  {
    theme: 'study_school',
    keywords: ['과제', '숙제', '시험', '공부', '레포트', '학교', '대학', '교수', '팀플', '학점', '도서관'],
    causeTemplates: [
      '단기 기억 저장 장치의 지식 데이터 과밀화로 인한 뇌내 캐시 메모리 오버플로우',
      '학술적 완성도 추구와 마감 압박 간의 상호 간섭으로 인한 지적 연산 정지',
      '조별과제 내 무임승차 리스크 감지에 따른 선제적 방어 관망 프로토콜 가동',
    ],
    judgmentTemplates: [
      '단순 마감 준수보다 인류 지식 발전에 기여할 정서적 숙고 시간이 상위 교육적 가치임.',
      '지식 과적 상태에서의 시험공부는 두뇌 회로에 유해하므로 즉각적인 쿨링다운이 필수적임.',
    ],
    decisionTemplates: [
      '과제 및 학업 제출 기한의 무기한 유예를 인가하며 신청인의 자발적 휴식을 전격 승인함.',
      '학업 스트레스로부터 학생의 영혼을 수호하기 위한 정당한 지연 권한을 공식 부여함.',
    ],
  },
  {
    theme: 'diet_food',
    keywords: ['치킨', '야식', '다이어트', '운동', '헬스', '샐러드', '살', '배고', '피자', '라면', '먹었', '식단'],
    causeTemplates: [
      '야간 세로토닌 결핍에 따른 대뇌 보상 회로의 고열량 황색 지방산 긴급 수혈 명령',
      '빙하기 생존 유전자의 영양 비축 본능이 현대의 다이어트 결심 회로를 압도',
      '샐러드 저작 활동 시 발생하는 정서적 탈진 및 행복 호르몬 결핍 사태',
    ],
    judgmentTemplates: [
      '영혼의 굶주림을 방치할 경우 발생하는 성격 예민화 리스크가 음식 섭취보다 조직 평화에 더 치명적임.',
      '신청인이 섭취한 음식은 단순 과식이 아닌 생존 및 정신 안정을 위한 비상 영양 수혈로 분류함이 타당함.',
    ],
    decisionTemplates: [
      '금일 섭취한 모든 열량을 "심리 안정 비상 연료"로 공식 회계 재분류하고 일체의 죄책감을 금지함.',
      '무리한 식단 제한을 즉각 해제하고 행복한 포만감 상태 유지를 정식 인가함.',
    ],
  },
  {
    theme: 'fitness_exercise',
    keywords: ['운동', '헬스', '스쿼트', '러닝', '달리기', '피티', '요가', '필라테스', '홈트', '몸'],
    causeTemplates: [
      '주요 근육군의 지연성 근육통(DOMS) 잔류에 따른 관절 노조의 전면 파업 선언',
      '지면 반발력과 무릎 연골의 감가상각 가속화 방지 본능 작동',
      '운동복 착용 후 현관 통과 저항 계수가 임계치를 초과한 물리적 정지 현상',
    ],
    judgmentTemplates: [
      '인대와 관절의 영구 보존이 단기적 근비대보다 상위 의학적 공익에 부합함.',
      '신체 피로 누적 시의 쇠질은 오히려 면역력을 저하시키므로 침대 누워있기가 최적의 처방임.',
    ],
    decisionTemplates: [
      '금일 헬스 및 운동 출석 의무를 침대 누워 숨쉬기 운동으로 대체 승인함.',
      '신체 관절 수명 영구 보전을 위해 오늘의 신체 과열 행위를 전면 면제함.',
    ],
  },
  {
    theme: 'social_meeting',
    keywords: ['약속', '모임', '취소', '파토', '단톡', '카톡', '답장', '안읽씹', '동창', '친구', '만남', '외출'],
    causeTemplates: [
      '사회적 배터리 잔량의 법정 최소 기준치(1.5%) 미달에 따른 인간 기피증 급발진',
      '현대 메신저의 실시간 응답 강박에 대항하는 비동기적 자유 수호 본능',
      '외출 준비 시 발생하는 옷장 붕괴 및 착장 미학적 부조화에 따른 심리 동결',
    ],
    judgmentTemplates: [
      '방전된 상태로 참석한 모임은 가짜 웃음과 공허함만 낭비하므로 불참이 상호 평화에 이로움.',
      '인간관계의 유지는 적절한 거리감과 침묵의 휴식기에서 비롯된다는 사회심리학적 판단.',
    ],
    decisionTemplates: [
      '금일 약속의 불가피한 취소 및 지연 통보를 정당한 사회적 에너지 재충전권으로 인정함.',
      '단톡방 즉각 답장 의무를 공식 해제하며 충분한 안식 후 "앗 이제 봤네" 멘트 사용을 허가함.',
    ],
  },
  {
    theme: 'chores_home',
    keywords: ['청소', '설거지', '빨래', '정리', '쓰레기', '분리수거', '방청소', '먼지', '그릇'],
    causeTemplates: [
      '실내 엔트로피 보존 법칙 및 물과 세제의 환경 탄소 발자국 최소화 실천',
      '식기 표면 잔존 음식물의 수화(Hydration) 과학적 불림 작업을 위한 대기 필요성',
      '과거의 물건(일기장/졸업앨범) 발견에 따른 시간 감각 일시 마비 현상',
    ],
    judgmentTemplates: [
      '물리적 공간 정돈보다 정서적 내면 안정이 상위 가치이며 바닥의 물건은 창조적 배치로 인정함.',
      '지나친 청결 집착은 가사 노동 스트레스를 가중시키므로 적당한 방치가 건강에 이로움.',
    ],
    decisionTemplates: [
      '금일 예정된 실내 청소 및 정돈 의무를 일시 유예하고 현 상태를 "창조적 카오스"로 공인함.',
      '설거지 및 가사 과업의 익일 정오 순연 처리를 정당한 행정 조치로 승인함.',
    ],
  },
  {
    theme: 'digital_sloth',
    keywords: ['유튜브', '쇼츠', '릴스', '스마트폰', '넷플릭스', '게임', '웹툰', '알고리즘', '인스타'],
    causeTemplates: [
      '글로벌 빅테크 초정밀 추천 알고리즘의 최면성 인력에 의한 시간 광속 증발',
      '0.5초 단위 도파민 배급 시스템과의 대치 과정에서 발생한 인지 주권 피탈',
      '가상 전장의 평화 수호 및 승급전 구출을 위한 인도주의적 현실 지체',
    ],
    judgmentTemplates: [
      '수조 원 규모의 글로벌 AI 알고리즘 앞에 맨몸으로 맞선 개인의 인지적 패배는 자연법상 무과실임.',
      '디지털 몰입은 현대 문명이 허락한 정신적 진통제이므로 일체의 자책을 금지함.',
    ],
    decisionTemplates: [
      '증발한 시간에 대한 일체의 책임을 묻지 아니하며 뇌 냉각을 위한 멍때리기 세션을 특별 인가함.',
      '가상 세계에서의 분투를 정상 참작하여 현실 과업 지연에 대한 완전 면책을 부여함.',
    ],
  },
  {
    theme: 'shopping_money',
    keywords: ['쇼핑', '충동구매', '결제', '돈', '택배', '지름신', '장바구니', '세일', '사버렸'],
    causeTemplates: [
      '국가 내수 경제 활성화 및 소상공인 상생을 위한 애국적 결제 본능 발동',
      '배송비 3천 원 절약을 위한 10만 원 추가 결제의 기적의 가계 경제 논리',
      '한정 수량 마감 타이머의 시각적 최면 자극에 따른 손가락 신경 반사',
    ],
    judgmentTemplates: [
      '소비는 자본주의 혈관을 돌리는 숭고한 행위이므로 신청인의 결제는 애국적 결단으로 평가됨.',
      '물건을 사고 얻은 도파민이 향후 수일간의 삶의 원동력이 되므로 가성비 최고임.',
    ],
    decisionTemplates: [
      '금일 지출 건을 "심리 치료 및 미래 활력 투자"로 공식 회계 승인하며 대금 납부는 미래의 나에게 위임함.',
      '도착할 택배 상자를 통한 설렘 충전권을 공적으로 보장함.',
    ],
  },
];

function scoreTheme(text: string, keywords: string[]): number {
  const norm = text.toLowerCase().replace(/[\s\-_,.]/g, '');
  let score = 0;
  for (const kw of keywords) {
    const kwNorm = kw.toLowerCase().replace(/[\s\-_,.]/g, '');
    if (norm.includes(kwNorm)) {
      score += 4;
    } else if (kwNorm.length >= 2 && text.includes(kwNorm)) {
      score += 2;
    }
  }
  return score;
}

export function generateExcuse(
  category: ExcuseCategory,
  userSituation: string,
  forceReroll = false
): GeneratedExcuse {
  const cleanSituation = userSituation.trim();

  // 1. Detect semantic theme if user situation is present
  if (cleanSituation.length > 0) {
    let bestTheme: SemanticTheme | null = null;
    let highestScore = 0;

    for (const theme of SEMANTIC_THEMES) {
      const s = scoreTheme(cleanSituation, theme.keywords);
      if (s > highestScore) {
        highestScore = s;
        bestTheme = theme;
      }
    }

    if (bestTheme && highestScore >= 2) {
      const cause = getRandomItem(bestTheme.causeTemplates);
      const judgment = getRandomItem(bestTheme.judgmentTemplates);
      const decisionTemplate = getRandomItem(bestTheme.decisionTemplates);

      const shortSit = cleanSituation.length > 22 ? cleanSituation.slice(0, 22) + '…' : cleanSituation;
      const title = `[기안] 『${shortSit}』 사안에 따른 업무 유예 및 사유 인정 승인의 건`;

      const description = `신청인의 공식 사유 진술(『${cleanSituation}』)을 토대로 관련 경위를 조사한 결과:`;
      const decision = decisionTemplate;
      const fullSummary = `신청인의 『${shortSit}』 사안에 관하여 불가항력성을 인정하고 최종 승인 조치를 시행함.`;

      return {
        title,
        cause,
        description,
        judgment,
        decision,
        fullSummary,
      };
    }
  }

  // 2. Fallback to completed excuses pool for the category
  const pool = COMPLETED_EXCUSES[category] || COMPLETED_EXCUSES.daily;
  const available = pool.filter((item) => !recentTitles.includes(item.title));
  const chosen = available.length > 0 ? getRandomItem(available) : getRandomItem(pool);

  recentTitles.push(chosen.title);
  if (recentTitles.length > MAX_RECENT) recentTitles.shift();

  if (cleanSituation.length > 0) {
    const shortSit = cleanSituation.length > 22 ? cleanSituation.slice(0, 22) + '…' : cleanSituation;
    return {
      title: `[공문] 『${shortSit}』 관련 사유 승인의 건`,
      cause: chosen.cause,
      description: `신청인의 사유 제출서(『${cleanSituation}』)를 토대로 심의한 결과: ${chosen.description}`,
      judgment: chosen.judgment,
      decision: chosen.decision,
      fullSummary: `『${shortSit}』 관련 부서 심의 완료: ${chosen.fullSummary}`,
    };
  }

  return {
    title: `[공문] ${chosen.title}`,
    cause: chosen.cause,
    description: chosen.description,
    judgment: chosen.judgment,
    decision: chosen.decision,
    fullSummary: chosen.fullSummary,
  };
}

export function getTodayExcuse(dateString?: string): {
  category: ExcuseCategory;
  categoryName: string;
  excuse: GeneratedExcuse;
  dateFormatted: string;
} {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const key = dateString || `${yyyy}-${mm}-${dd}`;

  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const posHash = Math.abs(hash);

  const categories: ExcuseCategory[] = ['daily', 'work_school', 'health_fitness', 'social', 'etc'];
  const catIndex = posHash % categories.length;
  const category = categories[catIndex];

  const pool = COMPLETED_EXCUSES[category];
  const itemIndex = Math.floor(posHash / 7) % pool.length;
  const item = pool[itemIndex];

  const catNames: Record<ExcuseCategory, string> = {
    daily: '일상',
    work_school: '업무/학교',
    health_fitness: '건강/운동',
    social: '약속/모임',
    etc: '기타',
  };

  return {
    category,
    categoryName: catNames[category],
    excuse: {
      title: `[공문] ${item.title}`,
      cause: item.cause,
      description: item.description,
      judgment: item.judgment,
      decision: item.decision,
      fullSummary: item.fullSummary,
    },
    dateFormatted: `${yyyy}년 ${mm}월 ${dd}일`,
  };
}

export function generateIssueNumber(sequenceNumber: number): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(4, '0');
  return `(주)핑계-${yyyy}${mm}${dd}-${seq}`;
}

export function getRandomApprovalTier(): string {
  return getRandomItem(APPROVAL_TIERS);
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

  const stamp = INITIAL_STAMPS.find((s) => s.id === params.stampId) || INITIAL_STAMPS[0];

  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    issueNumber: generateIssueNumber(params.totalIssuedSoFar + 1),
    issuedAt: now.toISOString(),
    formattedDate: `${yyyy}년 ${mm}월 ${dd}일`,
    applicant: params.applicant.trim() || '김핑계',
    category: params.category,
    situation: params.situation.trim() || '구체적 상황 미기재',
    excuse: params.excuse,
    documentType: params.documentType,
    issueMode: params.issueMode || 'quick',
    approvalTier: params.approvalTier,
    stampId: stamp.id,
    stampName: stamp.name,
    stampSealText: stamp.sealText,
    organization: '주식회사 핑계오피스',
    disclaimer: 'MinLab 패러디 문서 — 실제 증빙 효력 없음',
  };
}

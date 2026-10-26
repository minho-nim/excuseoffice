export type ExcuseCategory = 'daily' | 'work_school' | 'health_fitness' | 'social' | 'etc';

export type ActiveTab = 'issue' | 'archive' | 'stamps';

export interface CategoryInfo {
  id: ExcuseCategory;
  name: string;
  tagline: string;
  badge: string;
  iconName: string;
}

export type DocumentType = 
  | 'official_statement'   // 공식 사유서
  | 'exemption_cert'       // 면책 확인서
  | 'urgent_dispatch'      // 긴급 공문
  | 'diagnosis_report'     // 상태 진단서
  | 'special_permit';      // 특별 허가서

export interface DocumentTypeInfo {
  id: DocumentType;
  name: string;
  subTitle: string;
  codePrefix: string;
  headerTag: string;
  borderStyle: string;
}

export interface StampInfo {
  id: string;
  name: string;
  sealText: string;
  description: string;
  unlockRequirement: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  color: string;
  shape: 'circle' | 'square' | 'oval';
}

export interface GeneratedExcuse {
  title: string;
  cause: string;         // 원인
  description: string;   // 상황 설명
  judgment: string;      // 행정적 판단
  decision: string;      // 최종 승인 문구
  fullSummary: string;   // 통합 본문
}

export type IssueMode = 'quick' | 'formal'; // 'quick': 간편 발급증 (SNS/메신저 최적화) | 'formal': 정식 행정 공문 (A4 표준)

export interface DocumentDetails {
  teamLeader: string;
  representative: string;
  recipient: string;
  date: string;
}

export interface IssuedDocument {
  id: string;                    // UUID
  issueNumber: string;           // EX-20261023-0042
  issuedAt: string;              // ISO String
  formattedDate: string;         // 2026년 10월 23일
  applicant: string;             // 신청인 별명
  category: ExcuseCategory;
  situation: string;             // 입력 상황
  excuse: GeneratedExcuse;
  documentType: DocumentType;
  issueMode: IssueMode;          // 정식 발급 vs 간편 발급
  approvalTier: string;          // 승인 등급
  stampId: string;
  stampName: string;
  stampSealText: string;
  organization: string;          // 발급 기관
  disclaimer: string;            // 'MinLab 패러디 문서 — 실제 증빙 효력 없음'
  details?: DocumentDetails;
}

export interface UserStats {
  totalIssued: number;
  categoryCount: Record<ExcuseCategory, number>;
  unlockedStampIds: string[];
  nickname: string;
  lastVisitDate: string;
  streakDays: number;
  unlockedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

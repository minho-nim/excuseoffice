import type { DocumentDetails, IssuedDocument } from '../types';
import { getReviewOpinion } from './review';

export const DOCUMENT_DISCLAIMER = '※ 재미로 만든 가짜 문서입니다. 실제 증명서나 허가서로 쓸 수 없어요.';

export function getDefaultDocumentDetails(now = new Date()): DocumentDetails {
  return {
    teamLeader: '김팀장', representative: '박대표', recipient: '친구 여러분',
    date: [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-'),
  };
}

export function normalizeDocumentDetails(value: unknown, fallback = getDefaultDocumentDetails()): DocumentDetails {
  const input = value && typeof value === 'object' ? value as Partial<DocumentDetails> : {};
  const text = (key: 'teamLeader' | 'representative' | 'recipient', max: number) =>
    typeof input[key] === 'string' && input[key]!.trim() ? input[key]!.trim().slice(0, max) : fallback[key];
  const date = typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date) &&
    Number.isFinite(Date.parse(input.date + 'T00:00:00Z')) &&
    new Date(input.date + 'T00:00:00Z').toISOString().slice(0, 10) === input.date ? input.date : fallback.date;
  return { teamLeader: text('teamLeader', 12), representative: text('representative', 12), recipient: text('recipient', 40), date };
}

export function getDocumentDetails(doc: IssuedDocument): DocumentDetails {
  const issued = new Date(doc.issuedAt);
  const fallback = getDefaultDocumentDetails(Number.isFinite(issued.getTime()) ? issued : new Date());
  return normalizeDocumentDetails(doc.details, fallback);
}

export function applyDocumentDetails(doc: IssuedDocument, value: unknown): IssuedDocument {
  const details = normalizeDocumentDetails(value, getDocumentDetails(doc));
  const [year, month, day] = details.date.split('-');
  return { ...doc, details, formattedDate: year + '년 ' + month + '월 ' + day + '일' };
}

export function getDocumentShareText(doc: IssuedDocument): string {
  const details = getDocumentDetails(doc);
  return `[사유서] ${doc.excuse.title}\n문서 번호: ${doc.issueNumber}\n작성일: ${details.date}\n기안자: ${doc.applicant}\n검토: ${details.teamLeader}\n결재: ${details.representative}\n수신: ${details.recipient}\n\n신청 내용: "${doc.situation}"\n발생 사유: ${doc.excuse.cause}\n검토 의견: ${getReviewOpinion(doc.situation)}\n최종 핑계: ${doc.excuse.decision}\n\n${DOCUMENT_DISCLAIMER}`;
}

import type { IssuedDocument } from '../types';

export const DOCUMENT_DISCLAIMER = '※ 재미로 만든 가짜 문서입니다. 실제 증명서나 허가서로 쓸 수 없어요.';

export function getDocumentShareText(doc: IssuedDocument): string {
  return `[핑계 문서] ${doc.excuse.title}\n문서 번호: ${doc.issueNumber}\n이름: ${doc.applicant}\n\n상황: "${doc.situation}"\n이유: ${doc.excuse.cause}\n최종 핑계: ${doc.excuse.decision}\n\n${DOCUMENT_DISCLAIMER}`;
}

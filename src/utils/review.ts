import { findSimpleTheme } from '../data/simpleThemes';

export function getReviewOpinion(situation: string): string {
  const theme = findSimpleTheme(situation);
  const review = theme?.review || '계획한 행동과 실제 상황 사이에 차이가 있었다는 내용입니다. 세부 원인을 단정할 자료는 부족하지만 사유를 설명하려는 의사는 확인됩니다. 본 건은 1회 양해 요청으로 접수하고, 다음 일정과 우정 유지에 미치는 영향을 고려해 판단하는 것이 적절합니다.';
  return '제출된 내용은 “' + situation.trim() + '”입니다. ' + review;
}

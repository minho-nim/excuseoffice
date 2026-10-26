import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { createIssuedDocument, generateExcuse, getTodayExcuse } from '../src/utils/generator';
import { createBackup, restoreBackup } from '../src/utils/backup';
import { getAllDocuments } from '../src/utils/db';
import { getUserStats, mergeUserStats, normalizeUserStats, saveUserStats } from '../src/utils/storage';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
  mock.method(console, 'warn', () => {});
});
afterEach(() => mock.restoreAll());

function documentFixture() {
  return createIssuedDocument({
    applicant: '백업이름', category: 'daily', situation: '방 청소를 미루고 싶어요.',
    excuse: generateExcuse('daily', '방 청소를 미루고 싶어요.'),
    documentType: 'official_statement', issueMode: 'quick',
    approvalTier: '승인', stampId: 'stamp_special', totalIssuedSoFar: 10,
  });
}

test('상황이 분류와 달라도 청소·답장·운동에 맞는 이유와 결과를 함께 고른다', () => {
  for (let i = 0; i < 12; i++) {
    const chores = generateExcuse('work_school', '방 청소를 미루고 싶어요.');
    assert.match(chores.cause + chores.decision, /청소|정리|집안일/);
    assert.doesNotMatch(chores.cause + chores.decision, /이불|출근|먹은/);
    const reply = generateExcuse('daily', '답장을 미루고 있어요.');
    assert.match(reply.cause, /답장|답할|메시지/);
    assert.doesNotMatch(reply.decision, /운동|식사|청소/);
    const exercise = generateExcuse('health_fitness', '운동을 쉬고 싶어요.');
    assert.match(exercise.cause + exercise.decision, /운동|근육|몸/);
    assert.doesNotMatch(exercise.decision, /한 끼|식사|먹은/);
  }
});

test('난수가 같아도 세 가지 이유를 모두 쓰기 전에는 반복하지 않고 바로 전 결과를 피한다', () => {
  mock.method(Math, 'random', () => 0);
  const situation = '설거지를 내일로 미루고 싶어요.';
  let previous = generateExcuse('daily', situation);
  const firstThree = new Set([previous.cause]);
  for (let i = 0; i < 20; i++) {
    const next = generateExcuse('daily', situation, true, previous);
    assert.notEqual(next.cause, previous.cause);
    if (i < 2) firstThree.add(next.cause);
    previous = next;
  }
  assert.equal(firstThree.size, 3);
});

test('오늘의 추천은 일반 핑계 생성과 무관하게 같은 날짜에 같은 전체 문구를 준다', () => {
  const expected = getTodayExcuse('2026-10-26');
  for (let i = 0; i < 10; i++) {
    generateExcuse(expected.category, expected.situation, true);
    assert.deepEqual(getTodayExcuse('2026-10-26'), expected);
  }
  assert.equal(expected.dateFormatted, '2026년 10월 26일');
  assert.equal(getTodayExcuse('2026-10-27').dateFormatted, '2026년 10월 27일');
  assert.throws(() => getTodayExcuse('2026-02-30'));
});

test('새 기기에서 문서·이름·도장·활동 기록을 복원하고 같은 백업을 다시 넣어도 횟수가 늘지 않는다', async () => {
  const document = documentFixture();
  const stats = normalizeUserStats({
    totalIssued: 12, categoryCount: { daily: 12 }, nickname: '백업이름',
    unlockedStampIds: ['stamp_special', 'stamp_force_majeure'],
    unlockedAchievements: ['ach_bureaucrat'],
    lastVisitDate: '2026-10-26', streakDays: 3,
  });
  const backup = JSON.parse(JSON.stringify(createBackup([document], stats)));
  const first = await restoreBackup(backup);
  assert.equal(first.added, 1);
  assert.equal(getUserStats().nickname, '백업이름');
  assert.equal(getUserStats().totalIssued, 12);
  assert.equal(getUserStats().categoryCount.daily, 12);
  assert.ok(getUserStats().unlockedStampIds.includes('stamp_force_majeure'));
  assert.ok(getUserStats().unlockedAchievements.includes('ach_bureaucrat'));
  const second = await restoreBackup(backup);
  assert.equal(second.added, 0);
  assert.equal(second.skipped, 1);
  assert.equal(getUserStats().totalIssued, 12);
  assert.equal((await getAllDocuments()).length, 1);
});

test('문서만 있는 예전 백업도 읽고 기존의 이름과 더 높은 활동 기록을 보존한다', async () => {
  saveUserStats(normalizeUserStats({ totalIssued: 20, categoryCount: { daily: 20 }, nickname: '현재이름' }));
  const result = await restoreBackup([documentFixture()]);
  assert.equal(result.legacy, true);
  assert.equal(result.added, 1);
  assert.equal(getUserStats().totalIssued, 20);
  assert.equal(getUserStats().nickname, '현재이름');
  assert.ok(getUserStats().unlockedStampIds.includes('stamp_force_majeure'));
});

test('지원하지 않는 백업은 거부하고 잘못된 문서 분류는 건너뛴다', async () => {
  await assert.rejects(() => restoreBackup({ format: 'ExcuseOfficeBackup', version: 9, documents: [] }));
  assert.equal((await getAllDocuments()).length, 0);
  const invalid = { ...documentFixture(), category: 'unknown-category' };
  const result = await restoreBackup([invalid]);
  assert.equal(result.added, 0);
  assert.equal(result.skipped, 1);
});

test('예전 백업에 없는 도장은 현재 기록과 합치고 연속 방문은 어제 기록부터 이어간다', () => {
  const current = normalizeUserStats({ totalIssued: 5, unlockedStampIds: ['stamp_urgent'], lastVisitDate: '2026-10-26', streakDays: 1 });
  const restored = normalizeUserStats({ totalIssued: 3, lastVisitDate: '2026-10-25', streakDays: 4 });
  const merged = mergeUserStats(current, restored, [], '2026-10-26');
  assert.equal(merged.totalIssued, 5);
  assert.equal(merged.streakDays, 5);
  assert.ok(merged.unlockedStampIds.includes('stamp_urgent'));
  assert.ok(merged.unlockedAchievements.includes('ach_streak_3'));
});

test('손상된 활동 기록은 정상 값으로 정리하고 초기 기록 배열을 공유하지 않는다', () => {
  const first = normalizeUserStats();
  first.unlockedStampIds.push('stamp_special');
  assert.deepEqual(normalizeUserStats().unlockedStampIds, ['stamp_default']);
  const invalid = normalizeUserStats({ totalIssued: -2, categoryCount: { daily: 'bad' }, unlockedStampIds: ['unknown'] });
  assert.equal(invalid.totalIssued, 0);
  assert.equal(invalid.categoryCount.daily, 0);
  assert.deepEqual(invalid.unlockedStampIds, ['stamp_default']);
});

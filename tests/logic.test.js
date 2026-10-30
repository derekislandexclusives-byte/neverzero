const NZ = require('../src/logic.js');
const assert = require('assert');
let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('PASS', name); }
  catch (e) { fail++; console.log('FAIL', name, '-', e.message); }
}
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, a + ' != ' + b);

function mk(n, start) {
  let s = NZ.emptyState();
  for (let i = 0; i < n; i++) s = NZ.addHabit(s, { name: 'H' + i, main: 'm', min: 'n', category: null }, start);
  return s;
}
const T0 = '2026-10-01';
const ids = (s) => s.order;

t('1 Main earns 100%', () => {
  let s = mk(1, T0); s = NZ.setStatus(s, T0, ids(s)[0], 'main');
  near(NZ.dayScore(s, T0).performance, 100);
});
t('2 Minimum earns 25%', () => {
  let s = mk(1, T0); s = NZ.setStatus(s, T0, ids(s)[0], 'min');
  near(NZ.dayScore(s, T0).performance, 25);
});
t('3 Missed earns 0%', () => {
  const s = mk(2, T0);
  near(NZ.dayScore(s, T0).performance, 0);
});
t('4 Equal weight (1 of 4 vs 1 of 2)', () => {
  let s = mk(4, T0); s = NZ.setStatus(s, T0, ids(s)[3], 'main');
  near(NZ.dayScore(s, T0).performance, 25);
  let s2 = mk(2, T0); s2 = NZ.setStatus(s2, T0, ids(s2)[0], 'main');
  near(NZ.dayScore(s2, T0).performance, 50);
});
t('5 Tapping selected clears it (main and min)', () => {
  let s = mk(1, T0); const id = ids(s)[0];
  s = NZ.setStatus(s, T0, id, 'main'); s = NZ.setStatus(s, T0, id, 'main');
  assert.strictEqual(NZ.statusOf(s, T0, id), null);
  s = NZ.setStatus(s, T0, id, 'min'); s = NZ.setStatus(s, T0, id, 'min');
  assert.strictEqual(NZ.statusOf(s, T0, id), null);
});
t('6 Switch directly Main<->Minimum', () => {
  let s = mk(1, T0); const id = ids(s)[0];
  s = NZ.setStatus(s, T0, id, 'main'); s = NZ.setStatus(s, T0, id, 'min');
  assert.strictEqual(NZ.statusOf(s, T0, id), 'min');
  s = NZ.setStatus(s, T0, id, 'main');
  assert.strictEqual(NZ.statusOf(s, T0, id), 'main');
});
t('7+8 Performance and consistency update immediately; spec example 65/80', () => {
  let s = mk(5, T0); const [a, b, c, d] = ids(s);
  s = NZ.setStatus(s, T0, a, 'main'); s = NZ.setStatus(s, T0, b, 'main');
  s = NZ.setStatus(s, T0, c, 'min'); s = NZ.setStatus(s, T0, d, 'main');
  const sc = NZ.dayScore(s, T0);
  assert.strictEqual(NZ.pct(sc.performance), 65);
  assert.strictEqual(NZ.pct(sc.consistency), 80);
  assert.strictEqual(sc.done, 4);
});
t('Demo starting state is 56% / 75%', () => {
  const today = '2026-10-29'; const s = NZ.buildDemo(today);
  const sc = NZ.dayScore(s, today);
  near(sc.performance, 56.25); assert.strictEqual(NZ.pct(sc.performance), 56);
  near(sc.consistency, 75); assert.strictEqual(sc.done, 3);
  const st = NZ.overallStreak(s, today);
  assert(st.current > 0 && st.best >= st.current, JSON.stringify(st));
});
t('9 All-Minimum day preserves overall streak', () => {
  let s = mk(2, T0);
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
    s = NZ.setStatus(s, d, ids(s)[0], d === '2026-10-02' ? 'min' : 'main');
    s = NZ.setStatus(s, d, ids(s)[1], d === '2026-10-02' ? 'min' : 'main');
  }
  const r = NZ.overallStreak(s, '2026-10-03');
  assert.strictEqual(r.current, 3); assert.strictEqual(r.best, 3);
});
t('10+11 Missing one habit breaks overall, only that habit resets', () => {
  let s = mk(2, T0); const [a, b] = ids(s);
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) {
    s = NZ.setStatus(s, d, a, 'main');
    if (d !== '2026-10-03') s = NZ.setStatus(s, d, b, 'main');
  }
  const T = '2026-10-04';
  const o = NZ.overallStreak(s, T);
  assert.strictEqual(o.current, 1); assert.strictEqual(o.best, 2);
  assert.strictEqual(NZ.habitStreak(s, a, T).current, 4);
  assert.strictEqual(NZ.habitStreak(s, b, T).current, 1);
  assert.strictEqual(NZ.habitStreak(s, b, T).best, 2);
});
t('Today is provisional: incomplete today does not break the streak', () => {
  let s = mk(1, T0); const a = ids(s)[0];
  s = NZ.setStatus(s, '2026-10-01', a, 'main'); s = NZ.setStatus(s, '2026-10-02', a, 'min');
  let r = NZ.overallStreak(s, '2026-10-03');
  assert.strictEqual(r.current, 2); assert.strictEqual(r.todayDone, false);
  s = NZ.setStatus(s, '2026-10-03', a, 'main');
  r = NZ.overallStreak(s, '2026-10-03');
  assert.strictEqual(r.current, 3); assert.strictEqual(r.todayDone, true);
  /* a missed yesterday does break it */
  let s2 = mk(1, T0); const a2 = ids(s2)[0];
  s2 = NZ.setStatus(s2, '2026-10-01', a2, 'main');
  assert.strictEqual(NZ.overallStreak(s2, '2026-10-03').current, 0);
});
t('12 Adding a habit does not change older daily scores', () => {
  let s = mk(4, '2026-11-01'); s = NZ.setStatus(s, '2026-11-01', ids(s)[0], 'main');
  const before = NZ.dayScore(s, '2026-11-01');
  s = NZ.addHabit(s, { name: 'Fifth', main: 'm', min: 'n' }, '2026-11-10');
  const after = NZ.dayScore(s, '2026-11-01');
  assert.deepStrictEqual(after, before); assert.strictEqual(after.total, 4);
  assert.strictEqual(NZ.dayScore(s, '2026-11-10').total, 5);
});
t('13 Archiving preserves history, 14 restoring does not backfill the gap', () => {
  let s = mk(4, '2026-11-01'); const id = ids(s)[3];
  for (let d = 1; d <= 19; d++) s = NZ.setStatus(s, '2026-11-' + String(d).padStart(2, '0'), id, 'main');
  const nov5 = NZ.dayScore(s, '2026-11-05');
  s = NZ.archiveHabit(s, id, '2026-11-20');
  assert.deepStrictEqual(NZ.dayScore(s, '2026-11-05'), nov5);
  assert.strictEqual(NZ.dayScore(s, '2026-11-19').total, 4);
  assert.strictEqual(NZ.dayScore(s, '2026-11-20').total, 3);
  assert.strictEqual(NZ.archivedHabits(s, '2026-11-25').length, 1);
  s = NZ.restoreHabit(s, id, '2026-11-25');
  assert.strictEqual(NZ.dayScore(s, '2026-11-22').total, 3);   /* gap stays un-scored */
  assert.strictEqual(NZ.dayScore(s, '2026-11-25').total, 4);
  assert.strictEqual(NZ.dayScore(s, '2026-11-10').total, 4);
  assert.strictEqual(NZ.habitStreak(s, id, '2026-11-25').current, 0);  /* gap breaks that habit's streak */
});
t('Archive then restore same day keeps streak continuous', () => {
  let s = mk(1, '2026-11-01'); const id = ids(s)[0];
  for (const d of ['2026-11-01', '2026-11-02']) s = NZ.setStatus(s, d, id, 'main');
  s = NZ.archiveHabit(s, id, '2026-11-03'); s = NZ.restoreHabit(s, id, '2026-11-03');
  s = NZ.setStatus(s, '2026-11-03', id, 'main');
  assert.strictEqual(NZ.habitStreak(s, id, '2026-11-03').current, 3);
});
t('15 Editing a past day recalculates scores, streaks, best and averages', () => {
  let s = mk(2, T0); const [a, b] = ids(s);
  for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) { s = NZ.setStatus(s, d, a, 'main'); s = NZ.setStatus(s, d, b, 'main'); }
  const T = '2026-10-03';
  assert.strictEqual(NZ.overallStreak(s, T).best, 3);
  assert.strictEqual(NZ.pct(NZ.periodStats(s, '2026-10-01', '2026-10-03', T).avgPerformance), 100);
  s = NZ.setStatus(s, '2026-10-02', b, 'main');           /* clears b on the 2nd */
  assert.strictEqual(NZ.overallStreak(s, T).best, 1);
  assert.strictEqual(NZ.overallStreak(s, T).current, 1);
  assert.strictEqual(NZ.habitStreak(s, b, T).best, 1);
  assert.strictEqual(NZ.pct(NZ.dayScore(s, '2026-10-02').performance), 50);
  assert.strictEqual(NZ.pct(NZ.periodStats(s, '2026-10-01', '2026-10-03', T).avgPerformance), 83);
});
t('16 Dates follow local midnight, not UTC', () => {
  /* Run under TZ=Pacific/Honolulu: 2026-10-30T05:00Z is Oct 29 19:00 local. */
  const dt = new Date('2026-10-30T05:00:00Z');
  assert.strictEqual(dt.toISOString().slice(0, 10), '2026-10-30');
  assert.strictEqual(NZ.localDateStr(dt), '2026-10-29');
  const dt2 = new Date('2026-10-30T10:00:01Z');  /* just past local midnight? 00:00:01 Oct 30 HST */
  assert.strictEqual(NZ.localDateStr(dt2), '2026-10-30');
});
t('Date math across DST and month/year edges', () => {
  assert.strictEqual(NZ.addDays('2026-03-08', 1), '2026-03-09');
  assert.strictEqual(NZ.addDays('2026-11-01', 1), '2026-11-02');
  assert.strictEqual(NZ.addDays('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(NZ.addDays('2028-03-01', -1), '2028-02-29');
  assert.strictEqual(NZ.dow('2026-10-26'), 0);  /* Monday */
  assert.strictEqual(NZ.dow('2026-10-29'), 3);  /* Thursday */
  assert.strictEqual(NZ.weekStart('2026-11-01'), '2026-10-26');
  assert.strictEqual(NZ.addMonths('2026-12-01', 1), '2027-01-01');
  assert.strictEqual(NZ.addMonths('2026-01-01', -1), '2025-12-01');
});
t('17 Reordering changes the stored order and skips archived habits', () => {
  let s = mk(4, T0); const [a, b, c, d] = ids(s);
  s = NZ.archiveHabit(s, b, '2026-10-05');
  s = NZ.moveHabit(s, c, -1, '2026-10-05');   /* c jumps over archived b, past a */
  assert.deepStrictEqual(NZ.activeToday(s, '2026-10-05').map(h => h.id), [c, a, d]);
  s = NZ.moveHabit(s, c, -1, '2026-10-05');   /* already first: no-op */
  assert.deepStrictEqual(NZ.activeToday(s, '2026-10-05').map(h => h.id), [c, a, d]);
  s = NZ.moveHabit(s, a, 1, '2026-10-05');
  assert.deepStrictEqual(NZ.activeToday(s, '2026-10-05').map(h => h.id), [c, d, a]);
});
t('No active habits: null score, no divide by zero, not a streak day', () => {
  const s = NZ.emptyState();
  assert.strictEqual(NZ.dayScore(s, T0), null);
  assert.deepStrictEqual(NZ.overallStreak(s, T0), { current: 0, best: 0, todayDone: false });
  const p = NZ.periodStats(s, '2026-10-01', '2026-10-31', T0);
  assert.strictEqual(p.avgPerformance, null);
});
t('Averages exclude future and pre-start dates; misses count', () => {
  let s = mk(1, '2026-10-03'); const a = ids(s)[0];
  s = NZ.setStatus(s, '2026-10-03', a, 'main');       /* 100 */
  /* Oct 4 missed -> 0; today Oct 5 min -> 25 */
  s = NZ.setStatus(s, '2026-10-05', a, 'min');
  const p = NZ.periodStats(s, '2026-10-01', '2026-10-31', '2026-10-05');
  assert.strictEqual(p.days, 3); assert.strictEqual(NZ.pct(p.avgPerformance), 42);
});
t('Editing text keeps history linked (stable ids)', () => {
  let s = mk(1, T0); const a = ids(s)[0];
  s = NZ.setStatus(s, T0, a, 'main');
  s = NZ.updateHabit(s, a, { name: 'Renamed', main: 'x', min: 'y', category: 'Fitness' });
  assert.strictEqual(NZ.statusOf(s, T0, a), 'main');
  assert.strictEqual(s.habits[a].name, 'Renamed');
});
t('Edit window: not before start, not future', () => {
  const s = mk(1, '2026-10-05');
  assert(!NZ.canEditDay(s, '2026-10-04', '2026-10-10'));
  assert(NZ.canEditDay(s, '2026-10-05', '2026-10-10'));
  assert(NZ.canEditDay(s, '2026-10-10', '2026-10-10'));
  assert(!NZ.canEditDay(s, '2026-10-11', '2026-10-10'));
});
t('19 Export then import round-trips; bad data is rejected', () => {
  const s = NZ.buildDemo('2026-10-29');
  const r = NZ.parseBackup(NZ.exportString(s));
  assert(r.ok, r.error);
  assert.deepStrictEqual(r.state.checkins, s.checkins);
  assert.deepStrictEqual(r.state.order, s.order);
  assert(!NZ.parseBackup('not json').ok);
  assert(!NZ.parseBackup('{"schemaVersion":99,"habits":{},"order":[],"checkins":{}}').ok);
  const broken = JSON.parse(JSON.stringify(s)); broken.checkins['2026-10-10'] = { ghost: 'main' };
  assert(!NZ.validateState(broken).ok);
  const broken2 = JSON.parse(JSON.stringify(s)); broken2.checkins['2026-10-10'].gym = 'full';
  assert(!NZ.validateState(broken2).ok);
  const broken3 = JSON.parse(JSON.stringify(s)); broken3.habits.gym.main = '';
  assert(!NZ.validateState(broken3).ok);
  const broken4 = JSON.parse(JSON.stringify(s)); broken4.order.pop();
  assert(!NZ.validateState(broken4).ok);
  const broken5 = JSON.parse(JSON.stringify(s)); broken5.startDate = '2026-13-45';
  assert(!NZ.validateState(broken5).ok);
});
t('Demo does not mutate: setStatus returns a new state', () => {
  const s = mk(1, T0); const a = ids(s)[0];
  const s2 = NZ.setStatus(s, T0, a, 'main');
  assert.strictEqual(NZ.statusOf(s, T0, a), null); assert.strictEqual(NZ.statusOf(s2, T0, a), 'main');
});
t('Tier thresholds', () => {
  assert.strictEqual(NZ.tier(100), 'green'); assert.strictEqual(NZ.tier(80), 'green');
  assert.strictEqual(NZ.tier(79.9), 'blue'); assert.strictEqual(NZ.tier(40), 'blue');
  assert.strictEqual(NZ.tier(39.9), 'gray'); assert.strictEqual(NZ.tier(0), 'gray');
});

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

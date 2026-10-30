/* Never Zero: pure logic. No DOM, no React, no storage. Works in browser and node. */
(function (root) {
  'use strict';

  var DAY = 86400000;
  var SCHEMA = 1;

  /* ---------- dates (local calendar days as YYYY-MM-DD) ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function localDateStr(date) {
    var dt = date || new Date();
    return fmt(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }
  function parse(s) {
    var p = s.split('-');
    return { y: +p[0], m: +p[1], d: +p[2] };
  }
  function toNum(s) { var p = parse(s); return Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY); }
  function fromNum(n) {
    var dt = new Date(n * DAY);
    return fmt(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  }
  function addDays(s, n) { return fromNum(toNum(s) + n); }
  function isDateStr(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    var p = parse(s);
    if (p.m < 1 || p.m > 12 || p.d < 1) return false;
    return p.d <= daysInMonth(p.y, p.m);
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  /* Monday = 0 ... Sunday = 6. 1970-01-01 (day 0) was a Thursday. */
  function dow(s) { return (((toNum(s) + 3) % 7) + 7) % 7; }
  function weekStart(s) { return addDays(s, -dow(s)); }
  function monthStart(s) { var p = parse(s); return fmt(p.y, p.m, 1); }
  function monthEnd(s) { var p = parse(s); return fmt(p.y, p.m, daysInMonth(p.y, p.m)); }
  function addMonths(s, k) {
    var p = parse(s); var t = p.y * 12 + (p.m - 1) + k;
    return fmt(Math.floor(t / 12), (t % 12) + 1, 1);
  }
  function range(from, to) {
    var out = [];
    for (var n = toNum(from); n <= toNum(to); n++) out.push(fromNum(n));
    return out;
  }

  /* ---------- state ---------- */
  function emptyState() {
    return {
      schemaVersion: SCHEMA,
      startDate: null,
      habits: {},
      order: [],
      checkins: {},
      customCategories: [],
      celebrated: {}
    };
  }

  function newId(state) {
    var id;
    do {
      id = 'h' + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-3);
    } while (state.habits[id]);
    return id;
  }

  function isActive(h, date) {
    for (var i = 0; i < h.ranges.length; i++) {
      var r = h.ranges[i];
      if (r.from <= date && (r.to == null || date <= r.to)) return true;
    }
    return false;
  }

  /* Habits scored on `date`, in the user's custom order. */
  function activeHabits(state, date) {
    if (!state.startDate || date < state.startDate) return [];
    var out = [];
    for (var i = 0; i < state.order.length; i++) {
      var h = state.habits[state.order[i]];
      if (h && isActive(h, date)) out.push(h);
    }
    return out;
  }

  function statusOf(state, date, id) {
    var c = state.checkins[date];
    return (c && c[id]) || null;
  }

  function dayScore(state, date) {
    var A = activeHabits(state, date);
    if (!A.length) return null;
    var main = 0, min = 0;
    for (var i = 0; i < A.length; i++) {
      var s = statusOf(state, date, A[i].id);
      if (s === 'main') main++; else if (s === 'min') min++;
    }
    var n = A.length;
    return {
      total: n, main: main, min: min, done: main + min,
      performance: (100 * main + 25 * min) / n,
      consistency: ((main + min) / n) * 100,
      success: main + min === n
    };
  }

  /* Tap logic: tapping the selected option clears it, otherwise sets/switches. */
  function setStatus(state, date, id, choice) {
    var cur = statusOf(state, date, id);
    var next = cur === choice ? null : choice;
    var day = Object.assign({}, state.checkins[date] || {});
    if (next) day[id] = next; else delete day[id];
    var checkins = Object.assign({}, state.checkins);
    if (Object.keys(day).length) checkins[date] = day; else delete checkins[date];
    return Object.assign({}, state, { checkins: checkins });
  }

  function canEditDay(state, date, today) {
    return !!state.startDate && date >= state.startDate && date <= today;
  }

  /* ---------- streaks (always derived from history) ---------- */
  function overallSuccess(state, date) {
    var s = dayScore(state, date);
    return !!(s && s.success);
  }
  function habitSuccess(state, id, date) {
    var h = state.habits[id];
    return !!h && !!state.startDate && date >= state.startDate &&
      isActive(h, date) && !!statusOf(state, date, id);
  }
  /* Today is provisional: if today is not yet a success, the current streak is
     counted back from yesterday instead of being treated as broken. */
  function runStats(ok, start, today) {
    if (!start || today < start) return { current: 0, best: 0, todayDone: false };
    var best = 0, run = 0, n;
    for (n = toNum(start); n <= toNum(today); n++) {
      if (ok(fromNum(n))) { run++; if (run > best) best = run; } else run = 0;
    }
    var todayDone = ok(today);
    var d = todayDone ? today : addDays(today, -1);
    var cur = 0;
    while (d >= start && ok(d)) { cur++; d = addDays(d, -1); }
    return { current: cur, best: best, todayDone: todayDone };
  }
  function overallStreak(state, today) {
    return runStats(function (d) { return overallSuccess(state, d); }, state.startDate, today);
  }
  function habitStreak(state, id, today) {
    return runStats(function (d) { return habitSuccess(state, id, d); }, state.startDate, today);
  }

  /* ---------- period stats ---------- */
  function periodStats(state, from, to, today) {
    var lo = state.startDate && from < state.startDate ? state.startDate : from;
    var hi = to > today ? today : to;
    var n = 0, p = 0, c = 0;
    if (state.startDate && lo <= hi) {
      for (var k = toNum(lo); k <= toNum(hi); k++) {
        var s = dayScore(state, fromNum(k));
        if (s) { n++; p += s.performance; c += s.consistency; }
      }
    }
    return { days: n, avgPerformance: n ? p / n : null, avgConsistency: n ? c / n : null };
  }
  function periodSeries(state, from, to, today) {
    return range(from, to).map(function (d) {
      var future = d > today;
      var s = future ? null : dayScore(state, d);
      return { date: d, future: future, score: s, performance: s ? s.performance : null };
    });
  }
  function tier(perf) { return perf >= 80 ? 'green' : perf >= 40 ? 'blue' : 'gray'; }
  function pct(x) { return Math.round(x); }

  /* ---------- habit actions (pure) ---------- */
  function addHabit(state, f, today) {
    var id = newId(state);
    var habits = Object.assign({}, state.habits);
    habits[id] = {
      id: id, name: f.name.trim(), main: f.main.trim(), min: f.min.trim(),
      category: f.category ? f.category.trim() : null,
      ranges: [{ from: today, to: null }]
    };
    var custom = state.customCategories.slice();
    if (f.category && ['Fitness', 'Business', 'Personal', 'Health', 'Learning', 'Other'].indexOf(f.category) < 0 &&
        custom.indexOf(f.category) < 0) custom.push(f.category);
    return Object.assign({}, state, {
      startDate: state.startDate || today,
      habits: habits, order: state.order.concat([id]), customCategories: custom
    });
  }
  function updateHabit(state, id, f) {
    var habits = Object.assign({}, state.habits);
    habits[id] = Object.assign({}, habits[id], {
      name: f.name.trim(), main: f.main.trim(), min: f.min.trim(),
      category: f.category ? f.category.trim() : null
    });
    var custom = state.customCategories.slice();
    if (f.category && ['Fitness', 'Business', 'Personal', 'Health', 'Learning', 'Other'].indexOf(f.category) < 0 &&
        custom.indexOf(f.category) < 0) custom.push(f.category);
    return Object.assign({}, state, { habits: habits, customCategories: custom });
  }
  /* Archive: stop scoring from `today` forward; earlier days keep this habit. */
  function archiveHabit(state, id, today) {
    var h = state.habits[id];
    var ranges = h.ranges.map(function (r) { return Object.assign({}, r); });
    var last = ranges[ranges.length - 1];
    if (last && last.to == null) last.to = addDays(today, -1);
    var habits = Object.assign({}, state.habits);
    habits[id] = Object.assign({}, h, { ranges: ranges });
    return Object.assign({}, state, { habits: habits });
  }
  /* Restore: active again from `today`; archived dates stay un-scored. */
  function restoreHabit(state, id, today) {
    var h = state.habits[id];
    var last = h.ranges[h.ranges.length - 1];
    if (last && last.to == null) return state;
    var habits = Object.assign({}, state.habits);
    habits[id] = Object.assign({}, h, { ranges: h.ranges.concat([{ from: today, to: null }]) });
    return Object.assign({}, state, { habits: habits });
  }
  function moveHabit(state, id, dir, today) {
    var activeIds = state.order.filter(function (x) { return isActive(state.habits[x], today); });
    var i = activeIds.indexOf(id);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= activeIds.length) return state;
    var order = state.order.slice();
    var a = order.indexOf(activeIds[i]), b = order.indexOf(activeIds[j]);
    var t = order[a]; order[a] = order[b]; order[b] = t;
    return Object.assign({}, state, { order: order });
  }
  function activeToday(state, today) {
    return state.order.map(function (id) { return state.habits[id]; })
      .filter(function (h) { return h && isActive(h, today); });
  }
  function archivedHabits(state, today) {
    return state.order.map(function (id) { return state.habits[id]; })
      .filter(function (h) { return h && !isActive(h, today); });
  }
  function markCelebrated(state, date) {
    var c = Object.assign({}, state.celebrated); c[date] = true;
    return Object.assign({}, state, { celebrated: c });
  }

  /* ---------- import validation ---------- */
  function validateState(raw) {
    function bad(m) { return { ok: false, error: m }; }
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return bad('Backup is not a Never Zero data object.');
    if (typeof raw.schemaVersion !== 'number') return bad('Backup has no schema version.');
    if (raw.schemaVersion > SCHEMA) return bad('Backup is from a newer version of Never Zero.');
    if (raw.startDate != null && !isDateStr(raw.startDate)) return bad('Start date is not valid.');
    if (!raw.habits || typeof raw.habits !== 'object' || Array.isArray(raw.habits)) return bad('Habits are missing.');
    var out = emptyState();
    out.startDate = raw.startDate || null;
    var ids = Object.keys(raw.habits);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], h = raw.habits[id];
      if (!h || typeof h !== 'object') return bad('Habit ' + id + ' is not valid.');
      if (h.id !== id) return bad('Habit ' + id + ' has a mismatched id.');
      if (typeof h.name !== 'string' || !h.name.trim()) return bad('A habit has no name.');
      if (typeof h.main !== 'string' || !h.main.trim()) return bad('Habit "' + h.name + '" has no Main description.');
      if (typeof h.min !== 'string' || !h.min.trim()) return bad('Habit "' + h.name + '" has no Minimum description.');
      if (h.category != null && typeof h.category !== 'string') return bad('Habit "' + h.name + '" has a bad category.');
      if (!Array.isArray(h.ranges) || !h.ranges.length) return bad('Habit "' + h.name + '" has no active dates.');
      var ranges = [];
      for (var r = 0; r < h.ranges.length; r++) {
        var rg = h.ranges[r];
        if (!rg || !isDateStr(rg.from) || !(rg.to == null || isDateStr(rg.to))) return bad('Habit "' + h.name + '" has a bad date range.');
        ranges.push({ from: rg.from, to: rg.to == null ? null : rg.to });
      }
      out.habits[id] = { id: id, name: h.name, main: h.main, min: h.min, category: h.category || null, ranges: ranges };
    }
    if (!Array.isArray(raw.order)) return bad('Habit order is missing.');
    var seen = {};
    for (var o = 0; o < raw.order.length; o++) {
      var oid = raw.order[o];
      if (!out.habits[oid]) return bad('Order lists an unknown habit.');
      if (!seen[oid]) { seen[oid] = true; out.order.push(oid); }
    }
    if (out.order.length !== ids.length) return bad('Order does not include every habit.');
    if (!raw.checkins || typeof raw.checkins !== 'object' || Array.isArray(raw.checkins)) return bad('Check-ins are missing.');
    var dates = Object.keys(raw.checkins);
    for (var d = 0; d < dates.length; d++) {
      var date = dates[d];
      if (!isDateStr(date)) return bad('Check-in date "' + date + '" is not valid.');
      var day = raw.checkins[date];
      if (!day || typeof day !== 'object') return bad('Check-ins for ' + date + ' are not valid.');
      var clean = {};
      var hk = Object.keys(day);
      for (var k = 0; k < hk.length; k++) {
        if (!out.habits[hk[k]]) return bad('Check-ins on ' + date + ' refer to an unknown habit.');
        if (day[hk[k]] !== 'main' && day[hk[k]] !== 'min') return bad('Check-in on ' + date + ' has a bad value.');
        clean[hk[k]] = day[hk[k]];
      }
      if (hk.length) out.checkins[date] = clean;
    }
    if (raw.customCategories != null) {
      if (!Array.isArray(raw.customCategories)) return bad('Custom categories are not valid.');
      out.customCategories = raw.customCategories.filter(function (c) { return typeof c === 'string' && c.trim(); }).slice(0, 30);
    }
    if (raw.celebrated && typeof raw.celebrated === 'object' && !Array.isArray(raw.celebrated)) {
      Object.keys(raw.celebrated).forEach(function (dk) { if (isDateStr(dk)) out.celebrated[dk] = true; });
    }
    if (ids.length && !out.startDate) return bad('Habits exist but there is no start date.');
    return { ok: true, state: out };
  }

  function exportString(state) {
    return JSON.stringify({ app: 'never-zero', exportedAt: new Date().toISOString(), data: state }, null, 1);
  }
  function parseBackup(text) {
    var obj;
    if (typeof text !== 'string' || text.length > 5000000) return { ok: false, error: 'That is too large to be a Never Zero backup.' };
    try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: 'That is not valid JSON.' }; }
    if (obj && obj.app === 'never-zero' && obj.data) obj = obj.data;
    return validateState(obj);
  }

  /* ---------- demo data (in memory only, never saved) ---------- */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildDemo(today) {
    var start = addDays(today, -20);
    var defs = [
      ['gym', 'Gym Workout', 'Complete a 60-minute workout', 'Complete 50 push-ups', 'Fitness'],
      ['read', 'Reading', 'Read 20 pages', 'Read 2 pages', 'Personal'],
      ['biz', 'Business Focus', 'Complete 2 hours of focused work', 'Complete 15 minutes of focused work', 'Business'],
      ['nut', 'Nutrition', 'Hit all nutrition goals', 'Hit protein target', 'Health']
    ];
    var st = emptyState();
    st.startDate = start;
    defs.forEach(function (d) {
      st.habits[d[0]] = { id: d[0], name: d[1], main: d[2], min: d[3], category: d[4], ranges: [{ from: start, to: null }] };
      st.order.push(d[0]);
    });
    var rnd = mulberry(20261029);
    for (var i = 0; i < 20; i++) {
      var date = addDays(start, i);
      var forced = (i >= 2 && i <= 11) || i >= 15;
      var day = {};
      st.order.forEach(function (id) {
        var r = rnd();
        var v = r < 0.62 ? 'main' : r < 0.86 ? 'min' : (forced ? 'min' : null);
        if (v) day[id] = v;
      });
      if (i === 13) delete day.nut;
      if (i === 12) delete day.gym;
      if (Object.keys(day).length) st.checkins[date] = day;
    }
    st.checkins[today] = { gym: 'main', read: 'main', biz: 'min' };
    return st;
  }

  var API = {
    SCHEMA: SCHEMA, localDateStr: localDateStr, parse: parse, toNum: toNum, fromNum: fromNum, addDays: addDays,
    isDateStr: isDateStr, dow: dow, weekStart: weekStart, monthStart: monthStart, monthEnd: monthEnd,
    addMonths: addMonths, daysInMonth: daysInMonth, range: range,
    emptyState: emptyState, isActive: isActive, activeHabits: activeHabits, statusOf: statusOf,
    dayScore: dayScore, setStatus: setStatus, canEditDay: canEditDay,
    overallSuccess: overallSuccess, habitSuccess: habitSuccess, runStats: runStats,
    overallStreak: overallStreak, habitStreak: habitStreak,
    periodStats: periodStats, periodSeries: periodSeries, tier: tier, pct: pct,
    addHabit: addHabit, updateHabit: updateHabit, archiveHabit: archiveHabit, restoreHabit: restoreHabit,
    moveHabit: moveHabit, activeToday: activeToday, archivedHabits: archivedHabits, markCelebrated: markCelebrated,
    validateState: validateState, exportString: exportString, parseBackup: parseBackup, buildDemo: buildDemo
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.NZ = API;
})(typeof window !== 'undefined' ? window : this);

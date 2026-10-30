/* Never Zero V1 UI. Uses globals: React, ReactDOM, NZ (logic.js). */
const { useState, useEffect, useRef, useMemo, useCallback } = React;
const APP_VERSION = __VERSION__;

/* ================= icons ================= */
const ICONS = {
  flame: ['M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z'],
  trophy: ['M6 9H4.5a2.5 2.5 0 0 1 0-5H6', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18', 'M4 22h16', 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22', 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22', 'M18 2H6v7a6 6 0 0 0 12 0V2z'],
  check: ['M20 6 9 17l-5-5'],
  today: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'm9 12 2 2 4-4'],
  progress: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'],
  history: ['M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M8 2v4', 'M16 2v4', 'M3 10h18'],
  habits: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  dumbbell: ['M6.5 6.5v11', 'M17.5 6.5v11', 'M3.5 9v6', 'M20.5 9v6', 'M6.5 12h11'],
  book: ['M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'],
  briefcase: ['M4 7h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z', 'M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'],
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z'],
  cap: ['M22 10v6', 'M2 10l10-5 10 5-10 5z', 'M6 12v5c3 3 9 3 12 0v-5'],
  target: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z', 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'],
  plus: ['M12 5v14', 'M5 12h14'],
  up: ['m18 15-6-6-6 6'],
  down: ['m6 9 6 6 6-6'],
  left: ['m15 18-6-6 6-6'],
  right: ['m9 18 6-6-6-6'],
  edit: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z'],
  archive: ['M4 3h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z', 'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8', 'M10 12h4'],
  restore: ['M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'],
  x: ['M18 6 6 18', 'M6 6l12 12']
};
function Icon({ name, size = 20, stroke = 2 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name].map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
const CAT_ICON = { Fitness: 'dumbbell', Business: 'briefcase', Personal: 'book', Health: 'heart', Learning: 'cap' };
const BASE_CATS = ['Fitness', 'Business', 'Personal', 'Health', 'Learning', 'Other'];
const catIcon = (c) => CAT_ICON[c] || 'target';

/* ================= formatting ================= */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
function dt(s) { const p = NZ.parse(s); return new Date(p.y, p.m - 1, p.d, 12); }
function fmtShort(s) { const d = dt(s); return WDAYS[d.getDay()].slice(0, 3) + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
function fmtLong(s) { const d = dt(s); return WDAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate(); }
function fmtMD(s) { const d = dt(s); return MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }
function fmtMonth(s) { const p = NZ.parse(s); return MONTHS[p.m - 1] + ' ' + p.y; }

/* ================= storage ================= */
function makeAdapter(kind, impl) { return Object.assign({ kind: kind }, impl); }
async function openStore() {
  try {
    if (window.claude && window.claude.use) {
      const dbNs = await window.claude.use('db');
      const userNs = await window.claude.use('user');
      const uid = dbNs && userNs ? await userNs.id() : null;
      if (dbNs && uid) {
        /* Private per-viewer path: nobody else, the owner included, can read it. */
        const ref = dbNs.doc('data/users/' + uid + '/nzstate');
        return makeAdapter('cloud', {
          load: async () => { const snap = await ref.get(); return snap.exists ? snap.data() : null; },
          save: async (obj) => { await ref.set(obj); }
        });
      }
    }
  } catch (e) { /* fall through */ }
  try {
    if (window.indexedDB) {
      const idb = await idbOpen();
      await idbReq(idb, 'readwrite', (st) => st.put(1, 'probe'));
      return makeAdapter('local', {
        load: async () => { const v = await idbReq(idb, 'readonly', (st) => st.get('state')); return v == null ? null : v; },
        save: async (obj) => { await idbReq(idb, 'readwrite', (st) => st.put(obj, 'state')); }
      });
    }
  } catch (e) { /* fall through */ }
  try {
    const k = 'neverzero.v1';
    localStorage.setItem('nz_probe', '1'); localStorage.removeItem('nz_probe');
    return makeAdapter('local', {
      load: async () => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
      save: async (obj) => { localStorage.setItem(k, JSON.stringify(obj)); }
    });
  } catch (e) { /* fall through */ }
  let mem = null;
  return makeAdapter('memory', { load: async () => mem, save: async (o) => { mem = o; } });
}
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('neverzero', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('kv'); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('blocked'));
  });
}
function idbReq(db, mode, fn) {
  return new Promise((res, rej) => {
    const tx = db.transaction('kv', mode); const out = fn(tx.objectStore('kv'));
    tx.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('aborted'));
  });
}
function packState(state) { return { schemaVersion: NZ.SCHEMA, savedAt: new Date().toISOString(), payload: JSON.stringify(state) }; }
function unpackState(raw) {
  try {
    const obj = JSON.parse(raw.payload);
    return NZ.validateState(obj);
  } catch (e) { return { ok: false, error: 'Saved data could not be read.' }; }
}

const Saver = {
  store: null, pending: null, busy: false, timer: null, failed: false, onStatus: function () {},
  queue(state) {
    this.pending = state; this.failed = false;
    clearTimeout(this.timer); this.onStatus('saving');
    this.timer = setTimeout(() => this.flush(), 120);
  },
  async flush() {
    if (this.busy || !this.store) return;
    clearTimeout(this.timer);
    this.busy = true;
    try {
      while (this.pending) {
        const snap = this.pending; this.pending = null;
        try { await this.store.save(packState(snap)); }
        catch (e) { if (!this.pending) this.pending = snap; throw e; }
      }
      this.onStatus('saved');
    } catch (e) {
      this.failed = true; this.onStatus('error');
      this.timer = setTimeout(() => this.flush(), 4000);
    } finally { this.busy = false; }
  }
};

/* ================= small components ================= */
const MARK = { w: 1007, h: 445, d: "M1006 444 L942 376 L818 251 L769 266 L626 97 L540 0 L276 227 L208 212 L0 409 L201 267 L202 270 L143 420 L397 183 L396 192 L337 352 L528 58 L581 189 L629 317 L653 245 L732 332 L798 309Z" };
function Logo({ size = 30 }) {
  /* size = mark width in px; height follows the mountain's proportions */
  return (
    <svg className="mark" width={size} height={Math.round(size * MARK.h / MARK.w)} viewBox={'0 0 ' + MARK.w + ' ' + MARK.h}
      aria-hidden="true" focusable="false">
      <path d={MARK.d} fill="#A3FF36" fillRule="evenodd" />
    </svg>
  );
}
function Ring({ pct, color, size = 48, stroke = 5 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.max(0, Math.min(100, pct));
  return (
    <svg width={size} height={size} viewBox={'0 0 ' + size + ' ' + size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--elev)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={(c * v / 100) + ' ' + c} transform={'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')'}
        style={{ transition: 'stroke-dasharray .45s ease' }} />
    </svg>
  );
}

function HabitCard({ habit, status, streak, onPick }) {
  const tone = status === 'main' ? 'main' : status === 'min' ? 'min' : 'none';
  return (
    <section className={'hc ' + tone} aria-label={habit.name}>
      <div className="hc-top">
        <div className={'hc-ico ' + tone}><Icon name={catIcon(habit.category)} size={20} /></div>
        <div className="hc-name">{habit.name}</div>
        {streak > 0 && <div className="hc-streak" title="Current habit streak"><Icon name="flame" size={14} />{streak}</div>}
      </div>
      <div className="hc-btns">
        <button type="button" className={'opt main' + (status === 'main' ? ' on' : '')} aria-pressed={status === 'main'}
          aria-label={'Main, 100 percent: ' + habit.main} onClick={() => onPick(habit.id, 'main')}>
          <span className="rd">{status === 'main' && <Icon name="check" size={14} stroke={3.5} />}</span>
          <span className="tx"><span className="t">Main</span><span className="d">{habit.main}</span></span>
          <span className="pc">100%</span>
        </button>
        <button type="button" className={'opt min' + (status === 'min' ? ' on' : '')} aria-pressed={status === 'min'}
          aria-label={'Minimum, 25 percent: ' + habit.min} onClick={() => onPick(habit.id, 'min')}>
          <span className="rd">{status === 'min' && <Icon name="check" size={14} stroke={3.5} />}</span>
          <span className="tx"><span className="t">Minimum</span><span className="d">{habit.min}</span></span>
          <span className="pc">25%</span>
        </button>
      </div>
    </section>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const f = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f);
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-h"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><Icon name="x" /></button></div>
        {children}
      </div>
    </div>
  );
}

function Confirm({ c, onClose }) {
  return (
    <Modal title={c.title} onClose={onClose}>
      <p className="muted">{c.body}</p>
      <div className="row-btns">
        <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
        <button type="button" className={'btn ' + (c.danger ? 'danger' : 'lime')} onClick={() => { onClose(); c.onConfirm(); }}>{c.confirmLabel}</button>
      </div>
    </Modal>
  );
}

function DisplayInfo({ onClose }) {
  const probe = useRef(null);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const measure = () => {
    const p = probe.current; if (!p) return;
    const q = (c) => p.querySelector('.' + c);
    const vv = window.visualViewport;
    const rect = (e) => (e ? Math.round(e.getBoundingClientRect().top) + ' to ' + Math.round(e.getBoundingClientRect().bottom) : 'n/a');
    const dm = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    setRows([
      ['Window', window.innerWidth + ' x ' + window.innerHeight],
      ['Visual viewport', vv ? Math.round(vv.width) + ' x ' + Math.round(vv.height) + ' (offset ' + Math.round(vv.offsetTop) + ')' : 'n/a'],
      ['Screen', window.screen.width + ' x ' + window.screen.height + ' (avail ' + window.screen.availHeight + ')'],
      ['Document', document.documentElement.clientWidth + ' x ' + document.documentElement.clientHeight],
      ['Body height', Math.round(document.body.getBoundingClientRect().height)],
      ['Pixel ratio', window.devicePixelRatio],
      ['Home Screen mode', String(window.navigator.standalone === true) + ' / ' + String(dm)],
      ['Safe area T R B L', [q('sa-t').offsetHeight, q('sa-r').offsetWidth, q('sa-b').offsetHeight, q('sa-l').offsetWidth].join(' / ')],
      ['100vh / dvh / svh / lvh', [q('u-vh').offsetHeight, q('u-dvh').offsetHeight, q('u-svh').offsetHeight, q('u-lvh').offsetHeight].join(' / ')],
      ['App top to bottom', rect(document.querySelector('.app'))],
      ['Tab bar top to bottom', rect(document.querySelector('.nav'))],
      ['Build', APP_VERSION]
    ]);
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const text = rows.map((r) => r[0] + ': ' + r[1]).join('\n');
  const copy = async () => { try { await navigator.clipboard.writeText(text); setMsg('Copied.'); } catch (e) { setMsg('Copy is blocked here. Send a screenshot instead.'); } };
  return (
    <Modal title="Display info" onClose={onClose}>
      <p className="muted s">These numbers show how your phone sizes the app. A screenshot of this is enough.</p>
      <dl className="diag">{rows.map((r) => [<dt key={r[0] + 't'}>{r[0]}</dt>, <dd key={r[0] + 'd'}>{String(r[1])}</dd>])}</dl>
      <div className="row-btns"><button type="button" className="btn ghost" onClick={copy}>Copy</button><button type="button" className="btn lime" onClick={onClose}>Done</button></div>
      {msg && <p className="s" role="status">{msg}</p>}
      <div ref={probe} aria-hidden="true" className="probe">
        <div className="sa-t" style={{ paddingTop: 'env(safe-area-inset-top)' }} /><div className="sa-r" style={{ paddingRight: 'env(safe-area-inset-right)' }} />
        <div className="sa-b" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} /><div className="sa-l" style={{ paddingLeft: 'env(safe-area-inset-left)' }} />
        <div className="u-vh" style={{ height: '100vh' }} /><div className="u-dvh" style={{ height: '100dvh' }} />
        <div className="u-svh" style={{ height: '100svh' }} /><div className="u-lvh" style={{ height: '100lvh' }} />
      </div>
    </Modal>
  );
}

function HabitForm({ S, edit, onSave, onClose }) {
  const h0 = edit || { name: '', main: '', min: '', category: null };
  const [f, setF] = useState({ name: h0.name, main: h0.main, min: h0.min, category: h0.category || '' });
  const [tried, setTried] = useState(false);
  const cats = BASE_CATS.concat(S.customCategories);
  const err = {
    name: !f.name.trim() ? 'Give the habit a name.' : '',
    main: !f.main.trim() ? 'Describe the full goal.' : '',
    min: !f.min.trim() ? 'Describe the smaller fallback goal.' : ''
  };
  const bad = err.name || err.main || err.min;
  const submit = (e) => { e.preventDefault(); setTried(true); if (bad) return; onSave({ name: f.name, main: f.main, min: f.min, category: f.category || null }); };
  const set = (k) => (e) => setF(Object.assign({}, f, { [k]: e.target.value }));
  return (
    <Modal title={edit ? 'Edit habit' : 'New habit'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <label className="fld" htmlFor="f-name">Habit name</label>
        <input id="f-name" className="inp" value={f.name} onChange={set('name')} maxLength={40} placeholder="e.g. Gym Workout" autoComplete="off" />
        {tried && err.name && <div className="err">{err.name}</div>}
        <label className="fld" htmlFor="f-main">Main habit <span className="tag lime">100%</span></label>
        <input id="f-main" className="inp" value={f.main} onChange={set('main')} maxLength={90} placeholder="e.g. Complete a 60-minute workout" autoComplete="off" />
        {tried && err.main && <div className="err">{err.main}</div>}
        <label className="fld" htmlFor="f-min">Minimum Mode <span className="tag blue">25%</span></label>
        <input id="f-min" className="inp" value={f.min} onChange={set('min')} maxLength={90} placeholder="e.g. Complete 50 push-ups" autoComplete="off" />
        {tried && err.min && <div className="err">{err.min}</div>}
        <div className="fld">Category <span className="muted s">optional</span></div>
        <div className="chips">
          {cats.map((c) => (
            <button type="button" key={c} className={'chip' + (f.category === c ? ' on' : '')} aria-pressed={f.category === c}
              onClick={() => setF(Object.assign({}, f, { category: f.category === c ? '' : c }))}>{c}</button>
          ))}
        </div>
        <label className="fld" htmlFor="f-cat">Or type a custom category</label>
        <input id="f-cat" className="inp" value={cats.indexOf(f.category) >= 0 ? '' : f.category} maxLength={20}
          onChange={set('category')} placeholder="Custom category" autoComplete="off" />
        <div className="row-btns">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn lime">{edit ? 'Save changes' : 'Create habit'}</button>
        </div>
      </form>
    </Modal>
  );
}

function MinCheck({ habit, status, onMain, onMin, onClose }) {
  return (
    <Modal title="Taking the easy way out?" onClose={onClose}>
      <p className="muted">Minimum keeps your streak alive for 25% credit. Be honest: is this all you have today, or can you go for the full Main?</p>
      <div className="mc-goal"><span className="tag lime">Main</span><span>{habit.main}</span></div>
      <div className="row-btns col">
        <button type="button" className="btn lime" onClick={onMain}>{status === 'main' ? 'Keep Main — 100%' : 'Go for Main — 100%'}</button>
        <button type="button" className="btn blue" onClick={onMin}>Minimum — keep my streak</button>
      </div>
    </Modal>
  );
}

function InstallTip() {
  const [hide, setHide] = useState(() => { try { return localStorage.getItem('nz_tip') === '1'; } catch (e) { return false; } });
  const standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!__PWA__ || standalone || hide || !ios) return null;
  return (
    <div className="card tip">
      <div><b>Put Never Zero on your Home Screen</b>
        <p className="muted s">In Safari, tap the Share button, then Add to Home Screen. It opens full screen like any app.</p></div>
      <button type="button" className="icon-btn" aria-label="Dismiss tip" onClick={() => { try { localStorage.setItem('nz_tip', '1'); } catch (e) { /* none */ } setHide(true); }}><Icon name="x" /></button>
    </div>
  );
}

/* ================= screens ================= */
function ScreenHeader({ right, children }) {
  return <header className="hdr"><div className="brand">{children}</div><div className="hdr-r">{right}</div></header>;
}

function Today({ S, today, pick, goHabits, statusChip }) {
  const A = NZ.activeHabits(S, today);
  const sc = NZ.dayScore(S, today);
  const streak = useMemo(() => NZ.overallStreak(S, today), [S, today]);
  const hs = useMemo(() => { const m = {}; A.forEach((x) => { m[x.id] = NZ.habitStreak(S, x.id, today).current; }); return m; }, [S, today]);
  const perf = sc ? NZ.pct(sc.performance) : 0, cons = sc ? NZ.pct(sc.consistency) : 0;
  const perfect = sc && sc.performance >= 100;
  return (
    <div className="screen-in">
      <ScreenHeader right={<><div className="date">{fmtShort(today)}</div>{statusChip}</>}>
        <h1 className="logo"><Logo size={44} />NEVER <span>ZERO</span></h1>
      </ScreenHeader>
      {!A.length ? (
        <div className="empty">
          <div className="empty-t">No active habits</div>
          <p className="muted">Add a new habit or restore an archived one to start today's checklist.</p>
          <button type="button" className="btn lime" onClick={goHabits}>Manage habits</button>
        </div>
      ) : (
        <>
          <div className="scores">
            <div className={'card score' + (perfect ? ' perfect' : '')}>
              <div className="score-t"><div className="lbl">Performance</div><div className="big lime">{perf}<small>%</small></div>
                <div className="sub">{perfect ? 'Perfect day' : sc.main + ' main · ' + sc.min + ' min'}</div></div>
              <Ring pct={sc.performance} color="var(--lime)" />
            </div>
            <div className="card score">
              <div className="score-t"><div className="lbl">Consistency</div><div className="big blue">{cons}<small>%</small></div>
                <div className="sub">{sc.done}/{sc.total} habits</div></div>
              <Ring pct={sc.consistency} color="var(--blue)" />
            </div>
          </div>
          <div className="card streakbar">
            <div className="st"><span className="fl"><Icon name="flame" size={22} /></span>
              <div><div className="lbl">Current streak</div>
                <div className="stv"><b>{streak.current}</b> day{streak.current === 1 ? '' : 's'}
                  {!streak.todayDone && streak.current > 0 && <em> · today pending</em>}</div></div></div>
            <div className="vr" />
            <div className="st"><span className="fl"><Icon name="trophy" size={22} /></span>
              <div><div className="lbl">Personal best</div>
                <div className="stv"><b>{streak.best}</b> day{streak.best === 1 ? '' : 's'}</div></div></div>
          </div>
          <div className="sec-h"><h2>Today's Habits</h2><span className="muted">{sc.done}/{sc.total} done</span></div>
          <div className="stack">
            {A.map((hb) => (
              <HabitCard key={hb.id} habit={hb} status={NZ.statusOf(S, today, hb.id)} streak={hs[hb.id]}
                onPick={(id, ch) => pick(today, id, ch)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Progress({ S, today, mode, setMode, anchor, setAnchor, statusChip }) {
  const from = mode === 'week' ? NZ.weekStart(anchor) : NZ.monthStart(anchor);
  const to = mode === 'week' ? NZ.addDays(from, 6) : NZ.monthEnd(anchor);
  const stats = NZ.periodStats(S, from, to, today);
  const series = NZ.periodSeries(S, from, to, today);
  const label = mode === 'week'
    ? fmtMD(from) + ' – ' + fmtMD(to) + ', ' + NZ.parse(to).y
    : fmtMonth(from);
  const canPrev = !!S.startDate && from > S.startDate;
  const canNext = to < today;
  const step = (k) => setAnchor(mode === 'week' ? NZ.addDays(from, 7 * k) : NZ.addMonths(from, k));
  const active = NZ.activeToday(S, today);
  const streaks = useMemo(() => active.map((x) => ({ h: x, s: NZ.habitStreak(S, x.id, today) })), [S, today]);
  const color = { green: 'var(--lime)', blue: 'var(--blue)', gray: 'var(--gray)' };
  const compact = mode === 'month';
  return (
    <div className="screen-in">
      <ScreenHeader right={statusChip}><h1 className="ttl">Progress</h1></ScreenHeader>
      <div className="seg" role="tablist" aria-label="Period">
        {['week', 'month'].map((m) => (
          <button type="button" key={m} role="tab" aria-selected={mode === m} className={mode === m ? 'on' : ''}
            onClick={() => { setMode(m); setAnchor(today); }}>{m === 'week' ? 'Week' : 'Month'}</button>
        ))}
      </div>
      <div className="pnav">
        <button type="button" className="icon-btn" onClick={() => step(-1)} disabled={!canPrev} aria-label="Previous period"><Icon name="left" /></button>
        <div className="plabel">{label}</div>
        <button type="button" className="icon-btn" onClick={() => step(1)} disabled={!canNext} aria-label="Next period"><Icon name="right" /></button>
      </div>
      <div className="scores">
        <div className="card avg"><div className="lbl">Avg performance</div>
          <div className="big lime">{stats.days ? NZ.pct(stats.avgPerformance) : '–'}<small>{stats.days ? '%' : ''}</small></div></div>
        <div className="card avg"><div className="lbl">Avg consistency</div>
          <div className="big blue">{stats.days ? NZ.pct(stats.avgConsistency) : '–'}<small>{stats.days ? '%' : ''}</small></div></div>
      </div>
      <div className="card chart">
        <div className="chart-h"><span className="lbl">Daily performance</span>
          <span className="muted s">{stats.days ? stats.days + ' tracked day' + (stats.days === 1 ? '' : 's') : 'No tracked days yet'}</span></div>
        <div className="plot" role="img" aria-label={'Daily performance bars for ' + label}>
          <div className="grid g100"><span>100</span></div><div className="grid g50"><span>50</span></div><div className="grid g0"><span>0</span></div>
          <div className={'bars' + (compact ? ' tight' : '')}>
            {series.map((p, i) => {
              const has = p.performance != null;
              const t = has ? NZ.tier(p.performance) : null;
              const dayN = NZ.parse(p.date).d;
              const showLbl = !compact || dayN === 1 || dayN % 7 === 1;
              return (
                <div className="col" key={p.date}>
                  <div className="bw">
                    {has && !compact && <div className="bv">{NZ.pct(p.performance)}</div>}
                    <div className={'bar' + (has ? '' : ' stub') + (p.date === today ? ' today' : '')}
                      style={has ? { height: Math.max(p.performance, 2.5) + '%', background: color[t] } : undefined} />
                  </div>
                  <div className="bl">{showLbl ? (compact ? dayN : 'MTWTFSS'[i] ) : ''}{!compact && <i>{dayN}</i>}</div>
                </div>
              );
            })}
          </div>
        </div>
        {!stats.days && <p className="muted s center">Days before you started, and future days, are not scored.</p>}
      </div>
      <div className="sec-h"><h2>Habit streaks</h2></div>
      {!streaks.length ? <p className="muted">No active habits.</p> : (
        <div className="card list">
          {streaks.map(({ h, s }) => (
            <div className="srow" key={h.id}>
              <div className="srow-n"><Icon name={catIcon(h.category)} size={18} /><span>{h.name}</span></div>
              <div className="srow-v"><span className="o"><Icon name="flame" size={15} /><b>{s.current}</b></span>
                <span className="o t"><Icon name="trophy" size={15} /><b>{s.best}</b></span></div>
            </div>
          ))}
        </div>
      )}
      <p className="muted s">Flame is the current streak, trophy is the personal best.</p>
    </div>
  );
}

function History({ S, today, sel, setSel, month, setMonth, pick, statusChip }) {
  const first = NZ.monthStart(month), last = NZ.monthEnd(month);
  const lead = NZ.dow(first);
  const days = NZ.range(first, last);
  const canPrev = !!S.startDate && first > NZ.monthStart(S.startDate);
  const canNext = last < today;
  const sc = NZ.dayScore(S, sel);
  const A = NZ.activeHabits(S, sel);
  const future = sel > today;
  const editable = NZ.canEditDay(S, sel, today);
  return (
    <div className="screen-in">
      <ScreenHeader right={statusChip}><h1 className="ttl">History</h1></ScreenHeader>
      <div className="pnav">
        <button type="button" className="icon-btn" onClick={() => setMonth(NZ.addMonths(first, -1))} disabled={!canPrev} aria-label="Previous month"><Icon name="left" /></button>
        <div className="plabel">{fmtMonth(first)}</div>
        <button type="button" className="icon-btn" onClick={() => setMonth(NZ.addMonths(first, 1))} disabled={!canNext} aria-label="Next month"><Icon name="right" /></button>
      </div>
      <div className="card cal">
        <div className="cal-w">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="cal-g">
          {Array.from({ length: lead }).map((_, i) => <span key={'b' + i} />)}
          {days.map((d) => {
            const isFuture = d > today;
            const s = isFuture ? null : NZ.dayScore(S, d);
            const t = s ? NZ.tier(s.performance) : 'none';
            return (
              <button type="button" key={d} className={'cell ' + t + (d === sel ? ' sel' : '') + (d === today ? ' today' : '')}
                aria-pressed={d === sel} aria-label={fmtLong(d) + (s ? ', performance ' + NZ.pct(s.performance) + ' percent' : '')}
                onClick={() => setSel(d)}>
                <span>{NZ.parse(d).d}</span>
              </button>
            );
          })}
        </div>
        <div className="legend"><span><i className="lg green" />80%+</span><span><i className="lg blue" />40–79%</span><span><i className="lg gray" />Under 40%</span></div>
      </div>
      <div className="sec-h"><h2>{fmtLong(sel)}</h2><span className="muted">{sel === today ? 'Today' : future ? 'Upcoming' : ''}</span></div>
      {future ? <div className="empty"><p className="muted">This day has not happened yet.</p></div>
        : !A.length ? <div className="empty"><p className="muted">{S.startDate && sel < S.startDate ? 'Tracking started on ' + fmtLong(S.startDate) + '.' : 'No habits were active on this day.'}</p></div>
          : (
            <>
              <div className="scores">
                <div className="card avg"><div className="lbl">Performance</div><div className="big lime">{NZ.pct(sc.performance)}<small>%</small></div></div>
                <div className="card avg"><div className="lbl">Consistency</div><div className="big blue">{NZ.pct(sc.consistency)}<small>%</small></div><div className="sub">{sc.done}/{sc.total} habits</div></div>
              </div>
              {sel < today && <p className="muted s">Editing a past day updates its scores, your streaks and your averages.</p>}
              <div className="stack">
                {A.map((hb) => (
                  <HabitCard key={hb.id} habit={hb} status={NZ.statusOf(S, sel, hb.id)}
                    onPick={(id, ch) => editable && pick(sel, id, ch)} />
                ))}
              </div>
            </>
          )}
    </div>
  );
}

function Habits({ S, today, demo, ui, statusChip, storeKind, saveStatus }) {
  const A = NZ.activeToday(S, today);
  const arch = NZ.archivedHabits(S, today);
  const [showArch, setShowArch] = useState(false);
  return (
    <div className="screen-in">
      <ScreenHeader right={statusChip}><h1 className="ttl">Habits</h1></ScreenHeader>
      <InstallTip />
      <button type="button" className="btn lime wide" onClick={ui.newHabit}><Icon name="plus" size={18} stroke={3} />New habit</button>
      <div className="sec-h"><h2>Active</h2><span className="muted">{A.length}</span></div>
      {!A.length ? <div className="empty"><p className="muted">No active habits. Create one above or restore an archived habit.</p></div> : (
        <div className="stack">
          {A.map((hb, i) => (
            <div className="card hrow" key={hb.id}>
              <div className="hrow-top">
                <div className="hc-ico none"><Icon name={catIcon(hb.category)} size={19} /></div>
                <div className="hrow-n"><div className="hc-name">{hb.name}</div>{hb.category && <span className="catchip">{hb.category}</span>}</div>
                <div className="mv">
                  <button type="button" className="icon-btn" disabled={i === 0} onClick={() => ui.move(hb.id, -1)} aria-label={'Move ' + hb.name + ' up'}><Icon name="up" /></button>
                  <button type="button" className="icon-btn" disabled={i === A.length - 1} onClick={() => ui.move(hb.id, 1)} aria-label={'Move ' + hb.name + ' down'}><Icon name="down" /></button>
                </div>
              </div>
              <div className="dl"><span className="tag lime">Main</span><span>{hb.main}</span></div>
              <div className="dl"><span className="tag blue">Min</span><span>{hb.min}</span></div>
              <div className="row-btns tight">
                <button type="button" className="btn ghost sm" onClick={() => ui.edit(hb.id)}><Icon name="edit" size={16} />Edit</button>
                <button type="button" className="btn ghost sm" onClick={() => ui.archive(hb)}><Icon name="archive" size={16} />Archive</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="fold" onClick={() => setShowArch(!showArch)} aria-expanded={showArch}>
        <span>Archived ({arch.length})</span><Icon name={showArch ? 'up' : 'down'} size={18} />
      </button>
      {showArch && (arch.length ? (
        <div className="stack">
          {arch.map((hb) => (
            <div className="card hrow arch" key={hb.id}>
              <div className="hrow-top">
                <div className="hc-ico none"><Icon name={catIcon(hb.category)} size={19} /></div>
                <div className="hrow-n"><div className="hc-name">{hb.name}</div>{hb.category && <span className="catchip">{hb.category}</span>}</div>
                <button type="button" className="btn lime sm" onClick={() => ui.restore(hb.id)}><Icon name="restore" size={16} />Restore</button>
              </div>
              <p className="muted s">History is kept. Restoring makes it active from today forward.</p>
            </div>
          ))}
        </div>
      ) : <p className="muted s">Nothing archived.</p>)}
      {!demo && (
        <>
          <div className="sec-h"><h2>Your data</h2></div>
          <div className="card datac">
            <p className="s">{storeKind === 'cloud' ? 'Saved to your private Claude storage. Only you can read it.'
              : storeKind === 'local' ? (__PWA__ ? 'Saved on this phone, inside the app. It stays after you close the app, but deleting the app or clearing Safari website data erases it. Back up now and then.' : 'Saved in this browser only. It can be cleared by the browser and does not follow you to other devices.')
                : 'Not saved. Nothing survives closing this page.'}</p>
            <p className="muted s">Status: {saveStatus === 'saving' ? 'saving…' : saveStatus === 'error' ? 'last save failed, retrying' : saveStatus === 'saved' ? 'last save confirmed' : 'no changes yet'}</p>
            <div className="row-btns tight">
              <button type="button" className="btn ghost sm" onClick={ui.exportData}>Back up (JSON)</button>
              <button type="button" className="btn ghost sm" onClick={ui.importData}>Restore backup</button>
            </div>
            <div className="row-btns tight">
              <button type="button" className="btn ghost sm" onClick={ui.startDemo}>View demo mode</button>
              <button type="button" className="btn danger-o sm" onClick={ui.reset}>Reset all data</button>
            </div>
          </div>
        </>
      )}
      <button type="button" className="linkish s ver" onClick={ui.displayInfo}>Never Zero v{APP_VERSION} · display info</button>
    </div>
  );
}

function Welcome({ onCreate, onDemo, onRestore, storeKind }) {
  return (
    <div className="welcome">
      <h1 className="logo xl"><Logo size={132} />NEVER <span>ZERO</span></h1>
      <div className="wl-sub">Show up daily.</div>
      <p className="wl-p">Complete your Main Habit for full credit or Minimum Mode for 25% credit. Both keep your streak alive.</p>
      <div className="wl-demo">
        <div className="wl-row"><span className="tag lime">Main</span><b>100%</b><span className="muted">full goal</span></div>
        <div className="wl-row"><span className="tag blue">Minimum</span><b>25%</b><span className="muted">smaller fallback</span></div>
        <div className="wl-row"><span className="tag gray">Missed</span><b>0%</b><span className="muted">streak resets</span></div>
      </div>
      <button type="button" className="btn lime wide big" onClick={onCreate}>CREATE YOUR FIRST HABIT</button>
      <button type="button" className="btn ghost wide" onClick={onDemo}>Try demo mode (sample data)</button>
      <button type="button" className="btn ghost wide" onClick={onRestore}>Restore from a backup</button>
      <InstallTip />
      {storeKind === 'memory' && <p className="muted s center">Preview only: nothing is saved when you close this page.</p>}
      <p className="wl-tag">Progress over perfection. Consistency over excuses.<br /><b>Win the day.</b></p>
    </div>
  );
}

function ExportModal({ S, onClose, canDownload }) {
  const text = useMemo(() => NZ.exportString(S), [S]);
  const [msg, setMsg] = useState('');
  const ta = useRef(null);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setMsg('Copied. Paste it into Notes or a file to keep it.'); }
    catch (e) { if (ta.current) { ta.current.focus(); ta.current.select(); } setMsg('Copy is blocked here. The text is selected: use Copy from the iPhone menu.'); }
  };
  const download = async () => {
    const name = 'never-zero-backup-' + NZ.localDateStr() + '.json';
    if (__PWA__) {
      try {
        const file = new File([text], name, { type: 'application/json' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Never Zero backup' }); setMsg('Backup shared.'); return; }
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000); setMsg('Backup downloaded.');
      } catch (e) { setMsg(e && e.name === 'AbortError' ? 'Cancelled.' : 'Could not save a file. Use Copy instead.'); }
      return;
    }
    try {
      const d = await window.claude.use('downloads');
      if (!d) { setMsg('Downloads are not available here. Use Copy instead.'); return; }
      await d.save({ filename: 'never-zero-backup-' + NZ.localDateStr() + '.json', data: text });
      setMsg('Backup saved.');
    } catch (e) { setMsg(e && e.code === 'declined' ? 'Download cancelled.' : 'Download failed. Use Copy instead.'); }
  };
  return (
    <Modal title="Back up your data" onClose={onClose}>
      <p className="muted s">This file holds every habit and check-in. Keep a copy somewhere safe.</p>
      <textarea ref={ta} className="inp mono" readOnly value={text} rows={7} aria-label="Backup JSON" onFocus={(e) => e.target.select()} />
      <div className="row-btns">
        <button type="button" className="btn lime" onClick={copy}>Copy</button>
        {canDownload && <button type="button" className="btn ghost" onClick={download}>{__PWA__ ? 'Save file' : 'Download file'}</button>}
      </div>
      {msg && <p className="s" role="status">{msg}</p>}
    </Modal>
  );
}

function ImportModal({ S, onClose, onReplace }) {
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const check = () => setRes(NZ.parseBackup(text));
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { setText(String(r.result || '')); setRes(null); }; r.readAsText(f);
  };
  const cnt = (st) => Object.keys(st.habits).length + ' habits, ' + Object.keys(st.checkins).length + ' days of check-ins';
  return (
    <Modal title="Restore a backup" onClose={onClose}>
      <p className="muted s">Paste a Never Zero backup or choose the file. Nothing changes until you confirm.</p>
      <textarea className="inp mono" rows={6} value={text} placeholder="Paste backup JSON here" aria-label="Backup JSON to import"
        onChange={(e) => { setText(e.target.value); setRes(null); }} />
      <input type="file" accept=".json,application/json,text/plain" onChange={onFile} className="file" aria-label="Choose backup file" />
      <div className="row-btns"><button type="button" className="btn ghost" onClick={check} disabled={!text.trim()}>Check backup</button></div>
      {res && !res.ok && <div className="err" role="alert">{res.error}</div>}
      {res && res.ok && (
        <div className="warn" role="status">
          <b>Valid backup: {cnt(res.state)}.</b>
          <p className="s">This replaces your current data ({cnt(S)}). Back up first if you are unsure.</p>
          <div className="row-btns"><button type="button" className="btn danger" onClick={() => onReplace(res.state)}>Replace my data</button></div>
        </div>
      )}
    </Modal>
  );
}

/* ================= app ================= */
function App() {
  const [boot, setBoot] = useState({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [real, setReal] = useState(NZ.emptyState());
  const realRef = useRef(real);
  const [demoS, setDemoS] = useState(null);
  const demoRef = useRef(null);
  const [demo, setDemo] = useState(false);
  const [storeKind, setStoreKind] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [today, setToday] = useState(NZ.localDateStr());
  const [tab, setTab] = useState('today');
  const [sel, setSel] = useState(NZ.localDateStr());
  const [month, setMonth] = useState(NZ.monthStart(NZ.localDateStr()));
  const [pMode, setPMode] = useState('week');
  const [pAnchor, setPAnchor] = useState(NZ.localDateStr());
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [canDownload, setCanDownload] = useState(__PWA__);
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => { const f = () => setUpdateReady(true); window.addEventListener('nz-update', f); return () => window.removeEventListener('nz-update', f); }, []);
  const scrollRef = useRef(null);

  const S = demo ? demoS : real;

  /* day rollover: local midnight */
  useEffect(() => {
    const f = () => setToday((t) => { const n = NZ.localDateStr(); return n === t ? t : n; });
    const i = setInterval(f, 15000);
    document.addEventListener('visibilitychange', f); window.addEventListener('focus', f);
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', f); window.removeEventListener('focus', f); };
  }, []);

  /* load */
  useEffect(() => {
    let dead = false;
    Saver.onStatus = setSaveStatus;
    (async () => {
      setBoot({ phase: 'loading' });
      try {
        const store = await openStore();
        if (dead) return;
        Saver.store = store; setStoreKind(store.kind);
        const raw = await store.load();
        if (dead) return;
        let st = NZ.emptyState();
        if (raw != null) {
          const r = unpackState(raw);
          if (!r.ok) { setBoot({ phase: 'error', message: r.error }); return; }
          st = r.state;
        }
        realRef.current = st; setReal(st);
        setBoot({ phase: 'ready' });
        if (__PWA__) { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* none */ } }
        else { try { const d = window.claude && window.claude.use ? await window.claude.use('downloads') : null; if (!dead) setCanDownload(!!d); } catch (e) { /* none */ } }
      } catch (e) {
        if (!dead) setBoot({ phase: 'error', message: 'Could not load your saved data.' });
      }
    })();
    return () => { dead = true; };
  }, [attempt]);

  /* flush pending save when the page is hidden */
  useEffect(() => {
    const f = () => { if (document.visibilityState === 'hidden' && Saver.pending) Saver.flush(); };
    const g = () => { if (Saver.pending) Saver.flush(); };
    document.addEventListener('visibilitychange', f); window.addEventListener('pagehide', g);
    return () => { document.removeEventListener('visibilitychange', f); window.removeEventListener('pagehide', g); };
  }, []);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [tab]);

  const commitState = useCallback((next) => {
    if (demoRef.current && demoRef.current.on) { demoRef.current.state = next; setDemoS(next); }
    else { realRef.current = next; setReal(next); Saver.queue(next); }
  }, []);
  const getCur = () => (demoRef.current && demoRef.current.on ? demoRef.current.state : realRef.current);

  const fireToast = () => { setToast(Date.now()); };
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 2600); return () => clearTimeout(id); }, [toast]);

  const pick = (date, id, choice) => {
    /* Psychological checkpoint: choosing Minimum (from empty or Main) asks first. Clearing Minimum does not. */
    if (choice === 'min' && NZ.statusOf(getCur(), date, id) !== 'min') { setModal({ t: 'minCheck', date: date, id: id }); return; }
    applyPick(date, id, choice);
  };
  const applyPick = (date, id, choice) => {
    let next = NZ.setStatus(getCur(), date, id, choice);
    let celebrate = false;
    if (date === today) {
      const sc = NZ.dayScore(next, today);
      if (sc && sc.performance >= 100 && !next.celebrated[today]) { next = NZ.markCelebrated(next, today); celebrate = true; }
    }
    commitState(next);
    if (celebrate) fireToast();
  };

  const startDemo = () => {
    const st = NZ.buildDemo(today);
    demoRef.current = { on: true, state: st }; setDemoS(st); setDemo(true);
    setTab('today'); setSel(today); setMonth(NZ.monthStart(today)); setPAnchor(today); setModal(null);
  };
  const exitDemo = () => {
    demoRef.current = null; setDemo(false); setDemoS(null); setTab('today'); setSel(today);
  };

  const ui = {
    newHabit: () => setModal({ t: 'form' }),
    edit: (id) => setModal({ t: 'form', id }),
    move: (id, dir) => commitState(NZ.moveHabit(getCur(), id, dir, today)),
    archive: (hb) => setModal({
      t: 'confirm', c: {
        title: 'Archive "' + hb.name + '"?', body: 'It leaves your checklist from today on. Past days and their scores stay exactly as they are, and you can restore it later.',
        confirmLabel: 'Archive', danger: true, onConfirm: () => commitState(NZ.archiveHabit(getCur(), hb.id, today))
      }
    }),
    restore: (id) => commitState(NZ.restoreHabit(getCur(), id, today)),
    exportData: () => setModal({ t: 'export' }),
    importData: () => setModal({ t: 'import' }),
    displayInfo: () => setModal({ t: 'diag' }),
    startDemo: startDemo,
    reset: () => setModal({
      t: 'confirm', c: {
        title: 'Reset all data?', body: 'This permanently erases every habit, check-in and streak. Back up first if you might want it back.',
        confirmLabel: 'Continue', danger: true,
        onConfirm: () => setModal({
          t: 'confirm', c: {
            title: 'Really erase everything?', body: 'Last chance. This cannot be undone.', confirmLabel: 'Erase everything', danger: true,
            onConfirm: () => { commitState(NZ.emptyState()); setTab('today'); }
          }
        })
      }
    })
  };

  const saveHabit = (f) => {
    const cur = getCur();
    if (modal.id) commitState(NZ.updateHabit(cur, modal.id, f));
    else commitState(NZ.addHabit(cur, f, today));
    setModal(null);
  };

  const statusChip = demo ? <div className="chip-s demo">DEMO</div>
    : storeKind === 'memory' ? <div className="chip-s warn">Not saved</div>
      : saveStatus === 'saving' ? <div className="chip-s sav">Saving…</div>
        : saveStatus === 'error' ? <div className="chip-s err">Save failed, retrying</div>
          : saveStatus === 'saved' ? <div className="chip-s ok">{storeKind === 'local' ? 'Saved on this device' : 'Saved'}</div> : null;

  if (boot.phase === 'loading') {
    return <div className="center-screen"><h1 className="logo xl"><Logo size={132} />NEVER <span>ZERO</span></h1><div className="spin" role="status" aria-label="Loading" /><p className="muted s">Loading your habits…</p></div>;
  }
  if (boot.phase === 'error') {
    return (
      <div className="center-screen">
        <h1 className="logo"><Logo size={44} />NEVER <span>ZERO</span></h1>
        <div className="empty"><div className="empty-t">Couldn't open your data</div><p className="muted">{boot.message} Your saved data has not been changed.</p>
          <div className="row-btns">
            <button type="button" className="btn lime" onClick={() => setAttempt(attempt + 1)}>Try again</button>
            <button type="button" className="btn ghost" onClick={() => {
              Saver.store = makeAdapter('memory', { load: async () => null, save: async () => {} }); setStoreKind('memory');
              realRef.current = NZ.emptyState(); setReal(realRef.current); setBoot({ phase: 'ready' });
            }}>Continue without saving</button>
          </div>
        </div>
      </div>
    );
  }

  const hasHabits = Object.keys(S.habits).length > 0;
  const showWelcome = !demo && !hasHabits;

  return (
    <div className="app">
      {updateReady && <div className="upd"><span>A new version is ready</span><button type="button" onClick={() => window.location.reload()}>Reload</button></div>}
      {demo && <div className="demo-bar"><span>DEMO MODE · not saved</span><button type="button" onClick={exitDemo}>Exit demo</button></div>}
      <main className="screen" ref={scrollRef}>
        {showWelcome ? (
          <Welcome onCreate={ui.newHabit} onDemo={startDemo} onRestore={ui.importData} storeKind={storeKind} />
        ) : tab === 'today' ? (
          <Today S={S} today={today} pick={pick} goHabits={() => setTab('habits')} statusChip={statusChip} />
        ) : tab === 'progress' ? (
          <Progress S={S} today={today} mode={pMode} setMode={setPMode} anchor={pAnchor} setAnchor={setPAnchor} statusChip={statusChip} />
        ) : tab === 'history' ? (
          <History S={S} today={today} sel={sel} setSel={setSel} month={month} setMonth={setMonth} pick={pick} statusChip={statusChip} />
        ) : (
          <Habits S={S} today={today} demo={demo} ui={ui} statusChip={statusChip} storeKind={storeKind} saveStatus={saveStatus} />
        )}
      </main>
      {toast && (
        <div className="pf-wrap" role="status" key={toast}>
          <div className="pf-ring" /><div className="pf-t">PERFECT DAY — 100%</div>
        </div>
      )}
      {!showWelcome && (
        <nav className="nav" aria-label="Main">
          {[['today', 'Today'], ['progress', 'Progress'], ['history', 'History'], ['habits', 'Habits']].map(([k, label]) => (
            <button type="button" key={k} className={tab === k ? 'on' : ''} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>
              <Icon name={k} size={24} stroke={tab === k ? 2.4 : 2} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
      {modal && modal.t === 'form' && <HabitForm S={S} edit={modal.id ? S.habits[modal.id] : null} onSave={saveHabit} onClose={() => setModal(null)} />}
      {modal && modal.t === 'minCheck' && S.habits[modal.id] && (
        <MinCheck habit={S.habits[modal.id]} status={NZ.statusOf(S, modal.date, modal.id)} onClose={() => setModal(null)}
          onMain={() => { const m = modal; setModal(null); if (NZ.statusOf(getCur(), m.date, m.id) !== 'main') applyPick(m.date, m.id, 'main'); }}
          onMin={() => { const m = modal; setModal(null); applyPick(m.date, m.id, 'min'); }} />
      )}
      {modal && modal.t === 'diag' && <DisplayInfo onClose={() => setModal(null)} />}
      {modal && modal.t === 'confirm' && <Confirm c={modal.c} onClose={() => setModal(null)} />}
      {modal && modal.t === 'export' && <ExportModal S={S} canDownload={canDownload} onClose={() => setModal(null)} />}
      {modal && modal.t === 'import' && <ImportModal S={S} onClose={() => setModal(null)}
        onReplace={(st) => { commitState(st); setModal(null); setTab('today'); }} />}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  componentDidCatch(e) { try { console.error(e); } catch (x) { /* none */ } }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="center-screen">
        <h1 className="logo"><Logo size={44} />NEVER <span>ZERO</span></h1>
        <div className="empty"><div className="empty-t">Something went wrong</div>
          <p className="muted">Your saved habits are safe on this device. Reload to keep going.</p>
          <button type="button" className="btn lime" onClick={() => window.location.reload()}>Reload</button></div>
      </div>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<ErrorBoundary><App /></ErrorBoundary>);
if (__PWA__) {
  document.documentElement.classList.add('pwa');
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) window.dispatchEvent(new Event('nz-update')); });
    window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
  }
}

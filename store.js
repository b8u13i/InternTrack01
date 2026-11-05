/*
 * store.js
 * Tiny data layer. Everything lives in one object that is saved to localStorage.
 * To move this to a real backend later, replace load()/save() with fetch calls
 * (see README, "Moving to a real backend").
 */
const Store = (() => {
  const KEY = 'interntrack.v1';
  const SESSION_KEY = 'interntrack.session';
  let db = null;
  let memDb = null;
  let memSession = null;

  // Demo-grade hash. Good enough to avoid plain-text passwords in localStorage,
  // NOT a replacement for bcrypt/argon2 on a real server.
  const hash = (s) => {
    let h = 5381;
    const t = 'it$' + s;
    for (let i = 0; i < t.length; i++) h = ((h << 5) + h) ^ t.charCodeAt(i);
    return (h >>> 0).toString(36);
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* blocked storage or corrupted JSON, fall through */ }
    return memDb;
  }

  function save() {
    memDb = db;
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* quota or blocked: stay in memory */ }
  }

  const VERSION = 2;
  let recovered = false;

  function isValid(d) {
    return !!d && d.v === VERSION && Array.isArray(d.users) && Array.isArray(d.jobs) && Array.isArray(d.apps)
      && Array.isArray(d.notifications) && !!d.prep && typeof d.prep === 'object';
  }

  // Fill in missing fields and drop records that point at things that no longer exist,
  // so hand-edited or half-saved data cannot crash the app.
  function repair(d) {
    d.users = d.users.filter((u) => u && u.id && ['student', 'recruiter', 'admin'].includes(u.role));
    const userIds = new Set(d.users.map((u) => u.id));
    d.users.forEach((u) => {
      if (u.role === 'student') {
        const p = (u.profile = u.profile || {});
        p.skills = Array.isArray(p.skills) ? p.skills : [];
        p.saved = Array.isArray(p.saved) ? p.saved : [];
        p.interests = Object.assign({ categories: [], locations: [], type: 'Internship' }, p.interests);
        p.resumeText = typeof p.resumeText === 'string' ? p.resumeText : '';
        p.department = p.department || deptFromDegree(p.degree);
        if (!d.prep[u.id]) d.prep[u.id] = { items: [], mocks: [] };
      }
      if (u.role === 'recruiter') u.company = u.company || { name: u.name, city: '', about: '', approved: false };
    });
    d.jobs = d.jobs.filter((j) => j && j.id && userIds.has(j.companyId));
    d.jobs.forEach((j) => { j.skills = Array.isArray(j.skills) ? j.skills : []; });
    const jobIds = new Set(d.jobs.map((j) => j.id));
    const seen = new Set();
    d.apps = d.apps.filter((a) => {
      if (!a || !userIds.has(a.studentId) || !jobIds.has(a.jobId)) return false;
      const key = a.studentId + '|' + a.jobId;
      if (seen.has(key)) return false; // never keep two applications for the same job
      seen.add(key);
      return true;
    });
    d.apps.forEach((a) => { if (!Array.isArray(a.history) || !a.history.length) a.history = [{ status: a.status, at: a.appliedAt || Date.now() }]; });
    d.notifications = d.notifications.filter((n) => n && userIds.has(n.userId));
    d.users.forEach((u) => { if (u.role === 'student') u.profile.saved = u.profile.saved.filter((id) => jobIds.has(id)); });
    return d;
  }

  function init() {
    db = load();
    if (!isValid(db)) {
      recovered = !!db; // true when something was saved but could not be used
      db = Seed.build();
    } else {
      db = repair(db);
    }
    save();
    return db;
  }

  function reset() { db = Seed.build(); save(); return db; }

  const uid = (prefix) => prefix + '_' + Math.random().toString(36).slice(2, 9);

  function session(v) {
    if (v === undefined) {
      try { return localStorage.getItem(SESSION_KEY) || memSession; } catch (e) { return memSession; }
    }
    memSession = v;
    try { v === null ? localStorage.removeItem(SESSION_KEY) : localStorage.setItem(SESSION_KEY, v); } catch (e) {}
  }

  return { init, reset, save, hash, uid, session, db: () => db, wasRecovered: () => recovered };
})();

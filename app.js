/* app.js - views and event handling. Plain JS, no framework. */
(function () {
  Store.init();
  const root = document.getElementById('app');
  const D = () => Store.db();
  const S = { route: 'dashboard', modal: null, authTab: 'login', q: '', type: '', mode: '', cat: '', sort: 'match',
    nav: false, demo: false, appTab: 'all', skillCat: null, rcJob: '', rcText: '', aJob: 'all', aStatus: 'all', uRole: 'all', confirm: null };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (t) => new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const fmtDT = (t) => new Date(t).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  const ago = (t) => { const d = Math.floor((Date.now() - t) / 86400000); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d + ' days ago'; };
  const me = () => D().users.find((u) => u.id === Store.session());
  const user = (id) => D().users.find((u) => u.id === id);
  const job = (id) => D().jobs.find((j) => j.id === id);
  const company = (j) => user(j.companyId);
  const cname = (j) => company(j)?.company?.name || '';
  const isOpen = (j) => j.status === 'open' && !!company(j)?.company.approved && j.deadline + 86400000 > Date.now();
  const live = () => D().jobs.filter(isOpen);
  const myApps = (sid) => D().apps.filter((a) => a.studentId === sid);
  const recApps = (cid) => D().apps.filter((a) => job(a.jobId)?.companyId === cid);
  const save = () => Store.save();
  const notify = (userId, text) => D().notifications.push({ id: Store.uid('n'), userId, text, at: Date.now(), read: false });
  const unread = (u) => D().notifications.filter((n) => n.userId === u.id && !n.read).length;

  let toastT;
  function toast(msg) {
    const el = document.getElementById('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2800);
  }

  const pill = (s) => `<span class="pill st-${s.toLowerCase()}">${s}</span>`;
  const band = (n) => (n >= 70 ? 'hi' : n >= 40 ? 'mid' : 'lo');
  const match = (n) => `<span class="match m-${band(n)}" title="Match with your profile and resume">${n}%</span>`;
  const chips = (j, have) => j.skills.map((s) => `<span class="chip ${have ? (have.has(s) ? 'has' : 'lack') : ''}">${esc(s)}</span>`).join('');
  const empty = (t, sub) => `<div class="empty"><strong>${t}</strong><span>${sub || ''}</span></div>`;
  const bar = (label, val, max, extra = '', cls = '') => `<div class="hbar"><span class="hl">${esc(label)}</span><span class="track"><i class="${cls}" style="width:${max ? Math.max(val ? 2 : 0, (val / max) * 100) : 0}%"></i></span><span class="hv">${val}${extra}</span></div>`;

  /* ---------------- navigation ---------------- */
  const NAV = {
    student: [['dashboard', 'Dashboard'], ['jobs', 'Find openings'], ['saved', 'Saved jobs'], ['applications', 'My applications'], ['resume', 'Resume check'], ['skills', 'Skill gap'], ['prep', 'Interview prep'], ['analytics', 'My analytics'], ['profile', 'Profile']],
    recruiter: [['dashboard', 'Overview'], ['listings', 'Listings'], ['applicants', 'Applicants'], ['analytics', 'Analytics']],
    admin: [['dashboard', 'Overview'], ['users', 'Users'], ['companies', 'Companies and listings'], ['analytics', 'Analytics']]
  };
  const TITLES = { notifications: 'Notifications' };

  function go(r) { S.route = r; S.confirm = null; S.nav = false; if (location.hash.slice(1) !== r) location.hash = r; else render(); }
  window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (r && r !== S.route) { S.route = r; S.modal = null; S.nav = false; render(); } });

  /* ---------------- shell ---------------- */
  function render() {
    const u = me();
    if (!u || !u.active) { root.innerHTML = authView(); return; }
    const nav = NAV[u.role];
    if (!nav.some((n) => n[0] === S.route) && S.route !== 'notifications') S.route = 'dashboard';
    const title = (nav.find((n) => n[0] === S.route) || [0, TITLES[S.route]])[1];
    const n = unread(u);
    root.innerHTML = `<div class="shell ${S.nav ? 'nav-open' : ''}">
      <aside class="side">
        <div class="brand">Intern<b>Track</b></div>
        <nav>${nav.map(([k, l]) => `<a href="#${k}" data-act="navclose" class="${S.route === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
        <div class="side-foot">
          <div class="who"><span class="av">${esc(u.name.split(' ').map((x) => x[0]).slice(0, 2).join(''))}</span><span><strong>${esc(u.name)}</strong><small>${u.role === 'recruiter' ? esc(u.company.name) : u.role}</small></span></div>
          <button class="link" data-act="logout">Sign out</button>
        </div>
      </aside>
      <main class="main">
        <header class="top"><div class="top-l"><button class="menu" data-act="menu" aria-label="Menu" aria-expanded="${S.nav}">☰</button><h1>${title}</h1></div>
          <a class="bell" data-act="navclose" href="#notifications" title="Notifications">Notifications${n ? `<b>${n}</b>` : ''}</a></header>
        <div class="page">${view(u)}</div>
      </main>
      ${S.nav ? '<div class="scrim" data-act="menu"></div>' : ''}
    </div>${S.modal ? modalView(u) : ''}`;
  }

  function view(u) {
    const v = { student: studentViews, recruiter: recruiterViews, admin: adminViews }[u.role];
    if (S.route === 'notifications') return notifView(u);
    if (S.route === 'analytics') return analyticsView(u);
    return (v[S.route] || v.dashboard)(u);
  }

  /* ---------------- auth ---------------- */
  function authView() {
    const login = S.authTab === 'login';
    const demo = (e, p, role, who) => `<button data-act="demo" data-e="${e}" data-p="${p}"><b>${role}</b><span>${who}</span></button>`;
    return `<div class="auth">
      <aside class="demo-side">
        <button class="demo-toggle ${S.demo ? 'on' : ''}" data-act="demotoggle" aria-expanded="${S.demo}">Demo accounts <i>${S.demo ? '−' : '+'}</i></button>
        ${S.demo ? `<div class="demo card">
          <h2>Internships and placements, tracked in one place.</h2>
          <p>Students see what they match and where each application stands. Recruiters move candidates through the pipeline. The placement cell sees the numbers.</p>
          <h3>Open a demo account</h3>
          ${demo('meera@student.demo', 'demo123', 'Student', 'Meera Nair, third year CS')}
          ${demo('hr@kiranastack.demo', 'demo123', 'Recruiter', 'Kiranastack Technologies')}
          ${demo('admin@interntrack.demo', 'admin123', 'Admin', 'Placement cell')}
        </div>` : ''}
      </aside>
      <main class="auth-main">
        <div class="brand big">Intern<b>Track</b></div>
        <section class="card auth-card">
          <div class="tabs"><button class="${login ? 'on' : ''}" data-act="authtab" data-t="login">Sign in</button><button class="${login ? '' : 'on'}" data-act="authtab" data-t="register">Create account</button></div>
          ${login ? `<form data-form="login">
            <label>Email<input id="l-email" name="email" type="email" required autocomplete="username"></label>
            <label>Password<input id="l-pass" name="password" type="password" required autocomplete="current-password"></label>
            <p class="err" id="auth-err" hidden></p><button class="btn">Sign in</button></form>` : `<form data-form="register">
            <label>I am a<select id="r-role" name="role" data-input="regrole"><option value="student">Student</option><option value="recruiter">Recruiter</option></select></label>
            <label>Full name<input id="r-name" name="name" required></label>
            <label>Email<input id="r-email" name="email" type="email" required></label>
            <label>Password<input id="r-pass" name="password" type="password" minlength="6" required></label>
            <label id="r-extra-l">College<input id="r-extra" name="extra" required></label>
            <p class="err" id="auth-err" hidden></p><button class="btn">Create account</button></form>`}
        </section>
      </main></div>`;
  }

  /* ---------------- student ---------------- */
  const studentViews = {
    dashboard(u) {
      const apps = myApps(u.id), c = Logic.statusCounts(apps);
      const applied = new Set(apps.map((a) => a.jobId));
      const recs = Logic.recommend(u, live(), applied, 4);
      const upcoming = apps.filter((a) => a.interview && a.interview.at > Date.now() - 3600000).sort((a, b) => a.interview.at - b.interview.at);
      const items = D().prep[u.id].items, done = items.filter((i) => i.done).length;
      const notes = D().notifications.filter((n) => n.userId === u.id).sort((a, b) => b.at - a.at).slice(0, 4);
      return `<p class="lead">Hi ${esc(u.name.split(' ')[0])}. ${upcoming.length ? `Your next interview is ${fmtDT(upcoming[0].interview.at)}.` : 'No interviews scheduled right now.'}</p>
      <div class="stats">
        <div><strong>${apps.length}</strong><span>applications</span></div>
        <div><strong>${c.Applied + c.Shortlisted}</strong><span>waiting to hear back</span></div>
        <div><strong>${c.Interview}</strong><span>interview stage</span></div>
        <div><strong>${c.Selected}</strong><span>offers</span></div>
      </div>
      <div class="cols">
        <section class="card"><h2>Recommended for you</h2>
          ${recs.map((r) => `<button class="row" data-act="openjob" data-id="${r.job.id}"><span class="grow"><strong>${esc(r.job.title)}</strong><small>${esc(cname(r.job))} · ${esc(r.job.location)} · ${esc(r.job.pay)}</small><small class="why">${esc(r.why)}</small></span>${match(r.analysis.score)}</button>`).join('') || empty('Nothing new right now')}
          <a class="more" href="#jobs">See all openings</a></section>
        <div class="stack">
          <section class="card"><h2>Upcoming interviews</h2>
            ${upcoming.map((a) => `<div class="row static"><span class="grow"><strong>${esc(job(a.jobId).title)}</strong><small>${esc(cname(job(a.jobId)))} · ${esc(a.interview.mode)}</small></span><span class="when">${fmtDT(a.interview.at)}</span></div>`).join('') || empty('None scheduled')}</section>
          <section class="card"><h2>Preparation</h2>
            <div class="hbar"><span class="hl">${done} of ${items.length} topics done</span><span class="track"><i style="width:${(done / items.length) * 100}%"></i></span><span class="hv">${Math.round((done / items.length) * 100)}%</span></div>
            <a class="more" href="#prep">Open prep tracker</a></section>
          <section class="card"><h2>Latest updates</h2>
            ${notes.map((n) => `<div class="note ${n.read ? '' : 'new'}">${esc(n.text)}<small>${ago(n.at)}</small></div>`).join('') || empty('No updates yet')}</section>
        </div>
      </div>`;
    },

    jobs(u) {
      return `<div class="filters card">
        <input id="f-q" data-input="q" placeholder="Search title, company or skill" value="${esc(S.q)}">
        <select id="f-type" data-input="type"><option value="">Internship or job</option>${['Internship', 'Full-time'].map((t) => `<option ${S.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="f-mode" data-input="mode"><option value="">Any location type</option>${['Remote', 'Hybrid', 'On-site'].map((t) => `<option ${S.mode === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="f-cat" data-input="cat"><option value="">All fields</option>${CATEGORIES.map((t) => `<option ${S.cat === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <select id="f-sort" data-input="sort">${[['match', 'Best match'], ['new', 'Newest'], ['pay', 'Highest pay']].map(([v, l]) => `<option value="${v}" ${S.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div><div id="joblist" class="card list">${jobList(u)}</div>`;
    },

    saved(u) {
      return `<p class="lead">Jobs you have saved. Use Unsave to remove one.</p><div id="joblist" class="card list">${jobList(u)}</div>`;
    },

    applications(u) {
      const apps = myApps(u.id).sort((a, b) => b.updatedAt - a.updatedAt);
      const c = Logic.statusCounts(apps);
      const shown = S.appTab === 'all' ? apps : apps.filter((a) => a.status === S.appTab);
      const stages = ['Applied', 'Shortlisted', 'Interview', 'Decision'];
      return `<div class="bar-actions"><button class="btn ghost small" data-act="exportcsv" ${apps.length ? '' : 'disabled'}>Export CSV</button></div>
      <div class="tabs flat"><button class="${S.appTab === 'all' ? 'on' : ''}" data-act="apptab" data-t="all">All <small>${apps.length}</small></button>${STATUSES.map((s) => `<button class="${S.appTab === s ? 'on' : ''}" data-act="apptab" data-t="${s}">${s} <small>${c[s]}</small></button>`).join('')}</div>
      ${shown.map((a) => {
        const j = job(a.jobId), reached = new Set(a.history.map((h) => h.status));
        const fin = a.status === 'Selected' || a.status === 'Rejected';
        return `<article class="card app"><header><div><h3>${esc(j.title)}</h3><small>${esc(cname(j))} · ${esc(j.location)} · applied ${fmt(a.appliedAt)}</small></div>${pill(a.status)}</header>
          <ol class="steps">${stages.map((s, i) => { const on = s === 'Decision' ? fin : reached.has(s); const label = s === 'Decision' && fin ? a.status : s; return `<li class="${on ? 'done' : ''} ${s === 'Decision' && a.status === 'Rejected' ? 'bad' : ''}"><i></i>${label}</li>`; }).join('')}</ol>
          ${a.interview ? `<p class="call"><b>Interview:</b> ${fmtDT(a.interview.at)} · ${esc(a.interview.mode)}${a.interview.note ? ` · ${esc(a.interview.note)}` : ''}</p>` : ''}
          <footer><small>Last update ${ago(a.updatedAt)}</small>
            ${S.confirm === a.id ? `<span><button class="link danger" data-act="withdraw" data-id="${a.id}">Yes, withdraw</button> <button class="link" data-act="noconfirm">Keep</button></span>` : (fin ? '' : `<button class="link" data-act="askwithdraw" data-id="${a.id}">Withdraw</button>`)}</footer></article>`;
      }).join('') || empty('No applications here', 'Find an opening and apply from its page.')}`;
    },

    resume(u) {
      const opts = live().map((j) => `<option value="${j.id}" ${S.rcJob === j.id ? 'selected' : ''}>${esc(j.title)} · ${esc(cname(j))}</option>`).join('');
      return `<p class="lead">Compare your resume text with a job description and see which keywords are missing.</p>
      <div class="card"><label>Job description
        <select id="rc-job" data-input="rcJob"><option value="">Paste my own description</option>${opts}</select></label>
        <label>${S.rcJob ? 'Description (from listing)' : 'Paste the description here'}<textarea id="rc-text" data-input="rcText" rows="6" ${S.rcJob ? 'readonly' : ''}>${esc(S.rcJob ? job(S.rcJob).description : S.rcText)}</textarea></label></div>
      <div id="rc-out">${resumeOut(u)}</div>`;
    },

    skills(u) {
      const cat = S.skillCat || (u.profile.interests.categories[0] || CATEGORIES[0]);
      const g = Logic.skillGap(u, cat, live());
      return `<p class="lead">Pick a field. We compare the skills its listings ask for with what is on your profile and resume.</p>
      <div class="tabs flat">${CATEGORIES.map((c) => `<button class="${cat === c ? 'on' : ''}" data-act="skillcat" data-t="${esc(c)}">${c}</button>`).join('')}</div>
      <div class="cols"><section class="card"><h2>${esc(cat)}: ${g.listings} live listing${g.listings === 1 ? '' : 's'}</h2>
        ${g.rows.map((r) => `<div class="gap"><span class="grow"><strong>${esc(r.skill)}</strong><small>asked for in ${r.n} of ${g.listings}</small></span><span class="track"><i style="width:${r.demand * 100}%"></i></span><span class="tag ${r.have ? 'ok' : 'no'}">${r.have ? 'You have it' : 'Missing'}</span></div>`).join('') || empty('No listings in this field yet')}</section>
        <div class="stack"><section class="card"><h2>Your coverage</h2><div class="big">${g.coverage}%</div><small>of the demand in this field, weighted by how often each skill appears.</small></section>
        ${g.next ? `<section class="card"><h2>Learn next: ${esc(g.next.skill)}</h2><p>It appears in ${g.unlocks} listing${g.unlocks === 1 ? '' : 's'} here and you do not have it yet.</p><p class="hint">${esc(LEARN_HINTS[g.next.skill] || 'Build one small project that uses ' + g.next.skill + ' and add it to your resume.')}</p><button class="btn ghost" data-act="addskill" data-s="${esc(g.next.skill)}">I know this, add to profile</button></section>` : ''}</div></div>`;
    },

    prep(u) {
      const P = D().prep[u.id], topics = [...new Set(P.items.map((i) => i.topic))];
      const up = myApps(u.id).filter((a) => a.interview && a.interview.at > Date.now()).sort((a, b) => a.interview.at - b.interview.at);
      return `<div class="cols"><div class="stack">${topics.map((t) => { const its = P.items.filter((i) => i.topic === t), d = its.filter((i) => i.done).length;
        return `<section class="card"><h2>${esc(t)} <small>${d}/${its.length}</small></h2><span class="track slim"><i style="width:${(d / its.length) * 100}%"></i></span>
          ${its.map((i) => `<label class="check"><input type="checkbox" data-change="prep" data-id="${i.id}" ${i.done ? 'checked' : ''}><span>${esc(i.title)}</span></label>`).join('')}</section>`; }).join('')}
        <section class="card"><h2>Add your own item</h2><form class="inline" data-form="prepadd"><select id="pa-topic" name="topic">${topics.map((t) => `<option>${esc(t)}</option>`).join('')}</select><input id="pa-title" name="title" placeholder="e.g. Revise binary search" required><button class="btn">Add</button></form></section></div>
      <div class="stack"><section class="card"><h2>Upcoming interviews</h2>${up.map((a) => `<div class="row static"><span class="grow"><strong>${esc(job(a.jobId).title)}</strong><small>${esc(cname(job(a.jobId)))} · ${esc(a.interview.mode)}</small></span><span class="when">${fmtDT(a.interview.at)}</span></div>`).join('') || empty('None scheduled')}</section>
        <section class="card"><h2>Mock interview log</h2>
          ${P.mocks.slice().reverse().map((m) => `<div class="note"><strong>${esc(m.kind)}</strong> with ${esc(m.with)}<br>${esc(m.notes)}<small>${fmt(m.date)}</small></div>`).join('') || empty('No mock interviews yet')}
          <form data-form="mock" class="stacked"><input id="m-with" name="with" placeholder="With whom (senior, friend, club)" required><select id="m-kind" name="kind"><option>Technical</option><option>HR</option><option>Aptitude</option></select><textarea id="m-notes" name="notes" rows="2" placeholder="What went well, what to fix"></textarea><button class="btn ghost">Save entry</button></form></section></div></div>`;
    },

    profile(u) {
      const p = u.profile, vocab = Object.keys(SKILL_VOCAB);
      const parts = [p.college, p.degree, p.skills.length >= 3, p.resumeText, p.interests.categories.length, p.about, p.github];
      const pct = Math.round((parts.filter(Boolean).length / parts.length) * 100);
      return `<p class="lead">Profile ${pct}% complete. Recruiters see this page when you apply.</p>
      <div class="cols"><div class="stack">
        <form class="card" data-form="profile"><h2>About you</h2>
          <div class="grid2"><label>Name<input id="p-name" name="name" value="${esc(u.name)}" required></label><label>College<input id="p-college" name="college" value="${esc(p.college)}"></label>
          <label>Degree<input id="p-degree" name="degree" value="${esc(p.degree)}"></label><label>Year<input id="p-year" name="year" type="number" min="1" max="5" value="${esc(p.year)}"></label>
          <label>CGPA<input id="p-cgpa" name="cgpa" type="number" step="0.1" min="0" max="10" value="${esc(p.cgpa)}"></label><label>GitHub<input id="p-gh" name="github" value="${esc(p.github)}"></label></div>
          <label>Short intro<textarea id="p-about" name="about" rows="3">${esc(p.about)}</textarea></label>
          <h2>What you are looking for</h2>
          <div class="checks">${CATEGORIES.map((c) => `<label class="check"><input type="checkbox" name="cats" value="${esc(c)}" ${p.interests.categories.includes(c) ? 'checked' : ''}><span>${c}</span></label>`).join('')}</div>
          <div class="grid2"><label>Preferred cities (comma separated)<input id="p-locs" name="locs" value="${esc(p.interests.locations.join(', '))}"></label>
          <label>Type<select id="p-type" name="type">${['Internship', 'Full-time'].map((t) => `<option ${p.interests.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
          <button class="btn">Save profile</button></form>
        <section class="card"><h2>Skills</h2><div class="chips">${p.skills.map((s) => `<span class="chip has">${esc(s)} <button data-act="rmskill" data-s="${esc(s)}" aria-label="Remove ${esc(s)}">×</button></span>`).join('') || '<small>None yet</small>'}</div>
          <form class="inline" data-form="skill"><input id="sk-add" name="skill" list="vocab" placeholder="Add a skill" required><datalist id="vocab">${vocab.map((v) => `<option value="${esc(v)}">`).join('')}</datalist><button class="btn ghost">Add</button></form></section></div>
      <section class="card"><h2>Resume</h2>
        <p class="file">${p.resumeFile ? `<b>${esc(p.resumeFile.name)}</b> <small>${Math.round(p.resumeFile.size / 1024)} KB</small>` : 'No file uploaded yet.'}</p>
        <label>Upload file (PDF, TXT or MD, up to 1 MB)<input id="p-file" type="file" accept=".pdf,.txt,.md" data-change="file"></label>
        <form data-form="resume"><label>Resume text, used for keyword matching<textarea id="p-resume" name="text" rows="14">${esc(p.resumeText)}</textarea></label>
        <small class="hint">Text and text-based PDFs fill this box on upload (PDF reading needs an internet connection). Scanned PDFs and Word files cannot be read: paste the text here.</small><button class="btn">Save resume text</button></form></section></div>`;
    }
  };

  function jobRow(j, a, applied, have, saved) {
    const isSaved = saved.has(j.id);
    return `<div class="row job"><button class="jobmain" data-act="openjob" data-id="${j.id}"><strong>${esc(j.title)}</strong>
      <small>${esc(cname(j))} · ${esc(j.location)} · ${j.mode} · ${esc(j.pay)} · apply by ${fmt(j.deadline)}</small><span class="chips">${chips(j, have)}</span></button>
      <span class="side-r">${applied.has(j.id) ? '<span class="tag ok">Applied</span>' : ''}${isOpen(j) ? '' : '<span class="tag no">Closed</span>'}${match(a.score)}
      <button class="save ${isSaved ? 'on' : ''}" data-act="save" data-id="${j.id}" aria-pressed="${isSaved}">${isSaved ? 'Unsave' : 'Save'}</button></span></div>`;
  }

  function jobList(u) {
    const saved = new Set(u.profile.saved), applied = new Set(myApps(u.id).map((a) => a.jobId)), have = Logic.studentSkillSet(u);
    if (S.route === 'saved') {
      const rows = u.profile.saved.map(job).filter(Boolean);
      return rows.map((j) => jobRow(j, Logic.analyse(j, u), applied, have, saved)).join('') || empty('No saved jobs yet', 'Press Save on any opening to keep it here.');
    }
    const q = S.q.toLowerCase();
    let list = live().map((j) => ({ j, a: Logic.analyse(j, u) })).filter(({ j }) =>
      (!q || (j.title + ' ' + cname(j) + ' ' + j.skills.join(' ')).toLowerCase().includes(q)) &&
      (!S.type || j.type === S.type) && (!S.mode || j.mode === S.mode) && (!S.cat || j.category === S.cat));
    list.sort((x, y) => S.sort === 'new' ? y.j.postedAt - x.j.postedAt : S.sort === 'pay' ? y.j.payNum - x.j.payNum : y.a.score - x.a.score);
    return list.map(({ j, a }) => jobRow(j, a, applied, have, saved)).join('') || empty('No openings match those filters');
  }

  // CSV helpers. Cells starting with = + - @ are prefixed so spreadsheets do not run them as formulas.
  const csvCell = (v) => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  const isoDate = (t) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function applicationsCsv(u) {
    const head = ['Job title', 'Company', 'Type', 'Location', 'Mode', 'Pay', 'Applied on', 'Status', 'Last updated', 'Interview', 'My note'];
    const rows = myApps(u.id).sort((a, b) => b.appliedAt - a.appliedAt).map((a) => {
      const j = job(a.jobId);
      return [j.title, cname(j), j.type, j.location, j.mode, j.pay, isoDate(a.appliedAt), a.status, isoDate(a.updatedAt), a.interview ? fmtDT(a.interview.at) + ' (' + a.interview.mode + ')' : '', a.note];
    });
    return '\ufeff' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  }

  function resumeOut(u) {
    const text = S.rcJob ? job(S.rcJob).description + ' ' + job(S.rcJob).skills.join(', ') : S.rcText;
    if (!text.trim()) return empty('Nothing to check yet', 'Choose a listing or paste a description above.');
    if (!(u.profile.resumeText || '').trim()) return empty('Your resume text is empty', 'Add it on the Profile page first.');
    const r = Logic.checkText(text, u);
    const tips = [];
    if (r.missing.length) tips.push(`The description asks for ${r.missing.join(', ')}. If you have used these, say so in your projects or experience.`);
    if (r.profileOnly.length) tips.push(`${r.profileOnly.join(', ')} ${r.profileOnly.length > 1 ? 'are' : 'is'} on your profile but never appears in your resume text.`);
    if (r.resumeWords < 150) tips.push('Your resume text is short (' + r.resumeWords + ' words). Add one line per project about what you built and the result.');
    if (!tips.length) tips.push('Good coverage. Keep the wording close to the description where it is true.');
    return `<div class="cols"><section class="card"><h2>Match</h2><div class="big ${band(r.score)}">${r.score}%</div><span class="track"><i style="width:${r.score}%"></i></span>
      <h3>Skills found in both</h3><div class="chips">${r.matched.map((s) => `<span class="chip has">${esc(s)}</span>`).join('') || '<small>None</small>'}</div>
      <h3>Skills missing from your resume</h3><div class="chips">${r.missing.map((s) => `<span class="chip lack">${esc(s)}</span>`).join('') || '<small>None</small>'}</div>
      <h3>Other keywords in the description</h3><div class="chips">${r.wordHit.map((s) => `<span class="chip has">${esc(s)}</span>`).join('')}${r.wordMiss.map((s) => `<span class="chip lack">${esc(s)}</span>`).join('')}</div></section>
      <section class="card"><h2>What to change</h2><ul class="tips">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section></div>`;
  }

  /* ---------------- recruiter ---------------- */
  const recruiterViews = {
    dashboard(u) {
      const jobs = D().jobs.filter((j) => j.companyId === u.id), apps = recApps(u.id), c = Logic.statusCounts(apps);
      const recent = apps.slice().sort((a, b) => b.appliedAt - a.appliedAt).slice(0, 6);
      return `${u.company.approved ? '' : '<div class="banner">Your company is waiting for approval from the placement cell. Your listings stay hidden from students until then.</div>'}
      <div class="stats"><div><strong>${jobs.filter((j) => j.status === 'open').length}</strong><span>open listings</span></div><div><strong>${apps.length}</strong><span>applicants</span></div><div><strong>${c.Shortlisted + c.Interview}</strong><span>in pipeline</span></div><div><strong>${c.Selected}</strong><span>selected</span></div></div>
      <div class="cols"><section class="card"><h2>Recent applicants</h2>${recent.map((a) => { const s = user(a.studentId), j = job(a.jobId); return `<button class="row" data-act="viewstudent" data-id="${s.id}" data-job="${j.id}"><span class="grow"><strong>${esc(s.name)}</strong><small>${esc(j.title)} · ${ago(a.appliedAt)}</small></span>${pill(a.status)}</button>`; }).join('') || empty('No applicants yet')}<a class="more" href="#applicants">Open applicants</a></section>
      <section class="card"><h2>Your listings</h2>${jobs.map((j) => `<div class="row static"><span class="grow"><strong>${esc(j.title)}</strong><small>${j.status === 'open' ? 'Open until ' + fmt(j.deadline) : 'Closed'}</small></span><span class="when">${apps.filter((a) => a.jobId === j.id).length} applied</span></div>`).join('') || empty('No listings yet')}<a class="more" href="#listings">Manage listings</a></section></div>`;
    },
    listings(u) {
      const jobs = D().jobs.filter((j) => j.companyId === u.id), apps = recApps(u.id);
      return `<div class="bar-actions"><button class="btn" data-act="newjob">Post a listing</button></div>
      <div class="card tablewrap"><table><thead><tr><th>Role</th><th>Type</th><th>Pay</th><th>Deadline</th><th>Applicants</th><th>Status</th><th></th></tr></thead><tbody>
      ${jobs.map((j) => `<tr><td><strong>${esc(j.title)}</strong><small>${esc(j.location)} · ${j.mode}</small></td><td>${j.type}</td><td>${esc(j.pay)}</td><td>${fmt(j.deadline)}</td><td>${apps.filter((a) => a.jobId === j.id).length}</td><td><span class="tag ${j.status === 'open' ? 'ok' : 'no'}">${j.status}</span></td>
      <td class="r"><button class="link" data-act="togglejob" data-id="${j.id}">${j.status === 'open' ? 'Close' : 'Reopen'}</button> <button class="link" data-act="seeapps" data-id="${j.id}">Applicants</button></td></tr>`).join('') || `<tr><td colspan="7">${empty('No listings yet', 'Post your first one.')}</td></tr>`}</tbody></table></div>`;
    },
    applicants(u) {
      const mine = D().jobs.filter((j) => j.companyId === u.id);
      let apps = recApps(u.id).filter((a) => (S.aJob === 'all' || a.jobId === S.aJob) && (S.aStatus === 'all' || a.status === S.aStatus))
        .map((a) => ({ a, s: user(a.studentId), j: job(a.jobId) })).map((x) => ({ ...x, m: Logic.analyse(x.j, x.s).score })).sort((x, y) => y.m - x.m);
      return `<div class="filters card"><select id="fa-job" data-input="aJob"><option value="all">All listings</option>${mine.map((j) => `<option value="${j.id}" ${S.aJob === j.id ? 'selected' : ''}>${esc(j.title)}</option>`).join('')}</select>
        <select id="fa-st" data-input="aStatus"><option value="all">Any status</option>${STATUSES.map((s) => `<option ${S.aStatus === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
      <div class="card tablewrap"><table><thead><tr><th>Candidate</th><th>Applied for</th><th>Match</th><th>Applied</th><th>Status</th><th></th></tr></thead><tbody>
      ${apps.map(({ a, s, j, m }) => `<tr><td><strong>${esc(s.name)}</strong><small>${esc(s.profile.college)} · CGPA ${esc(s.profile.cgpa)}</small></td><td>${esc(j.title)}</td><td>${match(m)}</td><td>${fmt(a.appliedAt)}</td>
      <td><select class="mini" id="st-${a.id}" data-change="status" data-id="${a.id}">${STATUSES.map((st) => `<option ${a.status === st ? 'selected' : ''}>${st}</option>`).join('')}</select>${a.interview ? `<small>${fmtDT(a.interview.at)}</small>` : ''}</td>
      <td class="r"><button class="link" data-act="viewstudent" data-id="${s.id}" data-job="${j.id}">Profile</button> <button class="link" data-act="schedule" data-id="${a.id}">Schedule</button></td></tr>`).join('') || `<tr><td colspan="6">${empty('No applicants match')}</td></tr>`}</tbody></table></div>`;
    }
  };

  /* ---------------- admin ---------------- */
  const adminViews = {
    dashboard() {
      const us = D().users, apps = D().apps, c = Logic.statusCounts(apps);
      const pend = us.filter((x) => x.role === 'recruiter' && !x.company.approved);
      return `<div class="stats"><div><strong>${us.filter((x) => x.role === 'student').length}</strong><span>students</span></div><div><strong>${us.filter((x) => x.role === 'recruiter' && x.company.approved).length}</strong><span>companies</span></div><div><strong>${live().length}</strong><span>live listings</span></div><div><strong>${apps.length}</strong><span>applications</span></div><div><strong>${c.Selected}</strong><span>selected</span></div></div>
      <div class="cols"><section class="card"><h2>Waiting for approval</h2>${pend.map((x) => `<div class="row static"><span class="grow"><strong>${esc(x.company.name)}</strong><small>${esc(x.name)} · ${esc(x.email)}</small></span><button class="btn small" data-act="approve" data-id="${x.id}">Approve</button></div>`).join('') || empty('Nothing waiting')}</section>
      <section class="card"><h2>Most recent applications</h2>${apps.slice().sort((a, b) => b.appliedAt - a.appliedAt).slice(0, 6).map((a) => `<div class="row static"><span class="grow"><strong>${esc(user(a.studentId).name)}</strong><small>${esc(job(a.jobId).title)} · ${esc(cname(job(a.jobId)))}</small></span>${pill(a.status)}</div>`).join('')}</section></div>`;
    },
    users() {
      const list = D().users.filter((x) => S.uRole === 'all' || x.role === S.uRole);
      return `<div class="tabs flat">${['all', 'student', 'recruiter', 'admin'].map((r) => `<button class="${S.uRole === r ? 'on' : ''}" data-act="urole" data-t="${r}">${r === 'all' ? 'Everyone' : r[0].toUpperCase() + r.slice(1) + 's'}</button>`).join('')}</div>
      <div class="card tablewrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Account</th></tr></thead><tbody>${list.map((x) => `<tr><td><strong>${esc(x.name)}</strong><small>${x.role === 'recruiter' ? esc(x.company.name) : x.role === 'student' ? esc(x.profile.college) : ''}</small></td><td>${esc(x.email)}</td><td>${x.role}</td><td>${fmt(x.createdAt)}</td>
      <td>${x.role === 'admin' ? '<span class="tag ok">Active</span>' : `<button class="link ${x.active ? '' : 'danger'}" data-act="toggleuser" data-id="${x.id}">${x.active ? 'Active · disable' : 'Disabled · enable'}</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="foot"><button class="link danger" data-act="reset">Reset demo data</button></p>`;
    },
    companies() {
      const cs = D().users.filter((x) => x.role === 'recruiter');
      return `<div class="card tablewrap"><table><thead><tr><th>Company</th><th>Contact</th><th>Listings</th><th>Approval</th></tr></thead><tbody>${cs.map((x) => `<tr><td><strong>${esc(x.company.name)}</strong><small>${esc(x.company.city)}</small></td><td>${esc(x.name)}<small>${esc(x.email)}</small></td><td>${D().jobs.filter((j) => j.companyId === x.id).length}</td>
      <td><button class="link ${x.company.approved ? '' : 'danger'}" data-act="approve" data-id="${x.id}">${x.company.approved ? 'Approved · revoke' : 'Pending · approve'}</button></td></tr>`).join('')}</tbody></table></div>
      <div class="card tablewrap"><table><thead><tr><th>Listing</th><th>Company</th><th>Field</th><th>Applicants</th><th>Status</th><th></th></tr></thead><tbody>${D().jobs.map((j) => `<tr><td><strong>${esc(j.title)}</strong></td><td>${esc(cname(j))}</td><td>${j.category}</td><td>${D().apps.filter((a) => a.jobId === j.id).length}</td><td><span class="tag ${j.status === 'open' ? 'ok' : 'no'}">${j.status}</span></td>
      <td class="r">${S.confirm === j.id ? `<button class="link danger" data-act="deljob" data-id="${j.id}">Confirm remove</button> <button class="link" data-act="noconfirm">Cancel</button>` : `<button class="link" data-act="togglejob" data-id="${j.id}">${j.status === 'open' ? 'Close' : 'Reopen'}</button> <button class="link danger" data-act="askdel" data-id="${j.id}">Remove</button>`}</td></tr>`).join('')}</tbody></table></div>`;
    }
  };

  /* ---------------- analytics ---------------- */
  function monthChart(months) {
    const W = 520, H = 190, L = 30, B = 26, T = 12, R = 8, max = Math.max(4, ...months.map((m) => m.count)), top = Math.ceil(max / 4) * 4;
    const bw = (W - L - R) / months.length, y = (v) => T + (H - T - B) * (1 - v / top);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (top / 4) * i; g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`; }
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Applications per month">${g}${months.map((m, i) => { const x = L + i * bw + bw * 0.22; return `<rect class="bar" x="${x}" y="${y(m.count)}" width="${bw * 0.56}" height="${H - B - y(m.count)}" fill="var(--accent)"/><text class="ax" x="${x + bw * 0.28}" y="${H - 8}" text-anchor="middle">${m.label}</text>${m.count ? `<text class="ax val" x="${x + bw * 0.28}" y="${y(m.count) - 4}" text-anchor="middle">${m.count}</text>` : ''}`; }).join('')}</svg>`;
  }

  function analyticsView(u) {
    const apps = u.role === 'student' ? myApps(u.id) : u.role === 'recruiter' ? recApps(u.id) : D().apps;
    const c = Logic.statusCounts(apps), rate = Logic.selectionRate(apps), resp = Logic.avgResponseDays(apps), mx = Math.max(1, ...Object.values(c));
    const cats = CATEGORIES.map((k) => { const l = apps.filter((a) => job(a.jobId).category === k); const cc = Logic.statusCounts(l); return { k, n: l.length, sel: cc.Selected, rej: cc.Rejected, rate: Logic.selectionRate(l) }; }).filter((x) => x.n);
    let third = '';
    if (u.role === 'student') {
      const have = Logic.studentSkillSet(u), sc = live().map((j) => Logic.analyse(j, u).score);
      const b = [['70% and above', sc.filter((s) => s >= 70).length, 'good'], ['40 to 69%', sc.filter((s) => s >= 40 && s < 70).length, ''], ['Below 40%', sc.filter((s) => s < 40).length, 'low']];
      third = `<section class="card"><h2>Your match across ${sc.length} live listings</h2>${b.map(([l, n, k]) => bar(l, n, sc.length, '', k)).join('')}</section>
        <section class="card"><h2>Skills in demand</h2>${Logic.topSkills(live()).map(([s, n]) => bar(s, n, live().length, ' listings', have.has(s) ? 'good' : '')).join('')}<small class="foot">Green means you have it.</small></section>`;
    } else if (u.role === 'recruiter') {
      const js = D().jobs.filter((j) => j.companyId === u.id);
      third = `<section class="card"><h2>Applicants per listing</h2>${js.map((j) => bar(j.title, apps.filter((a) => a.jobId === j.id).length, Math.max(1, ...js.map((x) => apps.filter((a) => a.jobId === x.id).length)))).join('')}</section>`;
    } else {
      const cs = D().users.filter((x) => x.role === 'recruiter'), cnt = cs.map((x) => [x.company.name, recApps(x.id).length]);
      const studs = D().users.filter((x) => x.role === 'student');
      third = `<section class="card"><h2>Applications per company</h2>${cnt.sort((a, b) => b[1] - a[1]).map(([n, v]) => bar(n, v, Math.max(1, ...cnt.map((x) => x[1])))).join('')}</section>
        <section class="card"><h2>Demand and supply of skills</h2><small>Listings asking for the skill, against students who have it.</small>${Logic.topSkills(live(), 6).map(([s, n]) => { const sup = studs.filter((x) => Logic.studentSkillSet(x).has(s)).length; return bar(s, n, live().length, ' listings', '') + bar('', sup, studs.length, ' students', 'good'); }).join('')}</section>`;
    }
    return `<div class="stats"><div><strong>${apps.length}</strong><span>applications</span></div><div><strong>${c.Selected}</strong><span>selected</span></div><div><strong>${c.Rejected}</strong><span>rejected</span></div><div><strong>${rate === null ? 'n/a' : rate + '%'}</strong><span>selection rate</span></div><div><strong>${resp === null ? 'n/a' : resp + 'd'}</strong><span>avg days to first reply</span></div></div>
    <div class="cols"><section class="card"><h2>Where applications stand</h2>${STATUSES.map((s) => bar(s, c[s], mx, apps.length ? ` · ${Math.round((c[s] / apps.length) * 100)}%` : '', 's-' + s.toLowerCase())).join('')}</section>
    <section class="card"><h2>Applications per month</h2>${monthChart(Logic.byMonth(apps))}</section></div>
    <div class="cols">${third}</div>
    <section class="card tablewrap"><h2>By field</h2><table><thead><tr><th>Field</th><th>Applications</th><th>Selected</th><th>Rejected</th><th>Selection rate</th></tr></thead><tbody>${cats.map((x) => `<tr><td>${x.k}</td><td>${x.n}</td><td>${x.sel}</td><td>${x.rej}</td><td>${x.rate === null ? 'n/a' : x.rate + '%'}</td></tr>`).join('') || '<tr><td colspan="5">No data yet</td></tr>'}</tbody></table></section>`;
  }

  function notifView(u) {
    const list = D().notifications.filter((n) => n.userId === u.id).sort((a, b) => b.at - a.at);
    return `<div class="bar-actions"><button class="btn ghost" data-act="readall">Mark all as read</button></div><section class="card">${list.map((n) => `<div class="note ${n.read ? '' : 'new'}">${esc(n.text)}<small>${fmtDT(n.at)}</small></div>`).join('') || empty('No notifications yet')}</section>`;
  }

  /* ---------------- modals ---------------- */
  function modalView(u) {
    const m = S.modal; let body = '';
    if (m.type === 'job') {
      const j = job(m.id), a = Logic.analyse(j, u), applied = myApps(u.id).find((x) => x.jobId === j.id), have = Logic.studentSkillSet(u);
      body = `<h2>${esc(j.title)}</h2><p class="sub">${esc(cname(j))} · ${esc(j.location)} · ${j.mode} · ${j.type}</p>
        <div class="facts"><div><small>Pay</small><b>${esc(j.pay)}</b></div><div><small>Duration</small><b>${esc(j.duration)}</b></div><div><small>Apply by</small><b>${fmt(j.deadline)}</b></div><div><small>Your match</small><b>${match(a.score)}</b></div></div>
        <p>${esc(j.description)}</p><h3>Skills asked for</h3><div class="chips">${chips(j, have)}</div>
        <ul class="tips">${a.missing.length ? `<li>Missing: ${a.missing.map(esc).join(', ')}. See the Skill gap page for ways to pick these up.</li>` : '<li>You have every listed skill.</li>'}${a.profileOnly.length ? `<li>${a.profileOnly.map(esc).join(', ')} is on your profile but not in your resume text. Add it before you apply.</li>` : ''}</ul>
        <div class="modal-foot">${applied ? `<span>${pill(applied.status)} <small>applied ${fmt(applied.appliedAt)}</small></span>` : (isOpen(j) ? `<button class="btn" data-act="applyform" data-id="${j.id}">Apply</button>` : '<small>Applications closed</small>')}<button class="btn ghost" data-act="save" data-id="${j.id}">${u.profile.saved.includes(j.id) ? 'Unsave' : 'Save job'}</button><button class="btn ghost" data-act="closemodal">Close</button></div>`;
    } else if (m.type === 'apply') {
      const j = job(m.id), ok = (u.profile.resumeText || '').trim() || u.profile.resumeFile;
      body = `<h2>Apply to ${esc(j.title)}</h2><p class="sub">${esc(cname(j))}</p>${ok ? `<form data-form="apply" data-id="${j.id}"><label>Resume<input value="${esc(u.profile.resumeFile ? u.profile.resumeFile.name : 'Resume text from profile')}" disabled></label><label>Note to the recruiter (optional)<textarea id="ap-note" name="note" rows="4" placeholder="One or two lines on why this role"></textarea></label><div class="modal-foot"><button class="btn">Send application</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>` : `<p class="banner">Add your resume on the Profile page before applying.</p><div class="modal-foot"><a class="btn" href="#profile" data-act="closemodal">Go to profile</a></div>`}`;
    } else if (m.type === 'newjob') {
      body = `<h2>Post a listing</h2><form data-form="newjob" class="grid2">
        <label class="full">Title<input id="nj-title" name="title" required></label>
        <label>Type<select id="nj-type" name="type"><option>Internship</option><option>Full-time</option></select></label><label>Mode<select id="nj-mode" name="mode"><option>On-site</option><option>Hybrid</option><option>Remote</option></select></label>
        <label>City<input id="nj-loc" name="location" required></label><label>Field<select id="nj-cat" name="category">${CATEGORIES.map((c) => `<option>${c}</option>`).join('')}</select></label>
        <label>Pay (as shown)<input id="nj-pay" name="pay" placeholder="₹20,000 / month" required></label><label>Duration<input id="nj-dur" name="duration" placeholder="6 months"></label>
        <label>Apply by<input id="nj-dl" name="deadline" type="date" required></label><label>Skills (comma separated)<input id="nj-skills" name="skills" list="vocab2" placeholder="React, SQL, Git" required><datalist id="vocab2">${Object.keys(SKILL_VOCAB).map((v) => `<option value="${v}">`).join('')}</datalist></label>
        <label class="full">Description<textarea id="nj-desc" name="description" rows="5" required></textarea></label>
        <div class="modal-foot full"><button class="btn">Publish</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`;
    } else if (m.type === 'student') {
      const s = user(m.id), j = m.job ? job(m.job) : null, have = Logic.studentSkillSet(s), p = s.profile;
      body = `<h2>${esc(s.name)}</h2><p class="sub">${esc(p.degree)} · ${esc(p.college)} · year ${esc(p.year)} · CGPA ${esc(p.cgpa)}</p>${p.about ? `<p>${esc(p.about)}</p>` : ''}
        ${j ? `<h3>Fit for ${esc(j.title)}: ${Logic.analyse(j, s).score}%</h3><div class="chips">${chips(j, have)}</div>` : ''}
        <h3>Skills</h3><div class="chips">${p.skills.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>
        <h3>Resume ${p.resumeFile ? `<small>${esc(p.resumeFile.name)}</small>` : ''}</h3><pre class="resume">${esc(p.resumeText || 'No resume text.')}</pre><div class="modal-foot"><button class="btn ghost" data-act="closemodal">Close</button></div>`;
    } else if (m.type === 'schedule') {
      const a = D().apps.find((x) => x.id === m.id), s = user(a.studentId);
      body = `<h2>Schedule interview</h2><p class="sub">${esc(s.name)} for ${esc(job(a.jobId).title)}</p><form data-form="schedule" data-id="${a.id}"><div class="grid2"><label>Date and time<input id="sc-at" name="at" type="datetime-local" required></label><label>Format<select id="sc-mode" name="mode"><option>Video call</option><option>On-site</option><option>Phone</option></select></label></div><label>Note for the candidate<textarea id="sc-note" name="note" rows="3"></textarea></label><div class="modal-foot"><button class="btn">Send invite</button><button type="button" class="btn ghost" data-act="closemodal">Cancel</button></div></form>`;
    }
    return `<div class="backdrop" data-act="closemodal"><div class="modal" role="dialog" aria-modal="true">${body}</div></div>`;
  }

  /* ---------------- actions ---------------- */
  function login(u) { Store.session(u.id); S.modal = null; S.route = 'dashboard'; location.hash = 'dashboard'; render(); }
  function setStatus(a, status, extra) {
    a.status = status; if (status !== 'Interview') a.interview = null; a.updatedAt = Date.now(); a.history.push({ status, at: a.updatedAt });
    const j = job(a.jobId);
    const msg = { Shortlisted: `${cname(j)} shortlisted you for ${j.title}.`, Interview: `${cname(j)} scheduled your interview for ${j.title}.`, Selected: `Good news: ${cname(j)} selected you for ${j.title}.`, Rejected: `${cname(j)} decided not to move ahead on ${j.title}.`, Applied: `Your application for ${j.title} is back under review.` }[status];
    notify(a.studentId, msg); save();
  }

  const acts = {
    menu() { S.nav = !S.nav; render(); },
    navclose() { S.nav = false; render(); },
    demotoggle() { S.demo = !S.demo; render(); },
    save(el) {
      const u = me(), id = el.dataset.id, p = u.profile;
      if (!job(id)) return;
      const on = p.saved.includes(id);
      p.saved = on ? p.saved.filter((x) => x !== id) : [...p.saved, id];
      save(); toast(on ? 'Removed from saved jobs' : 'Job saved');
      const list = document.getElementById('joblist');
      if (list && !S.modal) list.innerHTML = jobList(u); else render();
    },
    exportcsv() {
      const u = me(), blob = new Blob([applicationsCsv(u)], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'interntrack-applications-' + isoDate(Date.now()) + '.csv';
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Exported ' + myApps(u.id).length + ' applications');
    },
    logout() { Store.session(null); render(); },
    demo(el) { const x = D().users.find((u) => u.email === el.dataset.e && u.pass === Store.hash(el.dataset.p)); if (x && x.active) login(x); else toast('This demo account is disabled. Reset demo data from an admin account.'); },
    authtab(el) { S.authTab = el.dataset.t; render(); },
    openjob(el) { S.modal = { type: 'job', id: el.dataset.id }; render(); },
    applyform(el) { S.modal = { type: 'apply', id: el.dataset.id }; render(); },
    closemodal(el, e) { if (el.classList.contains('backdrop') && e.target !== el) return; S.modal = null; render(); },
    apptab(el) { S.appTab = el.dataset.t; render(); },
    askwithdraw(el) { S.confirm = el.dataset.id; render(); },
    noconfirm() { S.confirm = null; render(); },
    withdraw(el) {
      const u = me(), a = D().apps.find((x) => x.id === el.dataset.id);
      S.confirm = null;
      if (!a || a.studentId !== u.id || a.status === 'Selected' || a.status === 'Rejected') { render(); return; }
      const j = job(a.jobId);
      D().apps = D().apps.filter((x) => x.id !== a.id);
      if (j) notify(j.companyId, `${u.name} withdrew their application for ${j.title}.`);
      save(); toast('Application withdrawn'); render();
    },
    skillcat(el) { S.skillCat = el.dataset.t; render(); },
    addskill(el) { const u = me(); if (!u.profile.skills.includes(el.dataset.s)) u.profile.skills.push(el.dataset.s); save(); toast('Added ' + el.dataset.s + ' to your profile'); render(); },
    rmskill(el) { const u = me(); u.profile.skills = u.profile.skills.filter((s) => s !== el.dataset.s); save(); render(); },
    newjob() { S.modal = { type: 'newjob' }; render(); },
    togglejob(el) { const j = job(el.dataset.id); j.status = j.status === 'open' ? 'closed' : 'open'; save(); toast(j.title + ' is now ' + j.status); render(); },
    seeapps(el) { S.aJob = el.dataset.id; go('applicants'); },
    viewstudent(el) { S.modal = { type: 'student', id: el.dataset.id, job: el.dataset.job }; render(); },
    schedule(el) { S.modal = { type: 'schedule', id: el.dataset.id }; render(); },
    approve(el) { const x = user(el.dataset.id); x.company.approved = !x.company.approved; if (x.company.approved) notify(x.id, 'Your company was approved. Your listings are now visible to students.'); save(); toast(x.company.name + (x.company.approved ? ' approved' : ' approval revoked')); render(); },
    urole(el) { S.uRole = el.dataset.t; render(); },
    toggleuser(el) { const x = user(el.dataset.id); x.active = !x.active; save(); render(); },
    askdel(el) { S.confirm = el.dataset.id; render(); },
    deljob(el) { D().jobs = D().jobs.filter((j) => j.id !== el.dataset.id); D().apps = D().apps.filter((a) => a.jobId !== el.dataset.id); S.confirm = null; save(); toast('Listing removed'); render(); },
    reset() { Store.reset(); Store.session(null); S.route = 'dashboard'; location.hash = 'dashboard'; render(); toast('Demo data restored'); },
    readall() { D().notifications.forEach((n) => { if (n.userId === Store.session()) n.read = true; }); save(); render(); }
  };

  const forms = {
    login(f) {
      const e = f.get('email').trim().toLowerCase(), x = D().users.find((u) => u.email === e && u.pass === Store.hash(f.get('password')));
      const err = document.getElementById('auth-err');
      if (!x) { err.textContent = 'Email or password is wrong.'; err.hidden = false; return; }
      if (!x.active) { err.textContent = 'This account has been disabled. Contact the placement cell.'; err.hidden = false; return; }
      login(x);
    },
    register(f) {
      const e = f.get('email').trim().toLowerCase(), err = document.getElementById('auth-err');
      if (D().users.some((u) => u.email === e)) { err.textContent = 'That email already has an account.'; err.hidden = false; return; }
      const base = { id: Store.uid('u'), role: f.get('role'), name: f.get('name').trim(), email: e, pass: Store.hash(f.get('password')), active: true, createdAt: Date.now() };
      if (base.role === 'student') base.profile = { college: f.get('extra').trim(), degree: '', year: 3, cgpa: '', skills: [], interests: { categories: [], locations: [], type: 'Internship' }, github: '', about: '', resumeText: '', resumeFile: null };
      else base.company = { name: f.get('extra').trim(), city: '', about: '', approved: false };
      D().users.push(base);
      if (base.role === 'student') D().prep[base.id] = { items: Object.entries(Seed.PREP_TEMPLATE).flatMap(([topic, l]) => l.map((title) => ({ id: Store.uid('p'), topic, title, done: false }))), mocks: [] };
      D().users.filter((u) => u.role === 'admin').forEach((a) => notify(a.id, `${base.role === 'student' ? 'New student' : 'New company awaiting approval'}: ${base.role === 'student' ? base.name : base.company.name}.`));
      save(); login(base);
    },
    apply(f, el) {
      const u = me(), j = job(el.dataset.id), t = Date.now();
      if (!j || !isOpen(j)) { S.modal = null; toast('This listing is no longer open'); render(); return; }
      if (myApps(u.id).some((a) => a.jobId === j.id)) { S.modal = null; toast('You have already applied to this job'); render(); return; }
      D().apps.push({ id: Store.uid('a'), jobId: j.id, studentId: u.id, status: 'Applied', appliedAt: t, updatedAt: t, note: f.get('note').trim(), history: [{ status: 'Applied', at: t }], interview: null });
      notify(u.id, `Your application for ${j.title} was received by ${cname(j)}.`); notify(j.companyId, `${u.name} applied for ${j.title}.`);
      S.modal = null; save(); toast('Application sent'); go('applications');
    },
    profile(f) {
      const u = me(), p = u.profile; u.name = f.get('name').trim() || u.name;
      Object.assign(p, { college: f.get('college').trim(), degree: f.get('degree').trim(), year: f.get('year'), cgpa: f.get('cgpa'), github: f.get('github').trim(), about: f.get('about').trim() });
      p.interests = { categories: f.getAll('cats'), locations: f.get('locs').split(',').map((x) => x.trim()).filter(Boolean), type: f.get('type') };
      save(); toast('Profile saved'); render();
    },
    skill(f) { const u = me(), s = f.get('skill').trim(); const canon = Object.keys(SKILL_VOCAB).find((k) => k.toLowerCase() === s.toLowerCase()) || s; if (!u.profile.skills.includes(canon)) u.profile.skills.push(canon); save(); render(); },
    resume(f) { const u = me(); u.profile.resumeText = f.get('text'); save(); toast('Resume text saved'); render(); },
    prepadd(f) { D().prep[me().id].items.push({ id: Store.uid('p'), topic: f.get('topic'), title: f.get('title').trim(), done: false }); save(); render(); },
    mock(f) { D().prep[me().id].mocks.push({ id: Store.uid('m'), with: f.get('with').trim(), kind: f.get('kind'), notes: f.get('notes').trim(), date: Date.now() }); save(); toast('Mock interview logged'); render(); },
    newjob(f) {
      const u = me();
      if (!(new Date(f.get('deadline')).getTime() + 86400000 > Date.now())) { toast('Pick a deadline that is today or later'); return; }
      const skills = f.get('skills').split(',').map((s) => s.trim()).filter(Boolean).map((s) => Object.keys(SKILL_VOCAB).find((k) => k.toLowerCase() === s.toLowerCase()) || s);
      D().jobs.push({ id: Store.uid('j'), companyId: u.id, title: f.get('title').trim(), type: f.get('type'), mode: f.get('mode'), location: f.get('location').trim(), category: f.get('category'), pay: f.get('pay').trim(), payNum: parseInt(f.get('pay').replace(/[^\d]/g, ''), 10) || 0, duration: f.get('duration') || '', deadline: new Date(f.get('deadline')).getTime(), skills, description: f.get('description').trim(), postedAt: Date.now(), status: 'open' });
      S.modal = null; save(); toast(u.company.approved ? 'Listing published' : 'Saved. It will show to students after approval.'); render();
    },
    schedule(f, el) {
      const a = D().apps.find((x) => x.id === el.dataset.id);
      a.interview = { at: new Date(f.get('at')).getTime(), mode: f.get('mode'), note: f.get('note').trim() };
      setStatus(a, 'Interview'); S.modal = null; toast('Invite sent to ' + user(a.studentId).name); render();
    }
  };

  const changes = {
    prep(el) { const it = D().prep[me().id].items.find((i) => i.id === el.dataset.id); it.done = el.checked; save(); render(); },
    status(el) {
      const a = D().apps.find((x) => x.id === el.dataset.id);
      if (!a || el.value === a.status) { render(); return; }
      if (el.value === 'Interview') { S.modal = { type: 'schedule', id: a.id }; render(); return; }
      setStatus(a, el.value); toast('Moved to ' + el.value + '. The student has been notified.'); render();
    },
    file(el) {
      const f = el.files[0]; if (!f) return; const u = me();
      el.value = '';
      if (f.size > 1048576) { toast('That file is over 1 MB'); return; }
      const done = (text, msg) => { u.profile.resumeFile = { name: f.name, size: f.size }; if (text !== null) u.profile.resumeText = text; save(); toast(msg); render(); };
      if (/\.(txt|md)$/i.test(f.name)) {
        const rd = new FileReader();
        rd.onload = () => done(String(rd.result), 'Resume uploaded and read');
        rd.onerror = () => toast('Could not read that file');
        rd.readAsText(f);
      } else if (/\.pdf$/i.test(f.name)) {
        toast('Reading PDF...');
        PdfText.extract(f).then((r) => done(r.text, 'Read ' + r.pages + ' page' + (r.pages === 1 ? '' : 's') + ' from your PDF. Check the text below.'))
          .catch((err) => done(null, err.message || 'Could not read that PDF. Paste the text instead.'));
      } else toast('Only PDF, TXT or MD files are supported.');
    }
  };

  const inputs = {
    q: (v, u) => { S.q = v; document.getElementById('joblist').innerHTML = jobList(u); },
    type: (v, u) => { S.type = v; document.getElementById('joblist').innerHTML = jobList(u); },
    mode: (v, u) => { S.mode = v; document.getElementById('joblist').innerHTML = jobList(u); },
    cat: (v, u) => { S.cat = v; document.getElementById('joblist').innerHTML = jobList(u); },
    sort: (v, u) => { S.sort = v; document.getElementById('joblist').innerHTML = jobList(u); },
    rcText: (v, u) => { S.rcText = v; document.getElementById('rc-out').innerHTML = resumeOut(u); },
    rcJob: (v) => { S.rcJob = v; render(); },
    aJob: (v) => { S.aJob = v; render(); },
    aStatus: (v) => { S.aStatus = v; render(); },
    regrole: (v) => { const l = document.getElementById('r-extra-l'); l.firstChild.textContent = v === 'student' ? 'College' : 'Company name'; }
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.tagName === 'A' && el.dataset.act === 'closemodal') { S.modal = null; return; }
    if (acts[el.dataset.act]) acts[el.dataset.act](el, e);
  });
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); forms[f.dataset.form](new FormData(f), f); });
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-input]'); if (el && inputs[el.dataset.input]) inputs[el.dataset.input](el.value, me()); });
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-change]'); if (el && changes[el.dataset.change]) changes[el.dataset.change](el); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && S.modal) { S.modal = null; render(); } });

  S.route = location.hash.slice(1) || 'dashboard';
  render();
})();

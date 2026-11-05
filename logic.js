/*
 * logic.js
 * Resume keyword matching, skill-gap analysis, recommendations, analytics.
 * Pure functions: they take data in and return numbers/lists, no DOM.
 */
const Logic = (() => {
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // one regex per skill, matching the canonical name or any alias as a whole word
  const matchers = Object.entries(SKILL_VOCAB).map(([skill, aliases]) => {
    const terms = [skill.toLowerCase(), ...aliases].sort((a, b) => b.length - a.length);
    const re = new RegExp('(?<![a-z0-9+#.])(?:' + terms.map(escRe).join('|') + ')(?![a-z0-9+#])', 'i');
    return { skill, re };
  });

  function extractSkills(text) {
    if (!text) return [];
    return matchers.filter((m) => m.re.test(text)).map((m) => m.skill);
  }

  const STOP = new Set(('about above after again also among because been before being between both can could does doing during each '
    + 'from have having here into just like make many more most much must only other over same should some such than that their them '
    + 'then there these they this those through under until very want were what when where which while will with would your you our '
    + 'work working team teams role join looking strong good great ability skills skill experience knowledge understanding basic '
    + 'candidate candidates required requirement requirements responsibilities preferred intern internship').split(' '));

  // most repeated meaningful words in a text, used for the free-text resume check
  function keywordsFromText(text, n = 14) {
    const counts = {};
    (text.toLowerCase().match(/[a-z][a-z+#.\-]{3,}/g) || []).forEach((w) => {
      w = w.replace(/[.\-]+$/, '');
      if (w.length < 4 || STOP.has(w)) return;
      counts[w] = (counts[w] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map((e) => e[0]);
  }

  function resumeSkills(student) { return new Set(extractSkills(student.profile.resumeText || '')); }

  // everything we can credit the student with: profile skills + anything found in the resume text
  function studentSkillSet(student) {
    const set = new Set(student.profile.skills || []);
    resumeSkills(student).forEach((s) => set.add(s));
    return set;
  }

  // match a student against a listing
  function analyse(job, student) {
    const have = studentSkillSet(student);
    const fromResume = resumeSkills(student);
    const req = job.skills || [];
    const matched = req.filter((s) => have.has(s));
    const missing = req.filter((s) => !have.has(s));
    const kw = extractSkills(job.title + ' ' + job.description).filter((s) => !req.includes(s));
    const kwHit = kw.filter((s) => have.has(s));
    const reqPct = req.length ? matched.length / req.length : 1;
    const kwPct = kw.length ? kwHit.length / kw.length : reqPct;
    const score = Math.round((reqPct * 0.75 + kwPct * 0.25) * 100);
    const hasResume = !!(student.profile.resumeText || '').trim();
    const profileOnly = hasResume ? matched.filter((s) => !fromResume.has(s)) : [];
    const parts = [
      part('Required skills you have', 75, reqPct, req.length ? matched.length + ' of ' + req.length : 'none listed'),
      part('Other skills in the description', 25, kwPct, kw.length ? kwHit.length + ' of ' + kw.length : 'none, uses the result above')
    ];
    return { score, matched, missing, kw, kwHit, profileOnly, hasResume, parts };
  }

  // one line of the score breakdown: weight is out of 100, points is what it adds to the final score
  function part(label, weight, pct, detail) {
    return { label, weight, detail, points: Math.round(pct * weight * 10) / 10 };
  }

  // check a resume against any pasted job description
  function checkText(jdText, student) {
    const resume = student.profile.resumeText || '';
    const jdSkills = extractSkills(jdText);
    const rSkills = new Set(extractSkills(resume));
    const matched = jdSkills.filter((s) => rSkills.has(s));
    const missing = jdSkills.filter((s) => !rSkills.has(s));
    const lowResume = resume.toLowerCase();
    const jdWords = keywordsFromText(jdText, 16).filter((w) => !jdSkills.some((s) => s.toLowerCase() === w));
    const wordHit = jdWords.filter((w) => lowResume.includes(w));
    const wordMiss = jdWords.filter((w) => !lowResume.includes(w));
    const skillPct = jdSkills.length ? matched.length / jdSkills.length : 0;
    const wordPct = jdWords.length ? wordHit.length / jdWords.length : 0;
    const score = jdSkills.length || jdWords.length ? Math.round((skillPct * 0.7 + wordPct * 0.3) * 100) : 0;
    const profileOnly = (student.profile.skills || []).filter((s) => jdSkills.includes(s) && !rSkills.has(s));
    const parts = [
      part('Skills from the description found in your resume', 70, skillPct, jdSkills.length ? matched.length + ' of ' + jdSkills.length : 'no known skills found in the description'),
      part('Other repeated keywords found in your resume', 30, wordPct, jdWords.length ? wordHit.length + ' of ' + jdWords.length : 'no repeated keywords')
    ];
    return { score, jdSkills, matched, missing, wordHit, wordMiss, profileOnly, parts, resumeWords: resume.trim() ? resume.trim().split(/\s+/).length : 0 };
  }

  const daysAgo = (ts) => (Date.now() - ts) / 86400000;

  // personalised ranking: match 70, preferred category 15, preferred location/mode 10, freshness 5
  function recommend(student, jobs, appliedJobIds, limit = 5) {
    const p = student.profile;
    const cats = p.interests?.categories || [];
    const locs = (p.interests?.locations || []).map((l) => l.toLowerCase());
    const type = p.interests?.type || '';
    return jobs
      .filter((j) => !appliedJobIds.has(j.id))
      .map((job) => {
        const a = analyse(job, student);
        const catHit = cats.includes(job.category);
        const locHit = locs.some((l) => job.location.toLowerCase().includes(l) || (l === 'remote' && job.mode === 'Remote'));
        const typeHit = !type || job.type === type;
        let rank = a.score * 0.7 + (catHit ? 15 : 0) + (locHit ? 10 : 0) + Math.max(0, 5 - daysAgo(job.postedAt) / 6);
        if (!typeHit) rank -= 12;
        const why = [];
        if (a.matched.length) why.push('You already have ' + a.matched.slice(0, 3).join(', '));
        if (catHit) why.push('in your preferred field');
        if (locHit) why.push('where you want to work');
        return { job, analysis: a, rank, why: why.join(', ') };
      })
      .sort((x, y) => y.rank - x.rank)
      .slice(0, limit);
  }

  // which skills does a category ask for, and how many of them does this student have
  function skillGap(student, category, jobs) {
    const list = jobs.filter((j) => j.category === category);
    const have = studentSkillSet(student);
    const counts = {};
    list.forEach((j) => j.skills.forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
    const rows = Object.entries(counts)
      .map(([skill, n]) => ({ skill, n, demand: n / (list.length || 1), have: have.has(skill) }))
      .sort((a, b) => b.n - a.n || a.skill.localeCompare(b.skill));
    const total = rows.reduce((t, r) => t + r.demand, 0);
    const got = rows.filter((r) => r.have).reduce((t, r) => t + r.demand, 0);
    const missing = rows.filter((r) => !r.have);
    const next = missing[0] || null;
    const unlocks = next ? list.filter((j) => j.skills.includes(next.skill)).length : 0;
    return { listings: list.length, rows, coverage: total ? Math.round((got / total) * 100) : 0, next, unlocks };
  }

  // ---- analytics ----
  function statusCounts(apps) {
    const c = {}; STATUSES.forEach((s) => (c[s] = 0));
    apps.forEach((a) => { c[a.status] = (c[a.status] || 0) + 1; });
    return c;
  }

  function selectionRate(apps) {
    const c = statusCounts(apps);
    const decided = c.Selected + c.Rejected;
    return decided ? Math.round((c.Selected / decided) * 100) : null;
  }

  function byMonth(apps, n = 6) {
    const now = new Date();
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ key: d.getFullYear() * 12 + d.getMonth(), label: d.toLocaleString('en-IN', { month: 'short' }), count: 0 });
    }
    apps.forEach((a) => {
      const d = new Date(a.appliedAt);
      const hit = out.find((m) => m.key === d.getFullYear() * 12 + d.getMonth());
      if (hit) hit.count++;
    });
    return out;
  }

  function topSkills(jobs, n = 8) {
    const counts = {};
    jobs.forEach((j) => j.skills.forEach((s) => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
  }

  function avgResponseDays(apps) {
    const gaps = apps.filter((a) => a.history.length > 1).map((a) => (a.history[1].at - a.history[0].at) / 86400000);
    return gaps.length ? Math.round((gaps.reduce((t, g) => t + g, 0) / gaps.length) * 10) / 10 : null;
  }

  // ---- resume structure feedback ----
  const HEAD_RE = /^\s*(?:technical\s+)?(skills?|projects?|academic projects?|education|academics|work experience|experience|internships?|achievements|certifications?|summary|objective)\s*:?\s*$/i;

  function splitSections(text) {
    const sec = { header: [] };
    let cur = 'header';
    (text || '').split(/\r?\n/).forEach((line) => {
      const m = line.match(HEAD_RE);
      if (m) {
        const w = m[1].toLowerCase();
        cur = /skill/.test(w) ? 'skills' : /project/.test(w) ? 'projects' : /educ|academ/.test(w) ? 'education' : /experience|internship/.test(w) ? 'experience' : w;
        sec[cur] = sec[cur] || [];
      } else sec[cur].push(line);
    });
    return Object.fromEntries(Object.entries(sec).map(([k, v]) => [k, v.join('\n').trim()]));
  }

  // Rule-based checks, not machine learning. Each note says what was looked for.
  function sectionFeedback(resumeText) {
    const text = resumeText || '';
    const sec = splitSections(text);
    const lines = (k) => (sec[k] || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const out = [];
    const grade = (notes, found, goodWhen) => (!found ? 'bad' : goodWhen ? 'good' : 'warn');

    // skills
    const skillsFound = extractSkills(text).length;
    const sNotes = [];
    if (!sec.skills) sNotes.push('No "Skills" heading found. A short, separate skills section is the first thing keyword scanners and recruiters look for.');
    if (skillsFound < 6) sNotes.push('Only ' + skillsFound + ' recognised skill' + (skillsFound === 1 ? '' : 's') + ' in the whole resume. List the tools you have really used.');
    else sNotes.push(skillsFound + ' recognised skills found across the resume.');
    out.push({ key: 'skills', label: 'Skills', status: grade(sNotes, !!sec.skills || skillsFound > 0, !!sec.skills && skillsFound >= 6), notes: sNotes });

    // projects
    const pl = lines('projects');
    const pNotes = [];
    if (!pl.length) pNotes.push('No "Projects" section found. For a first internship, projects are your main proof of skill.');
    else {
      if (pl.length < 2) pNotes.push('Only ' + pl.length + ' project line. Aim for two or three.');
      if (pl.filter((l) => extractSkills(l).length).length < pl.length) pNotes.push('Some project lines do not name the technologies used.');
      if (!pl.some((l) => /\d/.test(l))) pNotes.push('No numbers in your projects. Add one result: users, data size, speed-up, test count.');
      if (!/github\.com|https?:\/\//i.test(sec.projects)) pNotes.push('No GitHub or demo link in the projects section.');
    }
    out.push({ key: 'projects', label: 'Projects', status: grade(pNotes, pl.length > 0, pl.length >= 2 && !pNotes.length), notes: pNotes.length ? pNotes : ['Projects name their technologies and include a result and a link.'] });

    // education
    const eduFound = !!sec.education || /\b(b\.?tech|b\.?e\.?|b\.?sc|bba|b\.?com|m\.?tech|university|institute|college)\b/i.test(text);
    const eNotes = [];
    if (!eduFound) eNotes.push('No education details found. Add your degree, college and expected graduation year.');
    else {
      if (!/20\d\d/.test(sec.education || text)) eNotes.push('No graduation year found.');
      if (!/cgpa|gpa|\d\s?%|percentage/i.test(sec.education || text)) eNotes.push('No CGPA or percentage. Add it if it helps you.');
    }
    out.push({ key: 'education', label: 'Education', status: grade(eNotes, eduFound, eduFound && !eNotes.length), notes: eNotes.length ? eNotes : ['Degree, college and year are present.'] });

    // experience
    const xl = lines('experience');
    const xNotes = [];
    if (!xl.length) xNotes.push('No experience section. If this is your first internship, add club roles, workshops, hackathons or volunteering.');
    else if (!xl.some((l) => /\d/.test(l))) xNotes.push('Add a number to at least one line (people taught, events run, hours, users).');
    out.push({ key: 'experience', label: 'Experience', status: xl.length ? (xNotes.length ? 'warn' : 'good') : 'warn', notes: xNotes.length ? xNotes : ['Experience section present with measurable detail.'] });
    return out;
  }

  // how complete is a student profile, and what is missing
  function profileCompleteness(student) {
    const p = student.profile;
    const checks = [
      ['College', !!p.college], ['Degree', !!p.degree], ['At least 3 skills', (p.skills || []).length >= 3],
      ['Resume text', !!(p.resumeText || '').trim()], ['Preferred fields', (p.interests?.categories || []).length > 0],
      ['Short intro', !!p.about], ['GitHub link', !!p.github]
    ];
    const done = checks.filter((c) => c[1]).length;
    return { pct: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[1]).map((c) => c[0]) };
  }

  return { sectionFeedback, profileCompleteness, extractSkills, keywordsFromText, analyse, checkText, recommend, skillGap, statusCounts, selectionRate, byMonth, topSkills, avgResponseDays, studentSkillSet };
})();

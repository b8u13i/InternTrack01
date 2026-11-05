/*
 * seed.js
 * Builds the demo database: 1 admin, 6 companies, 12 students, ~17 listings and a few
 * months of applications. Dates are relative to "now" so the demo never looks stale.
 */
const Seed = (() => {
  const DAY = 86400000;

  // small seeded random generator so the demo data is the same every reset
  function rng(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const COMPANIES = [
    { id: 'c1', person: 'Ritu Sharma', email: 'hr@kiranastack.demo', name: 'Kiranastack Technologies', city: 'Bengaluru', about: 'Billing and inventory software for small shops.', approved: true },
    { id: 'c2', person: 'Sandeep Patil', email: 'talent@brightwell.demo', name: 'Brightwell Analytics', city: 'Pune', about: 'Analytics consulting for retail and logistics teams.', approved: true },
    { id: 'c3', person: 'Farah Khan', email: 'people@orchardcloud.demo', name: 'Orchard Cloud', city: 'Hyderabad', about: 'Managed cloud hosting for mid-size companies.', approved: true },
    { id: 'c4', person: 'Gokul Raj', email: 'hello@paperkite.demo', name: 'Paperkite Studio', city: 'Chennai', about: 'Small design and content studio.', approved: true },
    { id: 'c5', person: 'Neha Bansal', email: 'campus@northgate.demo', name: 'Northgate Fintech', city: 'Mumbai', about: 'Payments and lending tools for banks.', approved: true },
    { id: 'c6', person: 'Dr. Vivek Rao', email: 'lab@tatviklabs.demo', name: 'Tatvik Labs', city: 'Bengaluru', about: 'Applied research lab working on language tools.', approved: false }
  ];

  const JOBS = [
    ['j1', 'c1', 'Frontend Developer Intern', 'Internship', 'Hybrid', 'Bengaluru', 'Web Development', '₹25,000 / month', 25000, '6 months', 18, ['JavaScript', 'React', 'HTML/CSS', 'Git', 'REST APIs'],
      'Help build the dashboard our shop owners use every day. You will turn Figma screens into responsive React components, fix UI bugs and call our REST APIs. Reviews happen in pull requests on Git, and you will pair with a senior developer twice a week. Knowing unit testing is a plus.', 6, 'open'],
    ['j2', 'c1', 'Backend Developer Intern', 'Internship', 'Remote', 'Remote', 'Web Development', '₹22,000 / month', 22000, '6 months', 25, ['Node.js', 'SQL', 'REST APIs', 'Git', 'MongoDB'],
      'Work on the services behind our billing app. You will write Node.js endpoints, design SQL tables, and move a few reports from MongoDB to PostgreSQL. Expect code review on every change and some on-call shadowing. Testing habits matter here.', 9, 'open'],
    ['j3', 'c5', 'Graduate Software Engineer', 'Full-time', 'On-site', 'Mumbai', 'Web Development', '₹6.5 LPA', 54000, 'Permanent', 40, ['Java', 'Data Structures', 'SQL', 'Git', 'Problem Solving'],
      'Join the payments core team after graduation. You will write Java services, work through data structures and algorithms problems in design reviews, and learn how a bank-grade system is built. Agile sprints, daily stand-ups, strong SQL needed.', 12, 'open'],
    ['j4', 'c2', 'Data Analyst Intern', 'Internship', 'Hybrid', 'Pune', 'Data & AI', '₹20,000 / month', 20000, '4 months', 14, ['SQL', 'Excel', 'Python', 'Pandas', 'Data Visualization'],
      'Clean retail sales data, answer questions from account managers and build weekly dashboards. You will write SQL against our warehouse, use Pandas for the messy parts and present the findings to the client team. Statistics basics and Tableau are good to have.', 4, 'open'],
    ['j5', 'c2', 'Machine Learning Intern', 'Internship', 'Remote', 'Remote', 'Data & AI', '₹30,000 / month', 30000, '6 months', 21, ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'Statistics'],
      'Prototype demand forecasting models. You will use Python, NumPy and scikit-learn, evaluate models with proper statistics and write short notes on what worked. Some deep learning with PyTorch if you are curious. Strong communication needed, you will present every two weeks.', 8, 'open'],
    ['j6', 'c2', 'Junior Data Scientist', 'Full-time', 'On-site', 'Pune', 'Data & AI', '₹8 LPA', 66000, 'Permanent', 45, ['Python', 'Machine Learning', 'SQL', 'Statistics', 'Pandas'],
      'Own a forecasting project end to end: pull data with SQL, model it in Python, and explain the results to non-technical clients. We use Pandas, scikit-learn and Power BI dashboards. Looking for someone who likes statistics and clear writing.', 15, 'open'],
    ['j7', 'c3', 'Cloud Support Intern', 'Internship', 'On-site', 'Hyderabad', 'Cloud & DevOps', '₹18,000 / month', 18000, '3 months', 12, ['Linux', 'AWS', 'Docker', 'Git'],
      'Handle first-line tickets for customers running on our cloud. You will use Linux commands daily, check AWS consoles, restart Docker containers and write short runbooks. Shift timings are 10 to 7. Basic bash scripting helps.', 3, 'open'],
    ['j8', 'c3', 'DevOps Engineer Intern', 'Internship', 'Remote', 'Remote', 'Cloud & DevOps', '₹24,000 / month', 24000, '6 months', 30, ['Docker', 'Linux', 'AWS', 'CI/CD', 'Python'],
      'Help the platform team automate deployments. You will write CI/CD pipelines with GitHub Actions, containerise small services with Docker, and script routine checks in Python. Good fit if you enjoy Linux and breaking things in staging.', 10, 'open'],
    ['j9', 'c5', 'Flutter Developer Intern', 'Internship', 'Hybrid', 'Mumbai', 'Mobile', '₹20,000 / month', 20000, '5 months', 16, ['Flutter', 'Git', 'REST APIs', 'Testing'],
      'Build screens for our customer-facing loan app in Flutter. You will integrate REST APIs, write widget tests and work with designers on Figma handoffs. Responsive layouts for small phones are important.', 7, 'open'],
    ['j10', 'c5', 'Android Developer Intern', 'Internship', 'Remote', 'Remote', 'Mobile', '₹18,000 / month', 18000, '4 months', 22, ['Android', 'Java', 'Git', 'REST APIs'],
      'Maintain features in our Android app. You will write Kotlin and Java, fix crashes from the field and consume REST APIs. Mentor-led, with a small project of your own at the end.', 11, 'open'],
    ['j11', 'c4', 'Product Design Intern', 'Internship', 'Hybrid', 'Chennai', 'Design', '₹15,000 / month', 15000, '3 months', 10, ['Figma', 'UI/UX Design', 'Communication'],
      'Design screens for client apps. You will do wireframing and prototyping in Figma, run small user research sessions and present your work to clients. Portfolio link required.', 5, 'open'],
    ['j12', 'c4', 'Content and SEO Intern', 'Internship', 'Remote', 'Remote', 'Business & Marketing', '₹10,000 / month', 10000, '3 months', 20, ['Content Writing', 'SEO', 'Digital Marketing', 'Communication'],
      'Write blogs for clients, research keywords and track campaigns. You will learn SEO basics, social media marketing and how to report results with simple charts. Clear writing matters more than tools.', 13, 'open'],
    ['j13', 'c5', 'Business Analyst Intern', 'Internship', 'On-site', 'Mumbai', 'Business & Marketing', '₹18,000 / month', 18000, '4 months', 17, ['Excel', 'SQL', 'Power BI', 'Communication'],
      'Support the lending team with weekly reports. You will write SQL queries, build Excel models and Power BI dashboards, and present numbers in meetings. Agile ceremonies once a week.', 6, 'open'],
    ['j14', 'c1', 'Full Stack Developer', 'Full-time', 'Hybrid', 'Bengaluru', 'Web Development', '₹9 LPA', 75000, 'Permanent', 35, ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git'],
      'Own features from database to screen. You will write TypeScript on both sides, use React for the front end, Node.js for APIs and PostgreSQL for storage. CI/CD through GitHub Actions, unit tests expected, agile team of 7.', 20, 'open'],
    ['j15', 'c4', 'UI Developer Intern', 'Internship', 'On-site', 'Chennai', 'Web Development', '₹15,000 / month', 15000, '3 months', 13, ['HTML/CSS', 'JavaScript', 'Figma', 'Git', 'Responsive Design'],
      'Turn studio designs into clean, responsive pages. You will write HTML, CSS and JavaScript, check layouts on phones, and work with designers on Figma files. Git for all work, small pull requests.', 8, 'open'],
    ['j16', 'c6', 'Research Intern, Language Tools', 'Internship', 'On-site', 'Bengaluru', 'Data & AI', '₹15,000 / month', 15000, '6 months', 30, ['Python', 'Machine Learning', 'Deep Learning'],
      'Help build datasets and baseline models for Indian-language text. Python, PyTorch and a lot of reading. Suited to people who want to continue into research.', 2, 'open'],
    ['j17', 'c1', 'QA Intern', 'Internship', 'On-site', 'Bengaluru', 'Web Development', '₹12,000 / month', 12000, '3 months', -5, ['Testing', 'SQL', 'Communication'],
      'Test releases of the billing app, write test cases and report bugs clearly. Basic SQL to verify data. Applications closed.', 48, 'closed']
  ];

  const STUDENTS = [
    ['s1', 'Meera Nair', 'meera@student.demo', 'Anna University', 'B.E. Computer Science', 3, 8.4, 'web'],
    ['s2', 'Rohan Mehta', 'rohan.m@student.demo', 'PES University', 'B.Tech CSE', 4, 7.9, 'web'],
    ['s3', 'Ananya Iyer', 'ananya@student.demo', 'VIT Vellore', 'B.Tech IT', 3, 8.8, 'data'],
    ['s4', 'Karthik Raman', 'karthik@student.demo', 'NIT Trichy', 'B.Tech CSE', 4, 8.1, 'ml'],
    ['s5', 'Sneha Kulkarni', 'sneha@student.demo', 'COEP Pune', 'B.Tech Computer', 4, 7.6, 'data'],
    ['s6', 'Imran Sheikh', 'imran@student.demo', 'Osmania University', 'B.E. CSE', 3, 7.2, 'cloud'],
    ['s7', 'Divya Prakash', 'divya@student.demo', 'SRM Institute', 'B.Tech CSE', 3, 8.0, 'mobile'],
    ['s8', 'Arjun Reddy', 'arjun@student.demo', 'JNTU Hyderabad', 'B.Tech ECE', 4, 7.4, 'cloud'],
    ['s9', 'Pooja Deshmukh', 'pooja@student.demo', 'Symbiosis Pune', 'BBA', 3, 8.2, 'biz'],
    ['s10', 'Nikhil Joshi', 'nikhil@student.demo', 'BITS Pilani', 'B.E. CSE', 4, 8.6, 'web'],
    ['s11', 'Lakshmi Menon', 'lakshmi@student.demo', 'CUSAT Kochi', 'B.Tech CSE', 3, 8.3, 'design'],
    ['s12', 'Farhan Qureshi', 'farhan@student.demo', 'Mumbai University', 'B.Sc IT', 3, 7.1, 'mobile']
  ];

  const ARCH = {
    web:    { cat: 'Web Development', skills: ['JavaScript', 'React', 'HTML/CSS', 'Git', 'Node.js'], proj: 'a MERN stack notes app and a portfolio site' },
    data:   { cat: 'Data & AI', skills: ['Python', 'SQL', 'Pandas', 'Statistics', 'Excel'], proj: 'a sales dashboard and a cricket stats analysis' },
    ml:     { cat: 'Data & AI', skills: ['Python', 'Machine Learning', 'NumPy', 'Pandas', 'Deep Learning'], proj: 'a spam classifier and an image tagger using PyTorch' },
    cloud:  { cat: 'Cloud & DevOps', skills: ['Linux', 'Docker', 'Git', 'Python'], proj: 'a home lab with Docker and a bash backup script' },
    mobile: { cat: 'Mobile', skills: ['Flutter', 'Git', 'REST APIs'], proj: 'a Flutter expense app using a public REST API' },
    design: { cat: 'Design', skills: ['Figma', 'UI/UX Design', 'Communication'], proj: 'three app redesign case studies' },
    biz:    { cat: 'Business & Marketing', skills: ['Excel', 'Communication', 'Digital Marketing'], proj: 'a social media campaign for a college fest' }
  };

  const PREP_TEMPLATE = {
    'Data structures and algorithms': ['Arrays and strings', 'Linked lists', 'Stacks and queues', 'Trees and graphs', 'Recursion and dynamic programming', 'Sorting and searching'],
    'Computer science basics': ['DBMS and SQL queries', 'Operating systems basics', 'Computer networks basics', 'OOP concepts'],
    'Projects and resume': ['Two projects on GitHub with a proper README', 'Resume reviewed by a senior', 'LinkedIn profile updated'],
    'Aptitude and HR': ['Quant and logical reasoning practice', 'Tell me about yourself', 'Strengths, weaknesses and a conflict story', 'Questions to ask the interviewer']
  };

  const MEERA_RESUME = `Meera Nair
B.E. Computer Science, Anna University (2027)

Skills
JavaScript, React, HTML, CSS, Git, Python, SQL

Projects
CampusSwap - a marketplace for second-hand books built with React and a Firebase backend. Responsive layout, search and filters.
Expense Tracker - Python script that reads bank CSV exports and builds monthly summaries with charts.
Library Management - SQL schema design and queries for a college mini project.

Experience
Web lead, college coding club: ran three workshops on HTML, CSS and JavaScript for first-year students.`;

  function build() {
    const r = rng(42);
    const now = Date.now();
    const pw = Store.hash('demo123');
    const ids = { n: 0 };
    const nid = (p) => p + (++ids.n);

    const users = [];
    users.push({ id: 'admin', role: 'admin', name: 'Placement Cell', email: 'admin@interntrack.demo', pass: Store.hash('admin123'), active: true, createdAt: now - 160 * DAY });

    COMPANIES.forEach((c) => users.push({
      id: c.id, role: 'recruiter', name: c.person, email: c.email, pass: pw, active: true, createdAt: now - (c.approved ? 140 : 3) * DAY,
      company: { name: c.name, city: c.city, about: c.about, approved: c.approved }
    }));

    STUDENTS.forEach(([id, name, email, college, degree, year, cgpa, arch], i) => {
      const a = ARCH[arch];
      let skills = a.skills.slice();
      let resumeText;
      let interests = { categories: [a.cat], locations: [], type: 'Internship' };
      if (id === 's1') {
        skills = ['JavaScript', 'React', 'HTML/CSS', 'Git', 'Python', 'SQL'];
        resumeText = MEERA_RESUME;
        interests = { categories: ['Web Development', 'Data & AI'], locations: ['Bengaluru', 'Remote'], type: 'Internship' };
      } else {
        if (r() < 0.5) skills.push(['SQL', 'Git', 'Communication', 'Problem Solving'][Math.floor(r() * 4)]);
        skills = [...new Set(skills)];
        resumeText = `${name}\n${degree}, ${college}\n\nSkills\n${skills.join(', ')}\n\nProjects\n${a.proj}.`;
        interests.locations = [['Bengaluru', 'Pune', 'Hyderabad', 'Remote'][i % 4]];
      }
      users.push({
        id, role: 'student', name, email, pass: pw, active: true, createdAt: now - (30 + i * 9) * DAY,
        profile: {
          college, degree, department: deptFromDegree(degree), year, cgpa, skills, interests, saved: id === 's1' ? ['j2', 'j5', 'j8'] : [], github: id === 's1' ? 'github.com/meera-nair' : '',
          about: id === 's1' ? 'Third year CS student. I like building small web tools and am looking for my first internship.' : '',
          resumeText, resumeFile: null, resumeSource: 'pasted'
        }
      });
    });

    const jobs = JOBS.map(([id, companyId, title, type, mode, location, category, pay, payNum, duration, dl, skills, description, posted, status]) => ({
      id, companyId, title, type, mode, location, category, pay, payNum, duration, deadline: now + dl * DAY, skills, description, postedAt: now - posted * DAY, status
    }));

    // ---- applications ----
    const apps = [];
    const mk = (jobId, studentId, status, appliedDays, extra = {}) => {
      const t0 = now - appliedDays * DAY;
      const history = [{ status: 'Applied', at: t0 }];
      const order = ['Shortlisted', 'Interview'];
      let t = t0;
      const step = () => { t += (2 + Math.floor(r() * 7)) * DAY; return Math.min(t, now - DAY / 2); };
      if (status === 'Shortlisted') history.push({ status, at: step() });
      if (status === 'Interview') { history.push({ status: 'Shortlisted', at: step() }, { status, at: step() }); }
      if (status === 'Selected') { history.push({ status: 'Shortlisted', at: step() }, { status: 'Interview', at: step() }, { status, at: step() }); }
      if (status === 'Rejected') {
        if (r() < 0.5) history.push({ status: 'Shortlisted', at: step() });
        history.push({ status, at: step() });
      }
      const last = history[history.length - 1].at;
      apps.push({ id: nid('a'), jobId, studentId, status, appliedAt: t0, updatedAt: last, note: '', history, interview: null, ...extra });
      return apps[apps.length - 1];
    };

    // Meera's own applications (the demo student)
    const ia = mk('j1', 's1', 'Interview', 22, { note: 'I built CampusSwap in React and would like to work on real product screens.' });
    ia.history = [{ status: 'Applied', at: now - 22 * DAY }, { status: 'Shortlisted', at: now - 13 * DAY }, { status: 'Interview', at: now - 4 * DAY }];
    ia.updatedAt = now - 4 * DAY;
    const iv = new Date(now + 2 * DAY); iv.setHours(11, 0, 0, 0);
    ia.interview = { at: iv.getTime(), mode: 'Video call', note: 'Panel of two. Bring your CampusSwap repo link.' };
    const ib = mk('j15', 's1', 'Shortlisted', 11);
    ib.history = [{ status: 'Applied', at: now - 11 * DAY }, { status: 'Shortlisted', at: now - 5 * DAY }]; ib.updatedAt = now - 5 * DAY;
    const ic = mk('j4', 's1', 'Applied', 3);
    ic.history = [{ status: 'Applied', at: now - 3 * DAY }]; ic.updatedAt = now - 3 * DAY;
    const id_ = mk('j14', 's1', 'Rejected', 41);
    id_.history = [{ status: 'Applied', at: now - 41 * DAY }, { status: 'Rejected', at: now - 29 * DAY }]; id_.updatedAt = now - 29 * DAY;

    // everyone else
    const weights = [['Applied', 24], ['Shortlisted', 20], ['Interview', 14], ['Selected', 16], ['Rejected', 26]];
    const roll = () => { let x = r() * 100; for (const [s, w] of weights) { if ((x -= w) < 0) return s; } return 'Applied'; };
    STUDENTS.slice(1).forEach(([id, , , , , , , arch]) => {
      const cat = ARCH[arch].cat;
      const pool = jobs.filter((j) => j.category === cat && j.companyId !== 'c6');
      const others = jobs.filter((j) => j.category !== cat && j.companyId !== 'c6');
      const picks = new Set();
      const n = 2 + Math.floor(r() * 3);
      while (picks.size < Math.min(n, pool.length)) picks.add(pool[Math.floor(r() * pool.length)].id);
      if (r() < 0.6) picks.add(others[Math.floor(r() * others.length)].id);
      picks.forEach((jobId) => {
        const status = roll();
        const days = 8 + Math.floor(r() * 130);
        const a = mk(jobId, id, status, days);
        if (status === 'Interview') {
          a.interview = { at: now + Math.floor((r() * 11 - 3) * DAY), mode: r() < 0.5 ? 'Video call' : 'On campus', note: '' };
        }
      });
    });

    // ---- notifications ----
    const notifications = [];
    const note = (userId, text, at, read = false) => notifications.push({ id: nid('n'), userId, text, at, read });
    note('s1', 'Kiranastack Technologies scheduled your interview for Frontend Developer Intern.', now - 4 * DAY);
    note('s1', 'Paperkite Studio shortlisted you for UI Developer Intern.', now - 5 * DAY, true);
    note('s1', 'Your application for Data Analyst Intern was received by Brightwell Analytics.', now - 3 * DAY, true);
    note('s1', 'Kiranastack Technologies decided not to move ahead on Full Stack Developer.', now - 29 * DAY, true);
    apps.filter((a) => now - a.appliedAt < 12 * DAY).forEach((a) => {
      const job = jobs.find((j) => j.id === a.jobId);
      const st = users.find((u) => u.id === a.studentId);
      note(job.companyId, `${st.name} applied for ${job.title}.`, a.appliedAt, false);
    });

    // ---- interview prep ----
    const prep = {};
    STUDENTS.forEach(([id]) => {
      const items = [];
      Object.entries(PREP_TEMPLATE).forEach(([topic, list]) => list.forEach((title) => {
        items.push({ id: nid('p'), topic, title, done: id === 's1' ? false : r() < 0.4 });
      }));
      prep[id] = { items, mocks: [] };
    });
    // Meera: a realistic half-done list
    const doneForMeera = ['Arrays and strings', 'Linked lists', 'Stacks and queues', 'DBMS and SQL queries', 'OOP concepts', 'Two projects on GitHub with a proper README', 'Tell me about yourself'];
    prep.s1.items.forEach((it) => { it.done = doneForMeera.includes(it.title); });
    prep.s1.mocks.push({ id: nid('m'), with: 'Peer mock, coding club', kind: 'Technical', date: now - 9 * DAY, notes: 'Got stuck on a recursion question. Revise dynamic programming basics.' });

    return { v: 2, users, jobs, apps, notifications, prep };
  }

  return { build, PREP_TEMPLATE };
})();

# InternTrack

Internship and placement management for three roles: students track applications, recruiters run a hiring pipeline, the placement cell sees analytics.
Plain HTML, CSS and JavaScript. No framework, no install, no server.

## Run it
Open `index.html` in a browser. For one self-contained file run `node build.js` (writes `dist/interntrack.html`).

## Demo accounts
Open **Demo accounts** on the left of the sign-in page, or use:

| Role | Email | Password |
|---|---|---|
| Student | meera@student.demo | demo123 |
| Recruiter | hr@kiranastack.demo | demo123 |
| Admin | admin@interntrack.demo | admin123 |

## Features
- **Student:** search and filter openings, match score per job, save/unsave jobs (Saved jobs page), apply once per job, track and withdraw applications, export application history as CSV, resume check, skill gap, interview prep, analytics.
- **Recruiter:** post and close listings, view applicants ranked by match, change status, schedule interviews.
- **Admin:** approve companies, enable/disable users, remove listings, platform analytics.
- Notifications on apply, withdraw, shortlist, interview, selection and rejection.

## Resume upload
- `.txt` / `.md`: read directly.
- `.pdf`: text is extracted with [pdf.js](https://mozilla.github.io/pdf.js/), loaded from a CDN only when a PDF is uploaded, so it needs internet. Scanned (image-only) PDFs have no text and are rejected; paste the text instead.
- Word files are not supported; paste the text.

## Files
```
index.html        page shell
css/style.css     styles
js/data.js        skills vocabulary, categories
js/pdf.js         PDF text extraction (pdf.js, lazy loaded)
js/store.js       localStorage data layer
js/seed.js        demo data
js/logic.js       matching, skill gap, recommendations, analytics
js/app.js         screens and events
build.js          optional single-file build
```

## Limitations
- Data lives in the browser's localStorage: no shared server, no real accounts. Clearing site data resets it.
- Passwords use a simple demo hash. This is **not secure**; a real deployment needs a backend with bcrypt/argon2 and sessions or JWT.
- Matching is keyword based, not machine learning.
- Uploaded files are not stored, only their name and extracted text.

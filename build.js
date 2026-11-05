// node build.js  ->  dist/interntrack.html (one self-contained file, works offline except web fonts)
const fs = require('fs');
const read = (f) => fs.readFileSync(f, 'utf8');
const js = ['data', 'pdf', 'store', 'seed', 'logic', 'app'].map((n) => read(`js/${n}.js`)).join('\n');
const out = `<title>InternTrack</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Public+Sans:wght@400;500;600;700&display=swap">
<style>${read('css/style.css')}</style>
<div id="app"></div>
<div id="toast" role="status" hidden></div>
<script>${js}</script>
`;
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/interntrack.html', out);
console.log('built dist/interntrack.html', out.length, 'bytes');

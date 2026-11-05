/*
 * pdf.js
 * Reads real text out of a PDF resume using Mozilla's pdf.js, loaded from a CDN only when
 * the student actually uploads a PDF. Nothing is installed and nothing loads otherwise.
 * Scanned PDFs (pictures of text) contain no text layer, so they are rejected honestly.
 */
const PdfText = (() => {
  const VERSION = '3.11.174';
  const BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + VERSION + '/';
  let loading = null;

  function loadLibrary() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = BASE + 'pdf.min.js';
      tag.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + 'pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      tag.onerror = () => { loading = null; reject(new Error('The PDF reader could not be loaded. Check your internet connection, or paste the text instead.')); };
      document.head.appendChild(tag);
    });
    return loading;
  }

  // returns { text, pages }
  async function extract(file) {
    const lib = await loadLibrary();
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await lib.getDocument({ data }).promise;
    const pages = Math.min(pdf.numPages, 6); // resumes are short
    let text = '';
    for (let i = 1; i <= pages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      let lastY = null;
      content.items.forEach((item) => {
        const y = item.transform ? item.transform[5] : 0;
        if (lastY !== null && Math.abs(y - lastY) > 2) text += '\n';
        else if (lastY !== null && text && !/\s$/.test(text)) text += ' ';
        text += item.str;
        lastY = y;
      });
      text += '\n\n';
    }
    text = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 40) throw new Error('No readable text found. This looks like a scanned image. Paste your resume text instead.');
    return { text, pages };
  }

  return { extract };
})();

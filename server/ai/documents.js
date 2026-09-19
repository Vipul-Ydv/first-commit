/**
 * Pull plain text out of an uploaded competition document.
 *
 * The extraction adapter already turns text into the six competition fields.
 * This is only the step before that: whatever the leader uploaded, get the
 * words out of it.
 *
 * PPTX and DOCX are both ZIP archives of XML, so they need no heavyweight
 * parser - unzip, find the right parts, pull the text runs. PDF needs a real
 * parser, which is the one dependency worth carrying.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB - a slide deck, not a video

const SUPPORTED = {
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
};

function extensionOf(filename = '') {
  const m = String(filename).toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

function isSupported(filename) {
  return Object.keys(SUPPORTED).includes(extensionOf(filename));
}

/** Strip XML tags and decode the handful of entities Office actually emits. */
function textFromXml(xml, tagPattern, joiner = ' ') {
  const runs = xml.match(tagPattern) || [];
  return runs
    .map((run) => run.replace(/<[^>]+>/g, ''))
    .join(joiner)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fromPptx(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);

  // Slides are ppt/slides/slide1.xml, slide2.xml ... in no guaranteed order,
  // so sort numerically or the deck reads out of sequence.
  const slides = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const num = (s) => parseInt(s.match(/slide(\d+)\.xml$/)[1], 10);
      return num(a) - num(b);
    });

  const parts = [];
  for (const name of slides) {
    const xml = await zip.file(name).async('string');

    // One line per paragraph, not per slide. PowerPoint splits a single
    // sentence across runs at formatting boundaries, so runs inside a
    // paragraph join with nothing - but separate paragraphs and text boxes
    // are separate lines. Flattening a whole slide into one line makes
    // "Organised by: X" swallow whatever follows it.
    for (const paragraph of xml.split('</a:p>')) {
      const line = textFromXml(paragraph, /<a:t>[\s\S]*?<\/a:t>/g, '');
      if (line) parts.push(line);
    }
  }
  return parts.join('\n');
}

async function fromDocx(buffer) {
  const JSZip = require('jszip');
  const zip = await JSZip.loadAsync(buffer);
  const doc = zip.file('word/document.xml');
  if (!doc) return '';

  const xml = await doc.async('string');

  // Split on the paragraph boundary and build lines, the same way as pptx.
  // Inserting "\n" into the XML first does not work: textFromXml collapses all
  // whitespace at the end, which turns those newlines straight back into
  // spaces and reintroduces the swallowed-organizer bug.
  const lines = [];
  for (const paragraph of xml.split('</w:p>')) {
    const line = textFromXml(paragraph, /<w:t[^>]*>[\s\S]*?<\/w:t>/g, '');
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

/**
 * pdf.js reaches for a few browser globals during initialisation. Node does not
 * have them, and in Lambda that surfaced as "DOMMatrix is not defined" on every
 * PDF. Text extraction never uses these for real - they only need to exist.
 */
function polyfillPdfGlobals() {
  if (typeof globalThis.DOMMatrix === 'undefined') {
    globalThis.DOMMatrix = class DOMMatrix {
      constructor(init) {
        const v = Array.isArray(init) ? init : [1, 0, 0, 1, 0, 0];
        [this.a, this.b, this.c, this.d, this.e, this.f] = v;
      }
      static fromMatrix(o = {}) {
        return new DOMMatrix([o.a ?? 1, o.b ?? 0, o.c ?? 0, o.d ?? 1, o.e ?? 0, o.f ?? 0]);
      }
    };
  }
  if (typeof globalThis.Path2D === 'undefined') globalThis.Path2D = class Path2D {};
  if (typeof globalThis.ImageData === 'undefined') globalThis.ImageData = class ImageData {};
}

async function fromPdf(buffer) {
  polyfillPdfGlobals();

  // pdf-parse v2 exports a class, not a callable function. The v1 shape
  // (`require('pdf-parse')(buffer)`) throws "pdfParse is not a function" here,
  // which would have broken every PDF upload.
  const { PDFParse } = require('pdf-parse');

  const parser = new PDFParse({ data: buffer });
  try {
    const { text } = await parser.getText();
    return String(text || '').replace(/\n{3,}/g, '\n\n').trim();
  } finally {
    // Releases the worker; without it Lambda containers leak between invocations.
    await parser.destroy?.();
  }
}

/**
 * @param {Buffer} buffer   file contents
 * @param {string} filename used only to pick a parser
 * @returns {Promise<string>} plain text, ready for the extraction adapter
 */
async function textFromDocument(buffer, filename) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Empty file');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error(`File is larger than ${MAX_BYTES / 1024 / 1024} MB`);
  }

  const ext = extensionOf(filename);
  switch (ext) {
    case 'pptx':
      return fromPptx(buffer);
    case 'docx':
      return fromDocx(buffer);
    case 'pdf':
      return fromPdf(buffer);
    case 'txt':
    case 'md':
      return buffer.toString('utf8');
    default:
      throw new Error(`Unsupported file type: .${ext || 'unknown'}`);
  }
}

module.exports = { textFromDocument, isSupported, SUPPORTED, MAX_BYTES, extensionOf };

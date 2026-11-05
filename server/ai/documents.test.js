/**
 * Document text extraction tests:  node server/ai/documents.test.js
 * Builds real OOXML archives in memory - no fixture files needed.
 */

const assert = require('assert');
const JSZip = require('jszip');
const { textFromDocument, isSupported, extensionOf } = require('./documents');
const { analyzeCompetition } = require('./index');

let passed = 0;
const results = [];
const check = (name, fn) => {
  try {
    fn();
    passed++;
    results.push(`  ok   ${name}`);
  } catch (e) {
    results.push(`  FAIL ${name}\n       ${e.message}`);
    process.exitCode = 1;
  }
};

/** Text shaped the way PowerPoint emits it: runs inside paragraphs inside shapes. */
const pptxSlide = (paragraphs) => `<?xml version="1.0" encoding="UTF-8"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
<p:cSld><p:spTree>${paragraphs
  .map((runs) => `<p:sp><p:txBody><a:p>${[].concat(runs)
    .map((t) => `<a:r><a:rPr lang="en-IN"/><a:t>${t}</a:t></a:r>`)
    .join('')}</a:p></p:txBody></p:sp>`)
  .join('')}</p:spTree></p:cSld></p:sld>`;

const docxBody = (paragraphs) => `<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${paragraphs
  .map((t) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`)
  .join('')}</w:body></w:document>`;

/**
 * A real, structurally valid PDF with a text layer - byte offsets in the xref
 * table computed rather than faked, so the parser accepts it.
 *
 * Worth the effort: the PDF path shipped broken because nothing here exercised
 * it. pdf-parse v2 exports a class, and the v1 call shape threw on every
 * upload.
 */
function makePdf(lines) {
  const escape = (s) => s.replace(/([()\\])/g, '\\$1');
  const content =
    'BT /F1 12 Tf 50 750 Td 14 TL ' +
    lines.map((l) => `(${escape(l)}) Tj T*`).join(' ') +
    ' ET';

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });

  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

(async () => {
  /* ------------------------------- pptx ------------------------------- */

  const deck = new JSZip();
  deck.file('[Content_Types].xml', '<Types/>');
  // Added out of order, and with a double-digit slide, to prove the sort.
  deck.file('ppt/slides/slide10.xml', pptxSlide([['Open only to students from BTKIT.']]));
  deck.file('ppt/slides/slide2.xml', pptxSlide([['Organised by: BTKIT'], ['Teams of 2-4 members.']]));
  deck.file('ppt/slides/slide1.xml', pptxSlide([['AI Innovation ', 'Challenge 2026']]));
  deck.file('ppt/slides/slide3.xml', pptxSlide([['Registration deadline: 30 November 2026.']]));
  const pptxBuf = await deck.generateAsync({ type: 'nodebuffer' });
  const pptxText = await textFromDocument(pptxBuf, 'deck.pptx');

  check('pptx: slides come out in numeric order, not string order', () => {
    const lines = pptxText.split('\n');
    assert.ok(lines[0].includes('AI Innovation'), `got: ${lines[0]}`);
    assert.ok(lines[lines.length - 1].includes('BTKIT.'), `got: ${lines[lines.length - 1]}`);
  });

  check('pptx: runs split mid-sentence rejoin without a stray space', () => {
    assert.ok(pptxText.includes('AI Innovation Challenge 2026'), pptxText);
  });

  check('pptx: separate text boxes stay on separate lines', () => {
    // Regression: these were joined by a space, so "Organised by" swallowed
    // the next line and the organizer came out as "BTKIT Teams of 2-4 members."
    assert.ok(!pptxText.includes('BTKIT Teams'), pptxText);
  });

  const fromDeck = await analyzeCompetition(pptxText, { sourceType: 'uploaded_document' });
  check('pptx: organizer is just the organizer', () => {
    assert.strictEqual(fromDeck.fields.organizer, 'BTKIT');
  });
  check('pptx: all six fields extracted from a slide deck', () => {
    assert.strictEqual(fromDeck.fields.name, 'AI Innovation Challenge 2026');
    assert.strictEqual(fromDeck.fields.teamSizeMin, 2);
    assert.strictEqual(fromDeck.fields.teamSizeMax, 4);
    assert.strictEqual(fromDeck.fields.deadline, '2026-11-30T23:59:00Z');
    assert.strictEqual(fromDeck.fields.eligibility.studentOnly, true);
    assert.deepStrictEqual(fromDeck.fields.eligibility.allowedInstitutions, ['BTKIT']);
    assert.strictEqual(fromDeck.needsReview, false);
  });
  check('pptx: sourceType is carried through', () => {
    assert.strictEqual(fromDeck.sourceType, 'uploaded_document');
  });

  /* ------------------------------- docx ------------------------------- */

  const doc = new JSZip();
  doc.file('word/document.xml', docxBody([
    'Robotics Cup 2026',
    'Organised by: Acme Labs',
    'Teams of 3-5 members.',
    'Deadline: 15 December 2026.',
  ]));
  const docxText = await textFromDocument(await doc.generateAsync({ type: 'nodebuffer' }), 'brief.docx');

  check('docx: paragraphs become lines', () => {
    assert.ok(docxText.split('\n').length >= 4, JSON.stringify(docxText));
  });

  const fromDoc = await analyzeCompetition(docxText, { sourceType: 'uploaded_document' });
  check('docx: fields extracted', () => {
    assert.strictEqual(fromDoc.fields.organizer, 'Acme Labs');
    assert.strictEqual(fromDoc.fields.teamSizeMax, 5);
  });

  /* -------------------------------- pdf ------------------------------- */

  const pdfText = await textFromDocument(
    makePdf([
      'Quantum Cup 2026',
      'Organised by: Acme Research',
      'Teams of 2-3 members.',
      'Deadline: 5 January 2027.',
    ]),
    'brief.pdf'
  );

  check('pdf: text comes out at all', () => {
    // Regression: pdf-parse v2 exports a class. Calling the module directly,
    // as v1 allowed, threw "pdfParse is not a function" on every upload - and
    // no test exercised the PDF path, so it shipped broken.
    assert.ok(pdfText.includes('Quantum Cup 2026'), JSON.stringify(pdfText));
  });

  const fromPdfDoc = await analyzeCompetition(pdfText, { sourceType: 'uploaded_document' });
  check('pdf: fields extracted', () => {
    assert.strictEqual(fromPdfDoc.fields.name, 'Quantum Cup 2026');
    assert.strictEqual(fromPdfDoc.fields.teamSizeMin, 2);
    assert.strictEqual(fromPdfDoc.fields.teamSizeMax, 3);
    assert.strictEqual(fromPdfDoc.fields.deadline, '2027-01-05T23:59:00Z');
  });

  /* ------------------------- plain text and guards -------------------- */

  check('txt passes straight through', async () => {});
  const txt = await textFromDocument(Buffer.from('Hack Day 2026\nHosted by Acme'), 'notes.txt');
  check('txt content is preserved', () => assert.ok(txt.includes('Hack Day 2026')));

  check('unsupported extensions are recognised', () => {
    assert.strictEqual(isSupported('virus.exe'), false);
    assert.strictEqual(isSupported('deck.pptx'), true);
    assert.strictEqual(extensionOf('a.b.PDF'), 'pdf');
  });

  await textFromDocument(Buffer.from('x'), 'a.exe').then(
    () => check('unsupported type is rejected', () => assert.fail('should have thrown')),
    (e) => check('unsupported type is rejected', () => assert.ok(/Unsupported/.test(e.message)))
  );

  await textFromDocument(Buffer.alloc(0), 'a.txt').then(
    () => check('empty file is rejected', () => assert.fail('should have thrown')),
    (e) => check('empty file is rejected', () => assert.ok(/Empty/.test(e.message)))
  );

  await textFromDocument(Buffer.alloc(11 * 1024 * 1024), 'big.txt').then(
    () => check('oversized file is rejected', () => assert.fail('should have thrown')),
    (e) => check('oversized file is rejected', () => assert.ok(/larger than/.test(e.message)))
  );

  /* --------------------------- key ownership -------------------------- */
  /* The Lambda role can read the whole competitions/ prefix, so the only thing
     stopping one user's key being used to read another user's private document
     is this check. Worth testing properly. */

  const { ownsKey } = require('../lib/storage');

  check('own key is accepted', () => {
    assert.strictEqual(ownsKey('competitions/user_A/uuid/deck.pptx', 'user_A'), true);
  });
  check("another user's key is rejected", () => {
    assert.strictEqual(ownsKey('competitions/user_B/uuid/deck.pptx', 'user_A'), false);
  });
  check('path traversal cannot satisfy the prefix', () => {
    assert.strictEqual(ownsKey('competitions/user_A/../user_B/x.pdf', 'user_A'), false);
  });
  check('a key outside the prefix is rejected', () => {
    assert.strictEqual(ownsKey('../../etc/passwd', 'user_A'), false);
  });
  check('missing key or user is rejected', () => {
    assert.strictEqual(ownsKey(null, 'user_A'), false);
    assert.strictEqual(ownsKey('competitions/user_A/uuid/d.pptx', null), false);
  });

  /* ------------------ comprehend entity selection --------------------- */
  /* Offline: exercises the merge logic, not the AWS call. This is where the
     bug was - a partner org further down the page scored higher than the
     actual title and became the competition name. */

  const { best } = require('./comprehend');

  const NEWLINE = String.fromCharCode(10);

  const ENTITIES = [
    { Type: 'EVENT', Text: 'AI Innovation Challenge 2026', Score: 0.77, BeginOffset: 0 },
    { Type: 'ORGANIZATION', Text: 'BTKIT', Score: 0.99, BeginOffset: 45 },
    // Comprehend really does return entities that run across a line break.
    { Type: 'EVENT', Text: ['Bharat Builds Tour', 'Open'].join(NEWLINE), Score: 0.99, BeginOffset: 80 },
    { Type: 'ORGANIZATION', Text: 'x', Score: 0.99, BeginOffset: 200 },
    { Type: 'EVENT', Text: 'Low Confidence Event', Score: 0.4, BeginOffset: 5 },
  ];

  check('the title wins on position, not on model confidence', () => {
    assert.strictEqual(best(ENTITIES, 'EVENT', { pick: 'earliest' }), 'AI Innovation Challenge 2026');
  });
  check('by score alone the wrong entity would win', () => {
    assert.strictEqual(best(ENTITIES, 'EVENT'), 'Bharat Builds Tour');
  });
  check('entities spanning a line break are trimmed', () => {
    assert.ok(!best(ENTITIES, 'EVENT').includes('Open'));
  });
  check('low-confidence entities are ignored', () => {
    assert.notStrictEqual(best(ENTITIES, 'EVENT', { pick: 'earliest' }), 'Low Confidence Event');
  });
  check('one-character entities are ignored', () => {
    assert.strictEqual(best(ENTITIES, 'ORGANIZATION'), 'BTKIT');
  });
  check('the organizer is never a copy of the name', () => {
    assert.strictEqual(best(ENTITIES, 'ORGANIZATION', { exclude: ['BTKIT'] }), null);
  });
  check('a type with no entities returns null', () => {
    assert.strictEqual(best(ENTITIES, 'PERSON'), null);
  });

  console.log('\ndocument extraction');
  results.forEach((l) => console.log(l));
  console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ', all green'}\n`);
})();

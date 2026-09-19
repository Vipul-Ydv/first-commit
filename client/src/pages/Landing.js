import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiArrowRight, HiLightningBolt, HiCheckCircle, HiUserGroup, HiUsers } from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Auth-aware CTA
───────────────────────────────────────────── */
function HeroCta({ user, profileComplete }) {
  if (!user) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/register" className="btn-primary text-base px-6 py-3">
          Get Started <HiArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/login" className="btn-secondary text-base px-6 py-3">Sign in</Link>
      </div>
    );
  }
  if (!profileComplete) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/profile" className="btn-primary text-base px-6 py-3">
          Complete your profile <HiArrowRight className="h-4 w-4" />
        </Link>
        <span className="text-sm text-hm-muted">Add skills to start matching</span>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to="/dashboard" className="btn-primary text-base px-6 py-3">
        Go to dashboard <HiArrowRight className="h-4 w-4" />
      </Link>
      <Link to="/choose" className="btn-secondary text-base px-6 py-3">Find a team</Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Hero product preview — rich composition
   Uses real seeded demo data only
───────────────────────────────────────────── */
function HeroPreview() {
  return (
    <div className="relative w-full max-w-[360px] mx-auto lg:mx-0 select-none"
         aria-hidden="true">

      {/* ── Decorative blobs ── */}
      <div className="absolute -top-4 -right-4 w-16 h-16 bg-hm-yellow opacity-30 rounded-full blur-xl" />
      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-hm-coral opacity-20 rounded-full blur-xl" />

      {/* ── Team card (main) ── */}
      <div className="relative bg-white rounded-hm border border-hm-border shadow-hm-md p-4 mb-3 animate-fade-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-hm-green flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-xs leading-none">V</span>
              </div>
              <p className="font-black text-hm-text text-base">VisionX</p>
            </div>
            <p className="text-xs text-hm-muted mt-0.5 ml-9">AI Innovation Challenge</p>
          </div>
          <span className="badge status-recruiting">Recruiting</span>
        </div>

        {/* Coverage bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-hm-muted">Team Coverage</span>
            <span className="font-black text-hm-green">33%</span>
          </div>
          <div className="gap-track">
            <div className="gap-fill" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Skills grid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="tag-label text-hm-green mb-1" style={{ fontSize: '9px' }}>Covered</p>
            <span className="badge badge-skills text-xs">
              <HiCheckCircle className="h-3 w-3 mr-1" />AWS
            </span>
          </div>
          <div>
            <p className="tag-label text-hm-coral-dark mb-1" style={{ fontSize: '9px' }}>Needed</p>
            <div className="flex flex-wrap gap-1">
              <span className="badge badge-coral text-xs">ML</span>
              <span className="badge badge-coral text-xs">UI/UX</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Candidate card (slightly offset for depth) ── */}
      <div className="relative bg-white rounded-hm border border-hm-border shadow-hm-md p-4
                      animate-fade-up-delay-1 ml-3">
        {/* Candidate header */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-hm-yellow flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-hm-yellow-dark leading-none">AK</span>
            </div>
            <div>
              <p className="text-sm font-bold text-hm-text">Aisha Khan</p>
              <p className="text-xs text-hm-muted">BTKIT · ML Engineer</p>
            </div>
          </div>
          <button className="btn-primary text-xs px-3 py-1.5 rounded-md">Invite</button>
        </div>

        {/* AI reason */}
        <div className="highlight-box mb-2.5">
          <HiLightningBolt className="h-3.5 w-3.5 text-hm-green flex-shrink-0 mt-0.5" />
          <p className="text-xs text-hm-green font-semibold leading-relaxed">
            Fills the team's Machine Learning requirement.
          </p>
        </div>

        {/* Fills gap */}
        <div className="mb-2">
          <p className="tag-label text-hm-green mb-1" style={{ fontSize: '9px' }}>Fills the gap</p>
          <span className="badge badge-match font-bold">
            <HiCheckCircle className="h-3 w-3 mr-1" />Machine Learning
          </span>
        </div>

        {/* All skills */}
        <div className="flex flex-wrap gap-1">
          <span className="badge badge-match text-xs">ML</span>
          <span className="badge badge-skills text-xs">Python</span>
          <span className="badge badge-skills text-xs">AWS</span>
        </div>
      </div>

      {/* ── Floating label badge ── */}
      <div className="absolute -top-3 left-4 bg-hm-yellow text-hm-yellow-dark text-xs font-black
                      px-3 py-1 rounded-full shadow-sm rotate-[-2deg] animate-float">
        AI picks · You decide
      </div>

      <p className="text-xs text-hm-subtle text-center mt-3">
        Real product · seeded demo data
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Closing CTA
───────────────────────────────────────────── */
function ClosingCta({ user, profileComplete }) {
  if (!user) {
    return (
      <>
        <p className="section-num mb-3">Ready?</p>
        <h2 className="text-3xl md:text-4xl font-black text-hm-text mb-3">
          Find your people.
        </h2>
        <p className="text-hm-muted mb-8 text-base max-w-md mx-auto">
          Create an account, set up your profile, and start finding the right team.
        </p>
        <Link to="/register" className="btn-primary text-base px-8 py-3">
          Create a free account <HiArrowRight className="h-4 w-4" />
        </Link>
      </>
    );
  }
  if (!profileComplete) {
    return (
      <>
        <p className="section-num mb-3">Almost there</p>
        <h2 className="text-3xl font-black text-hm-text mb-3">Complete your profile.</h2>
        <p className="text-hm-muted mb-8 text-base max-w-md mx-auto">
          Your skills and institution are what the AI uses to match you with teams.
        </p>
        <Link to="/profile" className="btn-primary text-base px-8 py-3">
          Complete profile <HiArrowRight className="h-4 w-4" />
        </Link>
      </>
    );
  }
  return (
    <>
      <p className="section-num mb-3">Go</p>
      <h2 className="text-3xl font-black text-hm-text mb-3">Your team is waiting.</h2>
      <p className="text-hm-muted mb-8 text-base max-w-md mx-auto">
        Browse recommended teams or create your own and find the right candidates.
      </p>
      <Link to="/dashboard" className="btn-primary text-base px-8 py-3">
        Open dashboard <HiArrowRight className="h-4 w-4" />
      </Link>
    </>
  );
}

/* ─────────────────────────────────────────────
   Skill bar — decorative for the "gap" section
───────────────────────────────────────────── */
function SkillBar({ skill, pct, covered }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0">
        <span className={`text-sm font-bold ${covered ? 'text-hm-green' : 'text-hm-text'}`}>
          {skill}
        </span>
      </div>
      <div className="flex-1 bg-hm-border rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full ${covered ? 'bg-hm-green' : 'bg-hm-coral'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-12 text-right">
        {covered
          ? <span className="badge badge-skills text-xs">✓</span>
          : <span className="badge badge-coral text-xs">open</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Landing page
───────────────────────────────────────────── */
export default function Landing() {
  const { user, profileComplete } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF9F5' }}>

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="border-b border-hm-border overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Copy */}
            <div className="animate-fade-up">
              <p className="section-num mb-5">HackMatch</p>

              <h1 className="text-5xl md:text-6xl font-black text-hm-text leading-[1.05] mb-6">
                Find your{' '}
                <span className="text-highlight text-hm-green">people.</span>
                <br />
                Build your{' '}
                <span className="text-highlight text-hm-green">team.</span>
              </h1>

              <p className="text-lg text-hm-muted mb-8 leading-relaxed max-w-lg">
                Create a team for your next competition, discover people with the skills
                you need, and decide who joins. The AI recommends. You decide.
              </p>

              <HeroCta user={user} profileComplete={profileComplete} />
            </div>

            {/* Product preview */}
            <div className="hidden lg:flex justify-end">
              <HeroPreview />
            </div>
          </div>

          {/* Mobile preview (simplified) */}
          <div className="lg:hidden mt-10">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — numbered steps
      ══════════════════════════════════════════ */}
      <section className="border-b border-hm-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="section-num mb-2">How it works</p>
          <h2 className="text-3xl font-black text-hm-text mb-10">
            From idea to team in four steps.
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '01', title: 'Create your profile',
                body: 'Add your skills, interests, and role preference. This is what the AI uses to match you.' },
              { n: '02', title: 'Find or build a team',
                body: 'Browse teams recommended for your skills, or create one and attach your competition.' },
              { n: '03', title: 'See the skill gap',
                body: 'Every team has a live coverage view. Covered skills in green, missing skills highlighted.' },
              { n: '04', title: 'Decide who joins',
                body: 'Leaders invite candidates. Individuals send join requests. Both parties have control.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="group">
                <div className="text-3xl font-black text-hm-green-light group-hover:text-hm-green
                                transition-colors mb-3 select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {n}
                </div>
                <h3 className="font-black text-hm-text mb-2">{title}</h3>
                <p className="text-sm text-hm-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SKILL GAP SHOWCASE
      ══════════════════════════════════════════ */}
      <section className="border-b border-hm-border" style={{ backgroundColor: '#0F6B57' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Copy */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-hm-yellow mb-4">
                Skill gap analysis
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
                Your team doesn't need more people.
                <br />
                It needs the{' '}
                <span className="text-hm-yellow">right skills.</span>
              </h2>
              <p className="text-hm-green-light text-base leading-relaxed">
                Define what your team needs. HackMatch tracks exactly which skills are
                covered by current members and which gaps remain.
              </p>
            </div>

            {/* Live skill gap demo */}
            <div className="bg-white rounded-hm p-5 shadow-hm-lg select-none">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-black text-hm-text">VisionX</p>
                  <p className="text-xs text-hm-muted">AI Innovation Challenge</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-hm-green">33%</p>
                  <p className="text-xs text-hm-muted">covered</p>
                </div>
              </div>

              <div className="gap-track mb-5">
                <div className="gap-fill" style={{ width: '33%' }} />
              </div>

              <div className="space-y-3">
                <SkillBar skill="AWS"              pct={100} covered />
                <SkillBar skill="Machine Learning" pct={0}   covered={false} />
                <SkillBar skill="UI/UX"            pct={0}   covered={false} />
              </div>

              <p className="text-xs text-hm-muted mt-4 text-center">
                Real data · recalculates when someone joins
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TWO PATHS
      ══════════════════════════════════════════ */}
      <section className="border-b border-hm-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="section-num mb-2">Two paths</p>
          <h2 className="text-3xl font-black text-hm-text mb-2">
            Lead or join. Your choice.
          </h2>
          <p className="text-hm-muted mb-10">Both paths give you control. The AI only recommends.</p>

          <div className="grid md:grid-cols-2 gap-5">

            {/* Lead */}
            <div className="card-accent group hover:shadow-hm-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-hm-green-light flex items-center justify-center flex-shrink-0">
                  <HiUserGroup className="h-5 w-5 text-hm-green" />
                </div>
                <div>
                  <p className="font-black text-hm-text">Lead a Team</p>
                  <p className="text-xs text-hm-muted">You create · you invite</p>
                </div>
              </div>
              <ol className="space-y-2.5 text-sm text-hm-muted flex-1 mb-5">
                {[
                  'Create a team and attach a competition',
                  'Define the skills your team still needs',
                  'Review AI-recommended candidates for your skill gap',
                  'Send invitations to candidates you choose',
                  'The candidate decides whether to accept',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-black text-hm-green flex-shrink-0 tabular-nums">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link to="/teams/new"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-hm-green
                               hover:text-hm-green-dark transition-colors">
                Create a team <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Find */}
            <div className="card group hover:border-hm-green hover:shadow-hm-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-hm-yellow-light flex items-center justify-center flex-shrink-0">
                  <HiUsers className="h-5 w-5 text-hm-yellow-dark" />
                </div>
                <div>
                  <p className="font-black text-hm-text">Find a Team</p>
                  <p className="text-xs text-hm-muted">You browse · you request</p>
                </div>
              </div>
              <ol className="space-y-2.5 text-sm text-hm-muted flex-1 mb-5">
                {[
                  'Set up your profile with your skills',
                  'See teams recommended based on your skill match',
                  'Browse all open teams and their skill gaps',
                  'Send a join request to a team you want to join',
                  'The team leader decides whether to accept',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="font-black text-hm-yellow-dark flex-shrink-0 tabular-nums">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
              <Link to="/teams"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-hm-yellow-dark
                               hover:text-hm-text transition-colors">
                Browse teams <HiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════════ */}
      <section className="border-b border-hm-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
          <ClosingCta user={user} profileComplete={profileComplete} />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-hm-green rounded-md flex items-center justify-center">
              <span className="text-white font-black text-xs leading-none">H</span>
            </div>
            <span className="text-sm font-black text-hm-text">HackMatch</span>
          </div>
          <p className="text-xs text-hm-subtle">Built for Bharat Builds Tour · 2026</p>
        </div>
      </footer>
    </div>
  );
}

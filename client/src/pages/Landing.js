import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiLightningBolt, HiUsers, HiUserGroup } from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Auth-aware CTA block
───────────────────────────────────────────── */

function CtaBlock({ user, profileComplete }) {
  if (!user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/register" className="btn-primary">Get Started</Link>
        <Link to="/login" className="btn-secondary">Sign in</Link>
      </div>
    );
  }
  if (!profileComplete) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link to="/profile" className="btn-primary">Complete your profile</Link>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
      <Link to="/choose" className="btn-secondary">Find or create a team</Link>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Closing CTA section content
───────────────────────────────────────────── */

function ClosingCta({ user, profileComplete }) {
  if (!user) {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to find your team?</h2>
        <p className="text-gray-500 mb-6">
          Create an account and set up your profile to get started.
        </p>
        <Link to="/register" className="btn-primary">Get Started</Link>
      </>
    );
  }
  if (!profileComplete) {
    return (
      <>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Complete your profile to start finding the right teams.
        </h2>
        <p className="text-gray-500 mb-6">
          Skills and institution are required for matching to work.
        </p>
        <Link to="/profile" className="btn-primary">Complete your profile</Link>
      </>
    );
  }
  return (
    <>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Ready to find your next opportunity?
      </h2>
      <p className="text-gray-500 mb-6">
        Browse recommended teams or create your own.
      </p>
      <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
    </>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

export default function Landing() {
  const { user, profileComplete } = useAuth();

  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28">
          {/* Tagline chip */}
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-5">
            AI recommends. Humans decide.
          </p>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
            Build the right hackathon team.
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mb-8">
            Teams define the skills they need. HackMatch recommends suitable candidates based
            on those requirements. Leaders and candidates make every final decision themselves.
          </p>

          <CtaBlock user={user} profileComplete={profileComplete} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          TWO CORE PATHS
      ══════════════════════════════════════ */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Two ways to use HackMatch</h2>
          <p className="text-gray-500 mb-10 text-sm">
            Both paths give you control. The AI only makes recommendations.
          </p>

          <div className="grid md:grid-cols-2 gap-6">

            {/* Path A — Lead a Team */}
            <div className="card flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <HiUserGroup className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lead a Team</p>
                  <p className="text-xs text-gray-500">You create, you invite</p>
                </div>
              </div>

              <ol className="space-y-2 text-sm text-gray-600 flex-1">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">1.</span>
                  Create a team and attach a competition
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">2.</span>
                  Define the skills your team still needs
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">3.</span>
                  Review candidates recommended for your skill gap
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">4.</span>
                  Send invitations to candidates you choose
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">5.</span>
                  The candidate decides whether to accept
                </li>
              </ol>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link to="/teams/new" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Create a team
                </Link>
              </div>
            </div>

            {/* Path B — Find a Team */}
            <div className="card flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <HiUsers className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Find a Team</p>
                  <p className="text-xs text-gray-500">You browse, you request</p>
                </div>
              </div>

              <ol className="space-y-2 text-sm text-gray-600 flex-1">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">1.</span>
                  Set up your profile with your skills
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">2.</span>
                  See teams recommended based on your skill match
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">3.</span>
                  Browse all open teams and view their skill gaps
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">4.</span>
                  Send a join request to a team you want to join
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary-600 flex-shrink-0">5.</span>
                  The team leader decides whether to accept
                </li>
              </ol>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <Link to="/teams" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Browse teams
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          REAL FEATURES
      ══════════════════════════════════════ */}
      <section className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">How it works</h2>
          <p className="text-gray-500 text-sm mb-10">
            Three things HackMatch actually does.
          </p>

          <div className="grid md:grid-cols-3 gap-6">

            <div className="card">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <HiLightningBolt className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Skill gap analysis</h3>
              <p className="text-sm text-gray-600">
                Every team has a live skill gap. You can see exactly which required skills are
                already covered by current members and which are still missing.
              </p>
            </div>

            <div className="card">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <HiUserGroup className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Candidate recommendations</h3>
              <p className="text-sm text-gray-600">
                Leaders see a ranked list of candidates who fill the remaining gap, each with
                their matched skills and a plain-language explanation of why they were suggested.
              </p>
            </div>

            <div className="card">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                <HiUsers className="h-5 w-5 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Two-way decision flow</h3>
              <p className="text-sm text-gray-600">
                Leaders invite candidates; individuals send join requests. In both cases the
                other party makes the final decision. HackMatch never adds someone to a team
                automatically.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CLOSING CTA
      ══════════════════════════════════════ */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <ClosingCta user={user} profileComplete={profileComplete} />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-400">
          HackMatch · Built for Bharat Builds Tour · 2026
        </div>
      </footer>

    </div>
  );
}

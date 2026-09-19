import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiArrowRight } from 'react-icons/hi';

export default function Choose() {
  const { profileComplete } = useAuth();

  if (!profileComplete) return <Navigate to="/profile" replace />;

  return (
    <div className="page-shell">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">What would you like to do?</h1>
          <p className="text-sm text-gray-500">You can do both. Pick wherever you want to start.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ChoiceCard
            to="/teams/new"
            title="Create a Team"
            sub="I'm leading"
            description="Attach a competition, define the skills you need, and get AI-recommended candidates to fill your skill gap."
            steps={['Create team and attach competition', 'List required skills', 'Review recommendations', 'Invite candidates']}
            cta="Create a team"
          />
          <ChoiceCard
            to="/teams"
            title="Find a Team"
            sub="I'm looking to join"
            description="Browse teams matched to your skills, see exactly why you were recommended, and send a join request."
            steps={['Browse recommended teams', 'See your skill match', 'Send a join request', 'Leader decides']}
            cta="Browse teams"
          />
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          AI recommends. Humans decide.
        </p>
      </div>
    </div>
  );
}

function ChoiceCard({ to, title, sub, description, steps, cta }) {
  return (
    <div className="card flex flex-col hover:border-primary-300 hover:shadow-md transition-all duration-150">
      <div className="mb-3">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>

      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{description}</p>

      <ol className="space-y-1.5 text-sm text-gray-600 flex-1 mb-5">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="font-semibold text-primary-600 flex-shrink-0 tabular-nums">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <Link
        to={to}
        className="btn-primary w-full justify-center flex items-center gap-1.5"
      >
        {cta} <HiArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

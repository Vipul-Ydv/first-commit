import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { FiUsers, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

/**
 * The fork. Everyone lands here once their profile is complete, and picks a
 * direction: lead a team, or find one. Both paths are first-class - this
 * screen exists so neither one is buried.
 */
export default function Choose() {
  const { profileComplete } = useAuth();

  // Matching needs skills and an institution, so there is nothing useful to
  // do here until the profile is filled in.
  if (!profileComplete) return <Navigate to="/profile" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 text-center">What would you like to do?</h1>
      <p className="mt-3 text-center text-gray-600">
        You can do both — pick wherever you want to start.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Option
          to="/teams/new"
          icon={<FiUsers className="h-7 w-7" />}
          title="Create a Team"
          subtitle="I'm leading"
          bullets={[
            'Add your competition',
            'List the skills you need',
            'Get recommended candidates',
            'Send invitations',
          ]}
        />
        <Option
          to="/teams"
          icon={<FiSearch className="h-7 w-7" />}
          title="Find a Team"
          subtitle="I'm looking to join"
          bullets={[
            'Browse open teams',
            'See teams matched to your skills',
            'Read why you were matched',
            'Send a join request',
          ]}
        />
      </div>

      <p className="mt-10 text-center text-sm text-gray-500">
        HackMatch recommends. You decide.
      </p>
    </div>
  );
}

function Option({ to, icon, title, subtitle, bullets }) {
  return (
    <Link
      to={to}
      className="card hover:shadow-xl hover:border-primary-200 transition-all duration-200 flex flex-col"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary-50 p-3 text-primary-600">{icon}</span>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-2 text-sm text-gray-600">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-primary-500">→</span>
            {b}
          </li>
        ))}
      </ul>
    </Link>
  );
}

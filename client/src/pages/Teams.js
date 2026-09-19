import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiUsers, HiPlus, HiLightningBolt, HiUserGroup,
  HiSparkles, HiClock, HiCheckCircle,
} from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const TEAM_STATUS_BADGE = {
  recruiting:  'bg-green-100 text-green-800',
  almost_full: 'bg-yellow-100 text-yellow-800',
  full:        'bg-red-100 text-red-800',
  closed:      'bg-gray-100 text-gray-600',
};

const PRIORITY_BADGE = {
  high:   'bg-red-100 text-red-800',
  medium: 'badge-skills',
  low:    'bg-gray-100 text-gray-600',
};

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Subtract matchedSkills from requiredSkills (both plain string arrays). */
function stillNeeded(requiredSkills = [], matchedSkills = []) {
  const matched = new Set(matchedSkills.map((s) => s.toLowerCase()));
  return requiredSkills.filter((s) => !matched.has(s.toLowerCase()));
}

/* ─────────────────────────────────────────────
   Request-to-Join button
   Tracks per-teamId state: idle | sending | sent | error-code
───────────────────────────────────────────── */

// Error codes that should replace the button with an informative label
// rather than showing a toast.
const SILENT_CODES = new Set(['DUPLICATE_REQUEST', 'ALREADY_MEMBER', 'TEAM_FULL', 'NOT_ELIGIBLE']);

const SILENT_LABEL = {
  DUPLICATE_REQUEST: 'Already requested',
  ALREADY_MEMBER:    'Already a member',
  TEAM_FULL:         'Team is full',
  NOT_ELIGIBLE:      'Not eligible',
};

function JoinButton({ teamId, requestedTeams, onRequest }) {
  const state = requestedTeams[teamId];

  if (state === 'sent') {
    return (
      <span className="badge bg-green-100 text-green-800 flex items-center gap-1">
        <HiCheckCircle className="h-4 w-4" /> Request sent
      </span>
    );
  }

  if (SILENT_CODES.has(state)) {
    return (
      <span className="badge bg-gray-100 text-gray-600">
        {SILENT_LABEL[state]}
      </span>
    );
  }

  const sending = state === 'sending';
  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // cards are wrapped in <Link> — stop propagation
        e.stopPropagation();
        onRequest(teamId);
      }}
      disabled={sending}
      className="btn-primary flex items-center gap-1 text-sm"
    >
      {sending ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : (
        <><HiUsers className="h-4 w-4" /> Request to Join</>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Recommended team card
───────────────────────────────────────────── */

function RecommendedCard({ rec, requestedTeams, onRequest }) {
  const needed = stillNeeded(rec.requiredSkills, rec.matchedSkills);
  const deadline = fmt(rec.deadline);
  const statusCls = rec.status ? (TEAM_STATUS_BADGE[rec.status] || 'bg-gray-100 text-gray-600') : null;

  return (
    <div className="card flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/teams/${rec.teamId}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {rec.name}
          </Link>
          {rec.competitionName && (
            <p className="text-sm text-gray-500 mt-0.5">{rec.competitionName}</p>
          )}
        </div>
        {statusCls && (
          <span className={`badge ${statusCls} capitalize flex-shrink-0`}>
            {rec.status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* AI reason — the key "AI recommends, humans decide" signal */}
      {rec.matchReason && (
        <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
          <HiLightningBolt className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary-800">{rec.matchReason}</p>
        </div>
      )}

      {/* Skills rows */}
      <div className="space-y-2">
        {rec.matchedSkills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
              Your match
            </p>
            <div className="flex flex-wrap gap-1">
              {rec.matchedSkills.map((s) => (
                <span key={s} className="badge bg-green-100 text-green-800 text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}
        {needed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Still needed
            </p>
            <div className="flex flex-wrap gap-1">
              {needed.map((s) => (
                <span key={s} className="badge badge-skills text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <HiUsers className="h-4 w-4" />
            {rec.memberCount ?? '?'} / {rec.maxMembers ?? '?'}
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <HiClock className="h-4 w-4" />
              {deadline}
            </span>
          )}
        </div>
        <JoinButton
          teamId={rec.teamId}
          requestedTeams={requestedTeams}
          onRequest={onRequest}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Browse team card
───────────────────────────────────────────── */

function BrowseCard({ team, requestedTeams, onRequest }) {
  const deadline = fmt(team.deadline);
  const statusCls = TEAM_STATUS_BADGE[team.status] || 'bg-gray-100 text-gray-600';

  return (
    <div className="card flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/teams/${team.teamId}`}
            className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {team.name}
          </Link>
          {team.competitionName && (
            <p className="text-sm text-gray-500 mt-0.5">{team.competitionName}</p>
          )}
        </div>
        <span className={`badge ${statusCls} capitalize flex-shrink-0`}>
          {team.status?.replace('_', ' ')}
        </span>
      </div>

      {/* Required skills (object array — use s.skill) */}
      {team.requiredSkills?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Required skills
          </p>
          <div className="flex flex-wrap gap-1">
            {team.requiredSkills.map((s) => (
              <span
                key={s.skill}
                className={`badge text-xs ${PRIORITY_BADGE[s.priority] || 'badge-skills'}`}
              >
                {s.skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills still remaining (gap) */}
      {team.remaining?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">
            Still needed
          </p>
          <div className="flex flex-wrap gap-1">
            {team.remaining.map((s) => (
              <span key={s} className="badge bg-red-100 text-red-800 text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <HiUsers className="h-4 w-4" />
            {team.memberCount ?? '?'} / {team.maxMembers ?? '?'}
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <HiClock className="h-4 w-4" />
              {deadline}
            </span>
          )}
        </div>
        <JoinButton
          teamId={team.teamId}
          requestedTeams={requestedTeams}
          onRequest={onRequest}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Teams page
───────────────────────────────────────────── */

export default function Teams() {
  const { user, profileComplete } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [browseTeams, setBrowseTeams]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  // Map of teamId → 'idle' | 'sending' | 'sent' | error-code string
  const [requestedTeams, setRequestedTeams]   = useState({});

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, browseRes] = await Promise.all([
        api.getRecommendedTeams(user.userId),
        api.browseTeams(),
      ]);
      setRecommendations(recRes.recommendations || []);
      setBrowseTeams(browseRes.teams || []);
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Join request ──────────────────────────────────────────────────────────

  const handleRequest = useCallback(async (teamId) => {
    setRequestedTeams((prev) => ({ ...prev, [teamId]: 'sending' }));
    try {
      await api.sendJoinRequest(teamId);
      toast.success('Join request sent!');
      setRequestedTeams((prev) => ({ ...prev, [teamId]: 'sent' }));
    } catch (e) {
      const code = api.errorCode(e);
      if (SILENT_CODES.has(code)) {
        // Replace button with informative label — no toast needed
        setRequestedTeams((prev) => ({ ...prev, [teamId]: code }));
      } else {
        toast.error(api.readError(e));
        setRequestedTeams((prev) => ({ ...prev, [teamId]: 'idle' }));
      }
    }
  }, []);

  // ── Recommended team IDs (to deduplicate browse list) ────────────────────

  const recommendedIds = new Set(recommendations.map((r) => r.teamId));

  // ── Browse list with recommended teams removed ────────────────────────────

  const browseDeduplicated = browseTeams.filter((t) => !recommendedIds.has(t.teamId));

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HiUserGroup className="text-primary-600 h-8 w-8" />
              Find a Team
            </h1>
            <p className="text-gray-500 mt-1">
              AI recommends. You decide.
            </p>
          </div>
          <Link to="/teams/new" className="btn-primary flex items-center gap-2 flex-shrink-0">
            <HiPlus className="h-5 w-5" /> Create a Team
          </Link>
        </div>

        {/* ══════════════════════════════════════════
            RECOMMENDED FOR YOU
        ══════════════════════════════════════════ */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiSparkles className="h-5 w-5 text-primary-500" />
            Recommended for you
          </h2>

          {recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {recommendations.map((rec) => (
                <RecommendedCard
                  key={rec.teamId}
                  rec={rec}
                  requestedTeams={requestedTeams}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-10">
              <HiSparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              {profileComplete ? (
                <>
                  <p className="text-gray-600 font-medium">No recommended teams right now.</p>
                  <p className="text-gray-400 text-sm mt-1">
                    Check back later or browse all open teams below.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-gray-600 font-medium">
                    Complete your profile to get personalized team recommendations.
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Skills and institution are needed for matching.
                  </p>
                  <Link to="/profile" className="btn-primary mt-4 inline-block">
                    Complete profile
                  </Link>
                </>
              )}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════
            ALL OPEN TEAMS
        ══════════════════════════════════════════ */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HiUsers className="h-5 w-5 text-gray-600" />
            All open teams
          </h2>

          {browseDeduplicated.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {browseDeduplicated.map((team) => (
                <BrowseCard
                  key={team.teamId}
                  team={team}
                  requestedTeams={requestedTeams}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          ) : browseTeams.length > 0 && browseDeduplicated.length === 0 ? (
            /* All open teams are already shown in the recommended section */
            <div className="card text-center py-8">
              <p className="text-gray-500 text-sm">
                All open teams are already shown in your recommendations above.
              </p>
            </div>
          ) : (
            <div className="card text-center py-10">
              <HiUsers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No open teams at the moment.</p>
              <p className="text-gray-400 text-sm mt-1">Be the first to start one.</p>
              <Link to="/teams/new" className="btn-primary mt-4 inline-block">
                Create a Team
              </Link>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

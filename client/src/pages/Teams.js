import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiUsers, HiPlus, HiLightningBolt, HiUserGroup,
  HiClock, HiCheckCircle, HiArrowRight,
} from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

const STATUS_CFG = {
  recruiting:  { label: 'Recruiting',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  almost_full: { label: 'Almost full', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  full:        { label: 'Full',        cls: 'bg-red-50 text-red-700 border border-red-200' },
  closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-500' },
};

const SILENT_CODES = new Set(['DUPLICATE_REQUEST', 'ALREADY_MEMBER', 'TEAM_FULL', 'NOT_ELIGIBLE']);
const SILENT_LABEL = {
  DUPLICATE_REQUEST: 'Already requested',
  ALREADY_MEMBER:    'Already a member',
  TEAM_FULL:         'Team is full',
  NOT_ELIGIBLE:      'Not eligible',
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function stillNeeded(required = [], matched = []) {
  const m = new Set(matched.map((s) => s.toLowerCase()));
  return required.filter((s) => !m.has(s.toLowerCase()));
}

/* ─────────────────────────────────────────────
   Join button — tracks per-team state
───────────────────────────────────────────── */

function JoinButton({ teamId, state, onRequest }) {
  if (state === 'sent') {
    return (
      <span className="badge bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
        <HiCheckCircle className="h-3.5 w-3.5" /> Requested
      </span>
    );
  }
  if (SILENT_CODES.has(state)) {
    return <span className="badge bg-gray-100 text-gray-500">{SILENT_LABEL[state]}</span>;
  }
  const busy = state === 'sending';
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequest(teamId); }}
      disabled={busy}
      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
    >
      {busy
        ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <HiUsers className="h-3.5 w-3.5" />}
      {busy ? 'Sending…' : 'Request to join'}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Recommended card
───────────────────────────────────────────── */

function RecommendedCard({ rec, reqState, onRequest }) {
  const needed   = stillNeeded(rec.requiredSkills, rec.matchedSkills);
  const deadline = fmt(rec.deadline);

  return (
    <div className="card flex flex-col gap-3 hover:border-primary-200 hover:shadow-md transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/teams/${rec.teamId}`}
            className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {rec.name}
          </Link>
          {rec.competitionName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{rec.competitionName}</p>
          )}
        </div>
        {rec.status && <StatusBadge status={rec.status} />}
      </div>

      {/* AI reason */}
      {rec.matchReason && (
        <div className="highlight-box">
          <HiLightningBolt className="h-3.5 w-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary-800 leading-relaxed">{rec.matchReason}</p>
        </div>
      )}

      {/* Skills */}
      <div className="space-y-2">
        {rec.matchedSkills?.length > 0 && (
          <div>
            <p className="tag-label text-green-700">Your match</p>
            <div className="flex flex-wrap gap-1">
              {rec.matchedSkills.map((s) => (
                <span key={s} className="badge bg-green-50 text-green-700 border border-green-200 text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}
        {needed.length > 0 && (
          <div>
            <p className="tag-label text-gray-500">Still needed</p>
            <div className="flex flex-wrap gap-1">
              {needed.map((s) => (
                <span key={s} className="badge badge-skills text-xs">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
        <div className="meta-row text-xs">
          <span className="flex items-center gap-1">
            <HiUsers className="h-3.5 w-3.5" />
            {rec.memberCount ?? '?'}/{rec.maxMembers ?? '?'}
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <HiClock className="h-3.5 w-3.5" /> {deadline}
            </span>
          )}
        </div>
        <JoinButton teamId={rec.teamId} state={reqState} onRequest={onRequest} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Browse card
───────────────────────────────────────────── */

function BrowseCard({ team, reqState, onRequest }) {
  const deadline = fmt(team.deadline);

  return (
    <div className="card flex flex-col gap-3 hover:border-gray-300 hover:shadow-md transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <Link
            to={`/teams/${team.teamId}`}
            className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            {team.name}
          </Link>
          {team.competitionName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{team.competitionName}</p>
          )}
        </div>
        <StatusBadge status={team.status} />
      </div>

      {/* Required skills */}
      {team.requiredSkills?.length > 0 && (
        <div>
          <p className="tag-label text-gray-500">Required</p>
          <div className="flex flex-wrap gap-1">
            {team.requiredSkills.map((s) => (
              <span
                key={s.skill}
                className={`badge text-xs ${
                  s.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' : 'badge-skills'
                }`}
              >
                {s.skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Remaining gap */}
      {team.remaining?.length > 0 && (
        <div>
          <p className="tag-label text-red-700">Still needed</p>
          <div className="flex flex-wrap gap-1">
            {team.remaining.map((s) => (
              <span key={s} className="badge bg-red-50 text-red-700 border border-red-100 text-xs">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 flex-wrap gap-2">
        <div className="meta-row text-xs">
          <span className="flex items-center gap-1">
            <HiUsers className="h-3.5 w-3.5" />
            {team.memberCount ?? '?'}/{team.maxMembers ?? '?'}
          </span>
          {deadline && (
            <span className="flex items-center gap-1">
              <HiClock className="h-3.5 w-3.5" /> {deadline}
            </span>
          )}
        </div>
        <JoinButton teamId={team.teamId} state={reqState} onRequest={onRequest} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

export default function Teams() {
  const { user, profileComplete } = useAuth();

  const [recommendations, setRecommendations] = useState([]);
  const [browseTeams, setBrowseTeams]         = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [requestedTeams, setRequestedTeams]   = useState({});

  /* ── Load ── */
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

  useEffect(() => { load(); }, [load]);

  /* ── Request ── */
  const handleRequest = useCallback(async (teamId) => {
    setRequestedTeams((prev) => ({ ...prev, [teamId]: 'sending' }));
    try {
      await api.sendJoinRequest(teamId);
      toast.success('Join request sent!');
      setRequestedTeams((prev) => ({ ...prev, [teamId]: 'sent' }));
    } catch (e) {
      const code = api.errorCode(e);
      if (SILENT_CODES.has(code)) {
        setRequestedTeams((prev) => ({ ...prev, [teamId]: code }));
      } else {
        toast.error(api.readError(e));
        setRequestedTeams((prev) => ({ ...prev, [teamId]: 'idle' }));
      }
    }
  }, []);

  const recommendedIds      = new Set(recommendations.map((r) => r.teamId));
  const browseDeduplicated  = browseTeams.filter((t) => !recommendedIds.has(t.teamId));

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-content">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HiUserGroup className="h-5 w-5 text-primary-600" /> Find a Team
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">AI recommends. You decide.</p>
          </div>
          <Link to="/teams/new" className="btn-secondary flex items-center gap-1.5">
            <HiPlus className="h-4 w-4" /> Create a team
          </Link>
        </div>

        {/* ── Recommended section ── */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <HiLightningBolt className="h-4 w-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-gray-900">Recommended for you</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Based on your profile skills.</p>

          {recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <RecommendedCard
                  key={rec.teamId}
                  rec={rec}
                  reqState={requestedTeams[rec.teamId] || 'idle'}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          ) : (
            <div className="card-sm text-center py-8">
              {profileComplete ? (
                <>
                  <p className="text-sm font-medium text-gray-600">No recommended teams right now.</p>
                  <p className="text-xs text-gray-400 mt-1">Check back later, or browse all open teams below.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">Complete your profile to get recommendations.</p>
                  <p className="text-xs text-gray-400 mt-1">Skills and institution are required for matching.</p>
                  <Link to="/profile" className="btn-primary mt-4 inline-flex items-center gap-1.5">
                    Complete profile <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── All open teams ── */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiUsers className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">All open teams</h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">Every team currently recruiting.</p>

          {browseDeduplicated.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {browseDeduplicated.map((team) => (
                <BrowseCard
                  key={team.teamId}
                  team={team}
                  reqState={requestedTeams[team.teamId] || 'idle'}
                  onRequest={handleRequest}
                />
              ))}
            </div>
          ) : browseTeams.length > 0 ? (
            <div className="card-sm text-center py-6">
              <p className="text-sm text-gray-500">All open teams are already shown in your recommendations above.</p>
            </div>
          ) : (
            <div className="card-sm text-center py-8">
              <HiUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No open teams at the moment.</p>
              <Link to="/teams/new" className="btn-primary mt-4 inline-flex items-center gap-1.5">
                Create a team <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

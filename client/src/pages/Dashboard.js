import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiUsers, HiLightningBolt, HiCheckCircle, HiXCircle,
  HiClock, HiArrowRight, HiUserGroup,
} from 'react-icons/hi';
import { Spinner } from './Login';
import ContactLinks from '../components/ContactLinks';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const STATUS_BADGE = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  accepted:  'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-red-50 text-red-700 border border-red-100',
  declined:  'bg-red-50 text-red-700 border border-red-100',
  cancelled: 'bg-gray-100 text-gray-500',
};

const TEAM_STATUS_BADGE = {
  recruiting:  'bg-green-50 text-green-700 border border-green-200',
  almost_full: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  full:        'bg-red-50 text-red-700 border border-red-100',
  closed:      'bg-gray-100 text-gray-500',
};

function StatusBadge({ status, map = STATUS_BADGE }) {
  const cls = map[status] || 'bg-gray-100 text-gray-500';
  return <span className={`badge ${cls} capitalize`}>{status?.replace('_', ' ')}</span>;
}

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Client-side intersection of candidate skills with required skills. */
function matchedSkills(candidateSkills = [], requiredSkills = []) {
  const req = requiredSkills.map((r) =>
    (typeof r === 'string' ? r : r.skill).toLowerCase()
  );
  return candidateSkills.filter((s) => req.includes(s.toLowerCase()));
}

/**
 * A team name that opens the team page.
 *
 * Invitation and join-request rows name a team but gave you no way to look at
 * it, so you had to accept or decline on the strength of the name alone. The
 * plain-text fallback matters: a row whose team has since been deleted still
 * has a name but no teamId to link to.
 */
function TeamLink({ teamId, name, className = 'text-sm font-semibold text-gray-900' }) {
  if (!name) return null;
  if (!teamId) return <p className={className}>{name}</p>;
  return (
    <Link to={`/teams/${teamId}`} className={`block ${className} hover:text-primary-600 hover:underline transition-colors`}>
      {name}
    </Link>
  );
}

/* ─────────────────────────────────────────────
   Skill Gap bar (compact, for dashboard)
───────────────────────────────────────────── */

function SkillGapCompact({ gap }) {
  if (!gap) return null;
  const pct = gap.coveragePercent ?? 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Skill coverage</span>
        <span className="font-semibold text-primary-600">{pct}%</span>
      </div>
      <div className="gap-track mb-3">
        <div className="gap-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="tag-label text-green-700">Covered</p>
          {gap.covered?.length > 0
            ? <div className="flex flex-wrap gap-1">{gap.covered.map((s) => <span key={s} className="badge bg-green-50 text-green-700 border border-green-200 text-xs">{s}</span>)}</div>
            : <p className="text-xs text-gray-400">None yet</p>}
        </div>
        <div>
          <p className="tag-label text-red-700">Still needed</p>
          {gap.remaining?.length > 0
            ? <div className="flex flex-wrap gap-1">{gap.remaining.map((s) => <span key={s} className="badge bg-red-50 text-red-700 border border-red-100 text-xs">{s}</span>)}</div>
            : <p className="text-xs text-green-700 font-medium">Gap closed!</p>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Panel wrapper
───────────────────────────────────────────── */

function Panel({ title, icon, count, children }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {count !== undefined && (
          <span className="ml-auto badge bg-gray-100 text-gray-600">{count}</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard
───────────────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth();

  const [indiv, setIndiv]   = useState(null);
  const [leader, setLeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);

  /* ── Fetch ── */
  const fetchIndiv = useCallback(async () => {
    const data = await api.getIndividualDashboard(user.userId);
    setIndiv(data);
    return data;
  }, [user.userId]);

  const fetchLeader = useCallback(async (teamId) => {
    const data = await api.getLeaderDashboard(teamId);
    setLeader(data);
    return data;
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchIndiv();
    if (data.currentTeam?.leaderId === user.userId) {
      await fetchLeader(data.currentTeam.teamId);
    } else {
      setLeader(null);
    }
  }, [fetchIndiv, fetchLeader, user.userId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refresh()
      .catch((e) => toast.error(api.readError(e)))
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line

  const act = async (id, fn) => {
    setActing(id);
    try { await fn(); await refresh(); }
    catch (e) { toast.error(api.readError(e)); }
    finally { setActing(null); }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const isLeader = indiv?.currentTeam?.leaderId === user?.userId;

  return (
    <div className="page-shell">
      <div className="page-content">

        {/* Header */}
        <div className="mb-7">
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLeader
              ? 'Review your team skill gap, incoming requests, and sent invitations.'
              : 'Track your invitations and join requests.'}
          </p>
        </div>

        <div className="space-y-5">

          {/* ══ Current Team ══ */}
          <Panel title="Your Team" icon={<HiUserGroup className="h-4 w-4" />}>
            {indiv?.currentTeam ? (
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <TeamLink
                    teamId={indiv.currentTeam.teamId}
                    name={indiv.currentTeam.name}
                    className="font-semibold text-gray-900"
                  />
                  {indiv.currentTeam.competition?.name && (
                    <p className="text-xs text-gray-500 mt-0.5">{indiv.currentTeam.competition.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <StatusBadge status={indiv.currentTeam.status} map={TEAM_STATUS_BADGE} />
                    {indiv.currentTeam.members && (
                      <span className="text-xs text-gray-400">
                        {indiv.currentTeam.members.length} / {indiv.currentTeam.maxMembers} members
                      </span>
                    )}
                    {isLeader && (
                      <span className="badge bg-primary-50 text-primary-700 border border-primary-100">Leader</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/teams/${indiv.currentTeam.teamId}`}
                  className="btn-secondary flex items-center gap-1.5 flex-shrink-0 text-xs"
                >
                  View team <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6">
                <HiUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">You are not on a team yet.</p>
                <Link to="/choose" className="btn-primary inline-flex items-center gap-1.5">
                  Find or create a team <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </Panel>

          {/* ══ LEADER PANELS ══ */}
          {isLeader && leader && (
            <>
              {/* Skill Gap */}
              <Panel title="Skill Gap" icon={<HiLightningBolt className="h-4 w-4" />}>
                <SkillGapCompact gap={leader.skillGap} />
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link
                    to={`/teams/${leader.teamId}`}
                    className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                  >
                    View candidate recommendations <HiArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Panel>

              {/* Pending Join Requests */}
              <Panel
                title="Join Requests"
                icon={<HiClock className="h-4 w-4" />}
                count={leader.pendingJoinRequests?.length ?? 0}
              >
                {leader.pendingJoinRequests?.length > 0 ? (
                  <div className="space-y-3">
                    {leader.pendingJoinRequests.map((req) => {
                      const matched = matchedSkills(req.skills, indiv.currentTeam?.requiredSkills);
                      return (
                        <div key={req.requestId} className="border border-gray-100 rounded-lg p-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900">{req.name}</p>
                              {req.collegeName && <p className="text-xs text-gray-400">{req.collegeName}</p>}
                              {req.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {req.skills.map((s) => (
                                    <span
                                      key={s}
                                      className={`badge text-xs ${
                                        matched.includes(s)
                                          ? 'bg-green-50 text-green-700 border border-green-200'
                                          : 'badge-skills'
                                      }`}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {matched.length > 0 && (
                                <p className="text-xs text-green-700 mt-1">Fills: {matched.join(', ')}</p>
                              )}
                              {/* They asked to join, so they have already
                                  reached out - you can answer before you
                                  decide, instead of only after. */}
                              <ContactLinks person={req} />
                              <p className="text-xs text-gray-400 mt-1">{fmt(req.createdAt)}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => act(req.requestId, () => api.approveJoinRequest(req.requestId))}
                                disabled={acting === req.requestId}
                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                {acting === req.requestId
                                  ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <HiCheckCircle className="h-3.5 w-3.5" />}
                                Approve
                              </button>
                              <button
                                onClick={() => act(req.requestId + '_r', () => api.rejectJoinRequest(req.requestId))}
                                disabled={acting === req.requestId + '_r'}
                                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                {acting === req.requestId + '_r'
                                  ? <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                  : <HiXCircle className="h-3.5 w-3.5" />}
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-3 text-center">No pending join requests.</p>
                )}
              </Panel>

              {/* Sent Invitations */}
              <Panel
                title="Sent Invitations"
                icon={<HiLightningBolt className="h-4 w-4" />}
                count={leader.sentInvitations?.length ?? 0}
              >
                {leader.sentInvitations?.length > 0 ? (
                  <div className="space-y-2">
                    {leader.sentInvitations.map((inv) => (
                      <div
                        key={inv.invitationId}
                        className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                          <ContactLinks person={inv} className="mt-1" />
                          <p className="text-xs text-gray-400 mt-1">{fmt(inv.createdAt)}</p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-3 text-center">
                    No invitations sent yet.{' '}
                    <Link to={`/teams/${leader.teamId}`} className="text-primary-600 hover:underline">
                      View candidates
                    </Link>
                  </p>
                )}
              </Panel>
            </>
          )}

          {/* ══ INDIVIDUAL PANELS ══ */}
          {!isLeader && (
            <>
              {/* Received Invitations */}
              <Panel
                title="Invitations"
                icon={<HiLightningBolt className="h-4 w-4" />}
                count={indiv?.receivedInvitations?.length ?? 0}
              >
                {indiv?.receivedInvitations?.length > 0 ? (
                  <div className="space-y-3">
                    {indiv.receivedInvitations.map((inv) => (
                      <div key={inv.invitationId} className="border border-gray-100 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <TeamLink teamId={inv.teamId} name={inv.teamName} />
                            {inv.competitionName && (
                              <p className="text-xs text-gray-500 mt-0.5">{inv.competitionName}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <StatusBadge status={inv.status} />
                              <span className="text-xs text-gray-400">{fmt(inv.createdAt)}</span>
                            </div>
                          </div>
                          {inv.status === 'pending' && (
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => act(inv.invitationId, () => api.acceptInvitation(inv.invitationId))}
                                disabled={acting === inv.invitationId}
                                className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                {acting === inv.invitationId
                                  ? <Spinner />
                                  : <HiCheckCircle className="h-3.5 w-3.5" />}
                                Accept
                              </button>
                              <button
                                onClick={() => act(inv.invitationId + '_d', () => api.declineInvitation(inv.invitationId))}
                                disabled={acting === inv.invitationId + '_d'}
                                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                              >
                                {acting === inv.invitationId + '_d'
                                  ? <span className="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                  : <HiXCircle className="h-3.5 w-3.5" />}
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-3 text-center">
                    No invitations yet.{' '}
                    <Link to="/teams" className="text-primary-600 hover:underline">Browse teams</Link>
                  </p>
                )}
              </Panel>

              {/* Sent Join Requests */}
              <Panel
                title="Sent Join Requests"
                icon={<HiClock className="h-4 w-4" />}
                count={indiv?.sentJoinRequests?.length ?? 0}
              >
                {indiv?.sentJoinRequests?.length > 0 ? (
                  <div className="space-y-2">
                    {indiv.sentJoinRequests.map((req) => (
                      <div
                        key={req.requestId}
                        className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5 flex-wrap gap-2"
                      >
                        <div>
                          <TeamLink teamId={req.teamId} name={req.teamName} className="text-sm font-medium text-gray-900" />
                          {req.competitionName && (
                            <p className="text-xs text-gray-500">{req.competitionName}</p>
                          )}
                          <p className="text-xs text-gray-400">{fmt(req.createdAt)}</p>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-3 text-center">
                    No join requests sent.{' '}
                    <Link to="/teams" className="text-primary-600 hover:underline">Browse teams</Link>
                  </p>
                )}
              </Panel>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

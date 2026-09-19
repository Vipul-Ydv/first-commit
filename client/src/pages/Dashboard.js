import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiUsers, HiLightningBolt, HiCheckCircle, HiXCircle,
  HiClock, HiArrowRight, HiUserGroup, HiSparkles,
} from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const STATUS_BADGE = {
  pending:   'bg-yellow-100 text-yellow-800',
  accepted:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  declined:  'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const TEAM_STATUS_BADGE = {
  recruiting:  'bg-green-100 text-green-800',
  almost_full: 'bg-yellow-100 text-yellow-800',
  full:        'bg-red-100 text-red-800',
  closed:      'bg-gray-100 text-gray-600',
};

function StatusBadge({ status, map = STATUS_BADGE }) {
  const cls = map[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${cls} capitalize`}>{status}</span>
  );
}

/** Intersect a candidate's skills with the team's required skills list. */
function matchedSkills(candidateSkills = [], requiredSkills = []) {
  const required = requiredSkills.map((r) =>
    (typeof r === 'string' ? r : r.skill).toLowerCase()
  );
  return candidateSkills.filter((s) => required.includes(s.toLowerCase()));
}

function fmt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/* ─────────────────────────────────────────────
   Skill Gap Bar
───────────────────────────────────────────── */
function SkillGap({ gap }) {
  if (!gap) return null;
  const pct = gap.coveragePercent ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Skill coverage</span>
        <span className="text-sm font-semibold text-primary-600">{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">
            Covered
          </p>
          {gap.covered?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {gap.covered.map((s) => (
                <span key={s} className="badge bg-green-100 text-green-800 text-xs">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">None yet</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">
            Still needed
          </p>
          {gap.remaining?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {gap.remaining.map((s) => (
                <span key={s} className="badge bg-red-100 text-red-800 text-xs">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Gap closed!</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Section wrapper
───────────────────────────────────────────── */
function Section({ title, icon, children }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Dashboard
───────────────────────────────────────────── */
export default function Dashboard() {
  const { user } = useAuth();

  const [indiv, setIndiv]         = useState(null);   // individual dashboard data
  const [leader, setLeader]       = useState(null);   // leader dashboard data
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);   // id of whichever button is in-flight

  // ── Fetch helpers ──────────────────────────────────────────────────────────

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

  // ── Initial load ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refresh()
      .catch((e) => toast.error(api.readError(e)))
      .finally(() => setLoading(false));
  }, [user]); // eslint-disable-line

  // ── Action helpers ─────────────────────────────────────────────────────────

  const act = async (id, fn) => {
    setActing(id);
    try {
      await fn();
      await refresh();
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setActing(null);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  const isLeader = indiv?.currentTeam?.leaderId === user?.userId;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Welcome header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h1>
          <p className="text-gray-500 mt-1">
            {isLeader
              ? 'You are leading a team. Review your skill gap and incoming requests below.'
              : 'Track your invitations, join requests, and team status.'}
          </p>
        </div>

        <div className="space-y-6">

          {/* ══════════════════════════════════════════
              CURRENT TEAM
          ══════════════════════════════════════════ */}
          <Section
            title="Your Team"
            icon={<HiUserGroup className="h-5 w-5 text-primary-600" />}
          >
            {indiv?.currentTeam ? (
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xl font-semibold text-gray-900">
                    {indiv.currentTeam.name}
                  </p>
                  {indiv.currentTeam.competition?.name && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {indiv.currentTeam.competition.name}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <StatusBadge
                      status={indiv.currentTeam.status}
                      map={TEAM_STATUS_BADGE}
                    />
                    {indiv.currentTeam.members && (
                      <span className="text-sm text-gray-500">
                        {indiv.currentTeam.members.length} / {indiv.currentTeam.maxMembers} members
                      </span>
                    )}
                    {isLeader && (
                      <span className="badge bg-primary-100 text-primary-700">You are the leader</span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/teams/${indiv.currentTeam.teamId}`}
                  className="btn-primary flex items-center gap-2 flex-shrink-0"
                >
                  View team <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <HiUsers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">You are not on a team yet.</p>
                <Link to="/choose" className="btn-primary">
                  Find or create a team
                </Link>
              </div>
            )}
          </Section>

          {/* ══════════════════════════════════════════
              LEADER PANEL  (only when user leads)
          ══════════════════════════════════════════ */}
          {isLeader && leader && (
            <>
              {/* Skill Gap */}
              <Section
                title="Skill Gap"
                icon={<HiSparkles className="h-5 w-5 text-aws-orange" />}
              >
                <SkillGap gap={leader.skillGap} />
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link
                    to={`/teams/${leader.teamId}`}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                  >
                    View recommendations <HiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Section>

              {/* Pending join requests */}
              <Section
                title={`Join Requests (${leader.pendingJoinRequests?.length ?? 0} pending)`}
                icon={<HiClock className="h-5 w-5 text-yellow-500" />}
              >
                {leader.pendingJoinRequests?.length > 0 ? (
                  <div className="space-y-4">
                    {leader.pendingJoinRequests.map((req) => {
                      const matched = matchedSkills(
                        req.skills,
                        indiv.currentTeam?.requiredSkills
                      );
                      return (
                        <div
                          key={req.requestId}
                          className="border border-gray-100 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900">{req.name}</p>
                              {req.collegeName && (
                                <p className="text-xs text-gray-500 mt-0.5">{req.collegeName}</p>
                              )}
                              {/* All candidate skills */}
                              {req.skills?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {req.skills.map((s) => (
                                    <span
                                      key={s}
                                      className={`badge text-xs ${
                                        matched.includes(s)
                                          ? 'bg-green-100 text-green-800'
                                          : 'badge-skills'
                                      }`}
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {matched.length > 0 && (
                                <p className="text-xs text-green-700 mt-1">
                                  Fills: {matched.join(', ')}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{fmt(req.createdAt)}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() =>
                                  act(req.requestId, () => api.approveJoinRequest(req.requestId))
                                }
                                disabled={acting === req.requestId}
                                className="btn-primary flex items-center gap-1 text-sm px-4 py-2"
                              >
                                {acting === req.requestId ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                ) : (
                                  <><HiCheckCircle className="h-4 w-4" /> Approve</>
                                )}
                              </button>
                              <button
                                onClick={() =>
                                  act(req.requestId + '_r', () => api.rejectJoinRequest(req.requestId))
                                }
                                disabled={acting === req.requestId + '_r'}
                                className="btn-secondary flex items-center gap-1 text-sm px-4 py-2"
                              >
                                {acting === req.requestId + '_r' ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                                ) : (
                                  <><HiXCircle className="h-4 w-4" /> Reject</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    No pending join requests.
                  </p>
                )}
              </Section>

              {/* Sent invitations */}
              <Section
                title="Sent Invitations"
                icon={<HiLightningBolt className="h-5 w-5 text-primary-600" />}
              >
                {leader.sentInvitations?.length > 0 ? (
                  <div className="space-y-3">
                    {leader.sentInvitations.map((inv) => (
                      <div
                        key={inv.invitationId}
                        className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{inv.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{fmt(inv.createdAt)}</p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    No invitations sent yet.{' '}
                    <Link
                      to={`/teams/${leader.teamId}`}
                      className="text-primary-600 hover:underline"
                    >
                      View candidates
                    </Link>
                  </p>
                )}
              </Section>
            </>
          )}

          {/* ══════════════════════════════════════════
              RECEIVED INVITATIONS  (individual side)
          ══════════════════════════════════════════ */}
          {!isLeader && (
            <Section
              title="Invitations"
              icon={<HiLightningBolt className="h-5 w-5 text-primary-600" />}
            >
              {indiv?.receivedInvitations?.length > 0 ? (
                <div className="space-y-4">
                  {indiv.receivedInvitations.map((inv) => (
                    <div
                      key={inv.invitationId}
                      className="border border-gray-100 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{inv.teamName}</p>
                          {inv.competitionName && (
                            <p className="text-sm text-gray-500 mt-0.5">{inv.competitionName}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <StatusBadge status={inv.status} />
                            <span className="text-xs text-gray-400">{fmt(inv.createdAt)}</span>
                          </div>
                        </div>
                        {inv.status === 'pending' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() =>
                                act(inv.invitationId, () => api.acceptInvitation(inv.invitationId))
                              }
                              disabled={acting === inv.invitationId}
                              className="btn-primary flex items-center gap-1 text-sm px-4 py-2"
                            >
                              {acting === inv.invitationId ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <><HiCheckCircle className="h-4 w-4" /> Accept</>
                              )}
                            </button>
                            <button
                              onClick={() =>
                                act(inv.invitationId + '_d', () => api.declineInvitation(inv.invitationId))
                              }
                              disabled={acting === inv.invitationId + '_d'}
                              className="btn-secondary flex items-center gap-1 text-sm px-4 py-2"
                            >
                              {acting === inv.invitationId + '_d' ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                              ) : (
                                <><HiXCircle className="h-4 w-4" /> Decline</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">
                  No invitations yet. Browse teams to find your match.
                </p>
              )}
            </Section>
          )}

          {/* ══════════════════════════════════════════
              SENT JOIN REQUESTS  (individual side)
          ══════════════════════════════════════════ */}
          {!isLeader && (
            <Section
              title="Sent Join Requests"
              icon={<HiClock className="h-5 w-5 text-yellow-500" />}
            >
              {indiv?.sentJoinRequests?.length > 0 ? (
                <div className="space-y-3">
                  {indiv.sentJoinRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3 flex-wrap gap-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{req.teamName}</p>
                        {req.competitionName && (
                          <p className="text-xs text-gray-500 mt-0.5">{req.competitionName}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(req.createdAt)}</p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm py-4 text-center">
                  No join requests sent.{' '}
                  <Link to="/teams" className="text-primary-600 hover:underline">
                    Browse teams
                  </Link>
                </p>
              )}
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

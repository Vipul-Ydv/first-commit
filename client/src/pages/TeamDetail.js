import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiUsers, HiLightningBolt, HiSparkles,
  HiCheckCircle, HiClock, HiLink, HiUserGroup,
} from 'react-icons/hi';

/* ─────────────────────────────────────────────
   Constants / helpers
───────────────────────────────────────────── */

const STATUS_CFG = {
  recruiting:  { label: 'Recruiting',  cls: 'bg-green-100 text-green-800' },
  almost_full: { label: 'Almost Full', cls: 'bg-yellow-100 text-yellow-800' },
  full:        { label: 'Full',        cls: 'bg-red-100 text-red-800' },
  closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-600' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/* ─────────────────────────────────────────────
   Skill Gap display  (§4 — the money shot)
───────────────────────────────────────────── */

function SkillGap({ gap }) {
  if (!gap) return null;
  const pct = gap.coveragePercent ?? 0;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <HiSparkles className="h-5 w-5 text-primary-500" />
        Skill Gap
      </h2>

      {/* Coverage bar */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {gap.coveredCount} / {gap.requiredCount} skills covered
        </span>
        <span className="text-sm font-semibold text-primary-600">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-5">
        <div
          className="bg-primary-600 h-3 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Covered */}
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

        {/* Remaining */}
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
            <p className="text-xs text-green-700 font-medium">
              All required skills are covered ✓
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Member avatar initial
───────────────────────────────────────────── */

function Avatar({ name }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
      <span className="text-primary-600 font-semibold text-sm">{initial}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Join request button  (non-member view)
───────────────────────────────────────────── */

const JOIN_LABEL = {
  sending:          'Sending…',
  sent:             'Request Sent',
  DUPLICATE_REQUEST:'Request Already Sent',
  ALREADY_MEMBER:   'Already a Member',
  TEAM_FULL:        'Team Full',
  NOT_ELIGIBLE:     'Not Eligible',
};

const JOIN_CLS = {
  sent:             'badge bg-green-100 text-green-800',
  DUPLICATE_REQUEST:'badge bg-green-100 text-green-800',
  ALREADY_MEMBER:   'badge bg-gray-100 text-gray-600',
  TEAM_FULL:        'badge bg-red-100 text-red-800',
  NOT_ELIGIBLE:     'badge bg-yellow-100 text-yellow-800',
};

function JoinSection({ teamId, canRequest, isMember, onRefresh }) {
  const [state, setState] = useState('idle'); // idle|sending|sent|error-code

  const handleJoin = async () => {
    setState('sending');
    try {
      await api.sendJoinRequest(teamId);
      toast.success('Join request sent!');
      setState('sent');
      await onRefresh();
    } catch (e) {
      const code = api.errorCode(e);
      if (JOIN_LABEL[code]) {
        setState(code);
      } else {
        toast.error(api.readError(e));
        setState('idle');
      }
    }
  };

  if (isMember) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
        <HiCheckCircle className="h-5 w-5" />
        You are a member of this team
      </div>
    );
  }

  if (!canRequest) return null;

  if (state !== 'idle' && state !== 'sending') {
    const cls = JOIN_CLS[state] || 'badge bg-gray-100 text-gray-600';
    return <span className={cls}>{JOIN_LABEL[state] || state}</span>;
  }

  return (
    <button
      onClick={handleJoin}
      disabled={state === 'sending'}
      className="btn-primary flex items-center gap-2"
    >
      {state === 'sending' ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : (
        <HiUsers className="h-4 w-4" />
      )}
      {state === 'sending' ? 'Sending…' : 'Request to Join'}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Invite button  (per candidate)
───────────────────────────────────────────── */

const INV_LABEL = {
  inviting:          'Inviting…',
  invited:           'Invited',
  DUPLICATE_INVITATION: 'Already Invited',
  ALREADY_MEMBER:    'Already a Member',
  TEAM_FULL:         'Team Full',
  NOT_ELIGIBLE:      'Not Eligible',
};

const INV_CLS = {
  invited:              'badge bg-green-100 text-green-800',
  DUPLICATE_INVITATION: 'badge bg-green-100 text-green-800',
  ALREADY_MEMBER:       'badge bg-gray-100 text-gray-600',
  TEAM_FULL:            'badge bg-red-100 text-red-800',
  NOT_ELIGIBLE:         'badge bg-yellow-100 text-yellow-800',
};

function InviteButton({ teamId, candidateId, onRefresh }) {
  const [state, setState] = useState('idle');

  const handleInvite = async () => {
    setState('inviting');
    try {
      await api.sendInvitation(teamId, candidateId);
      toast.success('Invitation sent!');
      setState('invited');
      await onRefresh();
    } catch (e) {
      const code = api.errorCode(e);
      if (INV_LABEL[code]) {
        setState(code);
      } else {
        toast.error(api.readError(e));
        setState('idle');
      }
    }
  };

  if (state !== 'idle' && state !== 'inviting') {
    const cls = INV_CLS[state] || 'badge bg-gray-100 text-gray-600';
    return <span className={cls}>{INV_LABEL[state] || state}</span>;
  }

  return (
    <button
      onClick={handleInvite}
      disabled={state === 'inviting'}
      className="btn-primary flex items-center gap-1 text-sm"
    >
      {state === 'inviting' ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
      ) : (
        <HiLightningBolt className="h-4 w-4" />
      )}
      {state === 'inviting' ? 'Inviting…' : 'Invite'}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Candidate card
───────────────────────────────────────────── */

function CandidateCard({ candidate, teamId, onRefresh }) {
  const institution = candidate.collegeName || candidate.organizationName;

  return (
    <div className="card flex flex-col gap-3">
      {/* Name + institution */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{candidate.name}</p>
          {institution && (
            <p className="text-xs text-gray-500 mt-0.5">{institution}</p>
          )}
        </div>
        <InviteButton
          teamId={teamId}
          candidateId={candidate.userId}
          onRefresh={onRefresh}
        />
      </div>

      {/* AI match reason — the "AI recommends, humans decide" signal */}
      {candidate.matchReason && (
        <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
          <HiLightningBolt className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-primary-800">{candidate.matchReason}</p>
        </div>
      )}

      {/* Fills the gap — most important field */}
      {candidate.missingSkillsFilled?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
            Fills the gap
          </p>
          <div className="flex flex-wrap gap-1">
            {candidate.missingSkillsFilled.map((s) => (
              <span key={s} className="badge bg-green-100 text-green-800 text-xs font-semibold">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Other skills */}
      {candidate.skills?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            All skills
          </p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.map((s) => {
              const fills = candidate.missingSkillsFilled || [];
              const matched = candidate.matchedSkills || [];
              const isGapFill = fills.map(x => x.toLowerCase()).includes(s.toLowerCase());
              const isMatch = matched.map(x => x.toLowerCase()).includes(s.toLowerCase());
              const cls = isGapFill
                ? 'bg-green-100 text-green-800'
                : isMatch
                  ? 'badge-skills'
                  : 'bg-gray-100 text-gray-600';
              return (
                <span key={s} className={`badge text-xs ${cls}`}>{s}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary signals */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
        {candidate.availability && (
          <span className="flex items-center gap-1">
            <HiClock className="h-3.5 w-3.5" /> {candidate.availability}
          </span>
        )}
        {candidate.rolePreference?.length > 0 && (
          <span>{candidate.rolePreference.join(', ')}</span>
        )}
        {candidate.competitionPreferenceMatch && (
          <span className="badge bg-primary-100 text-primary-700 text-xs">
            Prefers this competition
          </span>
        )}
        {candidate.github && (
          <a
            href={candidate.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 hover:underline"
          >
            <HiLink className="h-3.5 w-3.5" /> GitHub
          </a>
        )}
        {candidate.linkedin && (
          <a
            href={candidate.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 hover:underline"
          >
            <HiLink className="h-3.5 w-3.5" /> LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   TeamDetail page
───────────────────────────────────────────── */

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam]           = useState(null);
  const [loadingTeam, setLoading] = useState(true);

  const [recData, setRecData]         = useState(null);   // { remainingGap, recommendations }
  const [loadingRec, setLoadingRec]   = useState(false);

  // ── Load team ────────────────────────────────────────────────────────────

  const loadTeam = useCallback(async () => {
    try {
      const data = await api.getTeam(id);
      setTeam(data);
      return data;
    } catch (e) {
      toast.error(api.readError(e));
      navigate('/teams');
      return null;
    }
  }, [id, navigate]);

  useEffect(() => {
    setLoading(true);
    loadTeam().finally(() => setLoading(false));
  }, [loadTeam]);

  // ── Load recommendations (leader only) ───────────────────────────────────

  useEffect(() => {
    if (!team) return;
    if (team.leaderId !== user?.userId) return;

    setLoadingRec(true);
    api
      .getCandidateRecommendations(id)
      .then(setRecData)
      .catch((e) => toast.error(api.readError(e)))
      .finally(() => setLoadingRec(false));
  }, [team, id, user]);  // eslint-disable-line

  // ── Refresh helper (passed to action buttons) ─────────────────────────────

  const refresh = useCallback(async () => {
    const updated = await loadTeam();
    return updated;
  }, [loadTeam]);

  // ── Loading screen ────────────────────────────────────────────────────────

  if (loadingTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!team) return null;

  // ── Derive role flags ─────────────────────────────────────────────────────

  const isMember  = team.members?.some((m) => m.userId === user?.userId) ?? false;
  const isLeader  = team.leaderId === user?.userId;
  const canRequest = !isMember && team.status !== 'full' && team.status !== 'closed';

  const openSlots = Math.max(0, (team.maxMembers ?? 0) - (team.members?.length ?? 0));
  const deadline  = fmt(team.competition?.deadline);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Back */}
        <Link
          to="/teams"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm"
        >
          <HiArrowLeft className="h-4 w-4" /> Back to Teams
        </Link>

        {/* ── Team header ── */}
        <div className="card mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <StatusBadge status={team.status} />
              </div>
              {team.competition ? (
                <p className="text-gray-500 mt-1">
                  {team.competition.name}
                  {deadline && (
                    <span className="ml-2 text-xs text-gray-400 flex items-center gap-1 inline-flex">
                      <HiClock className="h-3.5 w-3.5" /> {deadline}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-gray-400 text-sm mt-1">No competition attached</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {team.members?.length ?? 0} / {team.maxMembers} members
              </p>
            </div>

            {/* Join / member status */}
            <div className="flex-shrink-0">
              <JoinSection
                teamId={team.teamId}
                canRequest={canRequest}
                isMember={isMember}
                onRefresh={refresh}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">

          {/* ── Skill Gap (prominent) ── */}
          <SkillGap gap={team.skillGap} />

          {/* ── Members ── */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiUserGroup className="h-5 w-5 text-primary-600" />
              Members
            </h2>

            {team.members?.length > 0 ? (
              <div className="space-y-3">
                {team.members.map((member) => {
                  const institution = member.collegeName || member.organizationName;
                  return (
                    <div key={member.userId} className="flex items-start gap-3">
                      <Avatar name={member.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">
                            {member.name}
                          </span>
                          {member.isLeader && (
                            <span className="badge bg-primary-100 text-primary-700 text-xs">
                              Leader
                            </span>
                          )}
                          {member.userId === user?.userId && !member.isLeader && (
                            <span className="badge bg-gray-100 text-gray-600 text-xs">You</span>
                          )}
                        </div>
                        {institution && (
                          <p className="text-xs text-gray-400">{institution}</p>
                        )}
                        {member.skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.skills.map((s) => (
                              <span key={s} className="badge badge-skills text-xs">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No members yet.</p>
            )}

            {/* Open slots */}
            {openSlots > 0 && (
              <div className="mt-4 space-y-2">
                {Array.from({ length: openSlots }).map((_, i) => (
                  <div key={`slot-${i}`} className="flex items-center gap-3 opacity-50">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-sm">?</span>
                    </div>
                    <span className="text-sm text-gray-400">Open slot</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Required skills (reference) ── */}
          {team.requiredSkills?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {team.requiredSkills.map((r) => {
                  const isHigh = r.priority === 'high';
                  const cls = isHigh ? 'bg-red-100 text-red-800' : 'badge-skills';
                  return (
                    <span key={r.skill} className={`badge text-sm ${cls}`}>
                      {r.skill}
                      {isHigh && (
                        <span className="ml-1 text-xs opacity-70">high</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════
              LEADER ONLY — Candidate Recommendations
          ══════════════════════════════════════════ */}
          {isLeader && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiLightningBolt className="h-5 w-5 text-primary-500" />
                Candidate Recommendations
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                AI recommends. You decide. Each candidate below fills at least one of your remaining skill gaps.
              </p>

              {loadingRec ? (
                <div className="card flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              ) : recData?.recommendations?.length > 0 ? (
                <>
                  {/* Remaining gap context */}
                  {recData.remainingGap?.length > 0 && (
                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600 font-medium">Still looking for:</span>
                      {recData.remainingGap.map((s) => (
                        <span key={s} className="badge bg-red-100 text-red-800 text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-5">
                    {recData.recommendations.map((candidate) => (
                      <CandidateCard
                        key={candidate.userId}
                        candidate={candidate}
                        teamId={team.teamId}
                        onRefresh={refresh}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="card text-center py-10">
                  <HiUsers className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  {team.skillGap?.remaining?.length === 0 ? (
                    <p className="text-gray-600 font-medium">
                      All skill gaps are filled — no candidates needed.
                    </p>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">
                        No eligible candidates found right now.
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        Candidates must be from the same institution and eligible for the competition.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

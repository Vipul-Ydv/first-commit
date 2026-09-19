import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiArrowLeft, HiUsers, HiLightningBolt,
  HiCheckCircle, HiClock, HiLink, HiUserGroup,
} from 'react-icons/hi';
import { Spinner } from './Login';

/* ─────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────── */

const STATUS_CFG = {
  recruiting:  { label: 'Recruiting',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  almost_full: { label: 'Almost full', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  full:        { label: 'Full',        cls: 'bg-red-50 text-red-700 border border-red-200' },
  closed:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-500' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status, cls: 'bg-gray-100 text-gray-500' };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

function fmt(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Avatar({ name, size = 'md' }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const cls = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0`}>
      <span className="font-semibold text-primary-700 leading-none">{initial}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Skill Gap — the demo's money shot
───────────────────────────────────────────── */

function SkillGap({ gap }) {
  if (!gap) return null;
  const pct = gap.coveragePercent ?? 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-900">Skill Coverage</h2>
        <span className="text-sm font-bold text-primary-600">{pct}%</span>
      </div>

      {/* Bar */}
      <div className="gap-track mb-1">
        <div className="gap-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-400 mb-4">
        {gap.coveredCount} of {gap.requiredCount} required skills covered
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="tag-label text-green-700">Covered</p>
          {gap.covered?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {gap.covered.map((s) => (
                <span key={s} className="badge bg-green-50 text-green-700 border border-green-200 text-xs">{s}</span>
              ))}
            </div>
          ) : <p className="text-xs text-gray-400">None yet</p>}
        </div>
        <div>
          <p className="tag-label text-red-700">Still needed</p>
          {gap.remaining?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {gap.remaining.map((s) => (
                <span key={s} className="badge bg-red-50 text-red-700 border border-red-100 text-xs">{s}</span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green-700 font-medium flex items-center gap-1">
              <HiCheckCircle className="h-3.5 w-3.5" /> All skills covered
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Join button (non-member)
───────────────────────────────────────────── */

const JOIN_LABEL = {
  sent:             'Request sent',
  DUPLICATE_REQUEST:'Already requested',
  ALREADY_MEMBER:   'Already a member',
  TEAM_FULL:        'Team full',
  NOT_ELIGIBLE:     'Not eligible',
};
const JOIN_CLS = {
  sent:             'badge bg-green-50 text-green-700 border border-green-200',
  DUPLICATE_REQUEST:'badge bg-green-50 text-green-700 border border-green-200',
  ALREADY_MEMBER:   'badge bg-gray-100 text-gray-500',
  TEAM_FULL:        'badge bg-red-50 text-red-700 border border-red-100',
  NOT_ELIGIBLE:     'badge bg-yellow-50 text-yellow-700 border border-yellow-200',
};

function JoinSection({ teamId, canRequest, isMember, onRefresh }) {
  const [state, setState] = useState('idle');

  const handle = async () => {
    setState('sending');
    try {
      await api.sendJoinRequest(teamId);
      toast.success('Join request sent!');
      setState('sent');
      await onRefresh();
    } catch (e) {
      const code = api.errorCode(e);
      if (JOIN_LABEL[code]) setState(code);
      else { toast.error(api.readError(e)); setState('idle'); }
    }
  };

  if (isMember) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-green-700 font-medium">
        <HiCheckCircle className="h-4 w-4" /> Member
      </span>
    );
  }
  if (!canRequest) return null;
  if (state !== 'idle' && state !== 'sending') {
    return <span className={JOIN_CLS[state] || 'badge bg-gray-100 text-gray-500'}>{JOIN_LABEL[state] || state}</span>;
  }
  return (
    <button onClick={handle} disabled={state === 'sending'} className="btn-primary flex items-center gap-2">
      {state === 'sending' ? <><Spinner />Sending…</> : <><HiUsers className="h-4 w-4" />Request to Join</>}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Invite button (per candidate)
───────────────────────────────────────────── */

const INV_LABEL = {
  invited:              'Invited',
  DUPLICATE_INVITATION: 'Already invited',
  ALREADY_MEMBER:       'Already a member',
  TEAM_FULL:            'Team full',
  NOT_ELIGIBLE:         'Not eligible',
};
const INV_CLS = {
  invited:              'badge bg-green-50 text-green-700 border border-green-200',
  DUPLICATE_INVITATION: 'badge bg-green-50 text-green-700 border border-green-200',
  ALREADY_MEMBER:       'badge bg-gray-100 text-gray-500',
  TEAM_FULL:            'badge bg-red-50 text-red-700 border border-red-100',
  NOT_ELIGIBLE:         'badge bg-yellow-50 text-yellow-700 border border-yellow-200',
};

function InviteButton({ teamId, candidateId, onRefresh }) {
  const [state, setState] = useState('idle');

  const handle = async () => {
    setState('inviting');
    try {
      await api.sendInvitation(teamId, candidateId);
      toast.success('Invitation sent!');
      setState('invited');
      await onRefresh();
    } catch (e) {
      const code = api.errorCode(e);
      if (INV_LABEL[code]) setState(code);
      else { toast.error(api.readError(e)); setState('idle'); }
    }
  };

  if (state !== 'idle' && state !== 'inviting') {
    return <span className={INV_CLS[state] || 'badge bg-gray-100 text-gray-500'}>{INV_LABEL[state] || state}</span>;
  }
  return (
    <button onClick={handle} disabled={state === 'inviting'} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
      {state === 'inviting'
        ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : <HiLightningBolt className="h-3.5 w-3.5" />}
      {state === 'inviting' ? 'Inviting…' : 'Invite'}
    </button>
  );
}

/* ─────────────────────────────────────────────
   Candidate card
───────────────────────────────────────────── */

function CandidateCard({ candidate, teamId, onRefresh }) {
  const institution = candidate.collegeName || candidate.organizationName;
  const fills       = candidate.missingSkillsFilled || [];
  const matched     = candidate.matchedSkills || [];

  return (
    <div className="card flex flex-col gap-3 hover:border-primary-200 transition-colors duration-150">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={candidate.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{candidate.name}</p>
            {institution && <p className="text-xs text-gray-400">{institution}</p>}
          </div>
        </div>
        <InviteButton teamId={teamId} candidateId={candidate.userId} onRefresh={onRefresh} />
      </div>

      {/* AI reason */}
      {candidate.matchReason && (
        <div className="highlight-box">
          <HiLightningBolt className="h-3.5 w-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-primary-800 leading-relaxed">{candidate.matchReason}</p>
        </div>
      )}

      {/* Gap fills — most important */}
      {fills.length > 0 && (
        <div>
          <p className="tag-label text-green-700">Fills the gap</p>
          <div className="flex flex-wrap gap-1">
            {fills.map((s) => (
              <span key={s} className="badge bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* All skills — colour-coded */}
      {candidate.skills?.length > 0 && (
        <div>
          <p className="tag-label text-gray-500">Skills</p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.map((s) => {
              const isGap   = fills.map((x) => x.toLowerCase()).includes(s.toLowerCase());
              const isMatch = matched.map((x) => x.toLowerCase()).includes(s.toLowerCase());
              const cls     = isGap
                ? 'bg-green-50 text-green-700 border border-green-200'
                : isMatch ? 'badge-skills' : 'bg-gray-100 text-gray-500';
              return <span key={s} className={`badge text-xs ${cls}`}>{s}</span>;
            })}
          </div>
        </div>
      )}

      {/* Secondary signals */}
      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100 text-xs text-gray-400">
        {candidate.availability && (
          <span className="flex items-center gap-1"><HiClock className="h-3 w-3" />{candidate.availability}</span>
        )}
        {candidate.rolePreference?.length > 0 && <span>{candidate.rolePreference.join(', ')}</span>}
        {candidate.competitionPreferenceMatch && (
          <span className="badge bg-primary-50 text-primary-600 border border-primary-100">Prefers this competition</span>
        )}
        {candidate.github && (
          <a href={candidate.github} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-primary-600 hover:underline">
            <HiLink className="h-3 w-3" />GitHub
          </a>
        )}
        {candidate.linkedin && (
          <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer"
             className="flex items-center gap-1 text-primary-600 hover:underline">
            <HiLink className="h-3 w-3" />LinkedIn
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
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [team, setTeam]           = useState(null);
  const [loadingTeam, setLoading] = useState(true);
  const [recData, setRecData]     = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  /* ── Load team ── */
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

  /* ── Load recommendations (leader only) ── */
  useEffect(() => {
    if (!team || team.leaderId !== user?.userId) return;
    setLoadingRec(true);
    api.getCandidateRecommendations(id)
      .then(setRecData)
      .catch((e) => toast.error(api.readError(e)))
      .finally(() => setLoadingRec(false));
  }, [team, id, user]); // eslint-disable-line

  const refresh = useCallback(() => loadTeam(), [loadTeam]);

  /* ── Loading ── */
  if (loadingTeam) {
    return (
      <div className="page-shell flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }
  if (!team) return null;

  /* ── Flags ── */
  const isMember   = team.members?.some((m) => m.userId === user?.userId) ?? false;
  const isLeader   = team.leaderId === user?.userId;
  const canRequest = !isMember && team.status !== 'full' && team.status !== 'closed';
  const openSlots  = Math.max(0, (team.maxMembers ?? 0) - (team.members?.length ?? 0));
  const deadline   = fmt(team.competition?.deadline);

  return (
    <div className="page-shell">
      <div className="page-content">

        {/* Back */}
        <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
          <HiArrowLeft className="h-4 w-4" /> Back to teams
        </Link>

        {/* ── Team header card ── */}
        <div className="card mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-gray-900">{team.name}</h1>
                <StatusBadge status={team.status} />
                {isLeader && <span className="badge bg-primary-50 text-primary-700 border border-primary-100">You are the leader</span>}
              </div>
              {team.competition ? (
                <p className="text-sm text-gray-500">
                  {team.competition.name}
                  {deadline && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-400">
                      <HiClock className="h-3.5 w-3.5" />{deadline}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-gray-400">No competition attached</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {team.members?.length ?? 0} / {team.maxMembers} members
              </p>
            </div>

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

        {/* ── Two-column layout on desktop ── */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left column: gap + required skills */}
          <div className="lg:col-span-1 space-y-5">

            {/* Skill gap */}
            <SkillGap gap={team.skillGap} />

            {/* Required skills reference */}
            {team.requiredSkills?.length > 0 && (
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {team.requiredSkills.map((r) => (
                    <span
                      key={r.skill}
                      className={`badge text-xs ${
                        r.priority === 'high'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'badge-skills'
                      }`}
                    >
                      {r.skill}
                      {r.priority === 'high' && <span className="ml-1 opacity-60">·high</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column: members */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiUserGroup className="h-4 w-4 text-primary-600" /> Members
              </h2>

              {team.members?.length > 0 ? (
                <div className="space-y-3">
                  {team.members.map((member) => {
                    const inst = member.collegeName || member.organizationName;
                    return (
                      <div key={member.userId} className="flex items-start gap-3">
                        <Avatar name={member.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            {member.isLeader && (
                              <span className="badge bg-primary-50 text-primary-700 border border-primary-100 text-xs">Leader</span>
                            )}
                            {member.userId === user?.userId && !member.isLeader && (
                              <span className="badge bg-gray-100 text-gray-500 text-xs">You</span>
                            )}
                          </div>
                          {inst && <p className="text-xs text-gray-400">{inst}</p>}
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
                <p className="text-sm text-gray-400">No members yet.</p>
              )}

              {openSlots > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  {Array.from({ length: openSlots }).map((_, i) => (
                    <div key={`slot-${i}`} className="flex items-center gap-3 opacity-40">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-400 text-xs">?</span>
                      </div>
                      <span className="text-xs text-gray-400">Open slot</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Candidate recommendations (leader only) ── */}
        {isLeader && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <HiLightningBolt className="h-4 w-4 text-primary-500" />
              <h2 className="text-sm font-semibold text-gray-900">Candidate Recommendations</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              AI recommends. You decide. Every candidate below fills at least one remaining gap.
            </p>

            {loadingRec ? (
              <div className="card flex items-center justify-center py-10 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
                <span className="text-sm text-gray-500">Loading candidates…</span>
              </div>
            ) : recData?.recommendations?.length > 0 ? (
              <>
                {recData.remainingGap?.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className="text-xs font-medium text-gray-600">Still looking for:</span>
                    {recData.remainingGap.map((s) => (
                      <span key={s} className="badge bg-red-50 text-red-700 border border-red-100 text-xs">{s}</span>
                    ))}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {recData.recommendations.map((c) => (
                    <CandidateCard
                      key={c.userId}
                      candidate={c}
                      teamId={team.teamId}
                      onRefresh={refresh}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="card text-center py-10">
                <HiUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                {team.skillGap?.remaining?.length === 0 ? (
                  <p className="text-sm font-medium text-gray-600">All skill gaps are filled.</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-600">No eligible candidates found.</p>
                    <p className="text-xs text-gray-400 mt-1">
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
  );
}

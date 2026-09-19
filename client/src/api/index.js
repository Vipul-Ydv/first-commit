import axios from 'axios';

import profileMock from './mock/profile.json';
import competitionAnalyzeMock from './mock/competition-analyze.json';
import teamMock from './mock/team.json';
import teamsBrowseMock from './mock/teams-browse.json';
import recCandidatesMock from './mock/recommendations-candidates.json';
import recTeamsMock from './mock/recommendations-teams.json';
import dashIndividualMock from './mock/dashboard-individual.json';
import dashLeaderMock from './mock/dashboard-leader.json';

/* ------------------------------------------------------------------
 * THE SWITCH
 *
 * Dev 2 (frontend): keep this `true` all day. Every screen renders
 * from the JSON files in ./mock - you never wait for the backend.
 *
 * Dev 1 (backend): when your API is deployed, flip this to `false`.
 * That is the entire integration step. Nothing else changes.
 * ------------------------------------------------------------------ */
export const USE_MOCK = true;

const BASE_URL = process.env.REACT_APP_API_URL || '';

const http = axios.create({ baseURL: BASE_URL });

/** Call once after Cognito login, and with null on logout. */
export function setAuthToken(token) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete http.defaults.headers.common['Authorization'];
  }
}

// Fake network delay, so loading states get built from day one.
const fake = (data, ms = 400) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const ok = { success: true };

/* ---------------------------- Profile ---------------------------- */

export const getProfile = (userId) =>
  USE_MOCK ? fake(profileMock) : http.get(`/profiles/${userId}`).then((r) => r.data);

export const createProfile = (data) =>
  USE_MOCK ? fake({ ...profileMock, ...data }) : http.post('/profiles', data).then((r) => r.data);

export const updateProfile = (userId, data) =>
  USE_MOCK ? fake({ ...profileMock, ...data }) : http.put(`/profiles/${userId}`, data).then((r) => r.data);

/* -------------------------- Competition -------------------------- */

/** body: { text } or { url }. Returns the 6 fields for HUMAN REVIEW. */
export const analyzeCompetition = (body) =>
  USE_MOCK ? fake(competitionAnalyzeMock, 1200) : http.post('/competitions/analyze', body).then((r) => r.data);

export const createCompetition = (data) =>
  USE_MOCK ? fake({ competitionId: 'competition_123', ...data }) : http.post('/competitions', data).then((r) => r.data);

/* ----------------------------- Teams ----------------------------- */

export const createTeam = (data) =>
  USE_MOCK ? fake({ ...teamMock, ...data }) : http.post('/teams', data).then((r) => r.data);

export const getTeam = (teamId) =>
  USE_MOCK ? fake(teamMock) : http.get(`/teams/${teamId}`).then((r) => r.data);

/** Leader only. Used to add/remove/re-prioritise required skills. */
export const updateTeam = (teamId, data) =>
  USE_MOCK ? fake({ ...teamMock, ...data }) : http.put(`/teams/${teamId}`, data).then((r) => r.data);

/** Path B step 4b - browse all open teams. */
export const browseTeams = () =>
  USE_MOCK ? fake(teamsBrowseMock) : http.get('/teams').then((r) => r.data);

/* ------------------------- Recommendations ------------------------ */

/** Path A - leader sees suggested PEOPLE for the remaining gap. */
export const getCandidateRecommendations = (teamId) =>
  USE_MOCK ? fake(recCandidatesMock, 800) : http.get(`/teams/${teamId}/recommendations`).then((r) => r.data);

/** Path B - individual sees suggested TEAMS. */
export const getRecommendedTeams = (userId) =>
  USE_MOCK ? fake(recTeamsMock, 800) : http.get(`/users/${userId}/recommended-teams`).then((r) => r.data);

/* --------------------- Join requests (Path B) --------------------- */
/* Individual sends. LEADER decides.                                  */

export const sendJoinRequest = (teamId) =>
  USE_MOCK ? fake(ok) : http.post(`/teams/${teamId}/join-request`).then((r) => r.data);

export const approveJoinRequest = (requestId) =>
  USE_MOCK ? fake(ok) : http.post(`/join-requests/${requestId}/approve`).then((r) => r.data);

export const rejectJoinRequest = (requestId) =>
  USE_MOCK ? fake(ok) : http.post(`/join-requests/${requestId}/reject`).then((r) => r.data);

/* --------------------- Invitations (Path A) ----------------------- */
/* Leader sends. CANDIDATE decides.                                   */

export const sendInvitation = (teamId, userId) =>
  USE_MOCK ? fake(ok) : http.post(`/teams/${teamId}/invite`, { userId }).then((r) => r.data);

export const acceptInvitation = (invitationId) =>
  USE_MOCK ? fake(ok) : http.post(`/invitations/${invitationId}/accept`).then((r) => r.data);

export const declineInvitation = (invitationId) =>
  USE_MOCK ? fake(ok) : http.post(`/invitations/${invitationId}/decline`).then((r) => r.data);

/* --------------------------- Dashboards --------------------------- */

export const getIndividualDashboard = (userId) =>
  USE_MOCK ? fake(dashIndividualMock) : http.get(`/users/${userId}/dashboard`).then((r) => r.data);

export const getLeaderDashboard = (teamId) =>
  USE_MOCK ? fake(dashLeaderMock) : http.get(`/teams/${teamId}/dashboard`).then((r) => r.data);

/* ---------------------------- Errors ------------------------------ */

/**
 * Every failed call returns: { error: { code, message } }
 * See ./mock/errors.json for the full code list.
 * Usage:  catch (e) { toast.error(readError(e)) }
 */
export function readError(e) {
  return (
    e?.response?.data?.error?.message ||
    e?.message ||
    'Something went wrong. Please try again.'
  );
}

export function errorCode(e) {
  return e?.response?.data?.error?.code || 'UNKNOWN';
}

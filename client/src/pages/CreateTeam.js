import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../api';
import { HiX, HiPlus } from 'react-icons/hi';
import { Spinner } from './Login';

/**
 * Path A entry point: paste competition → extract → review → define skills → create.
 * Functional logic is identical to the original; only the visual layer changed.
 */
export default function CreateTeam() {
  const navigate = useNavigate();

  const [text, setText]           = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [comp, setComp]           = useState(null);
  const [unextracted, setUnextracted] = useState([]);

  const [teamName, setTeamName]   = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills]       = useState([]);
  const [saving, setSaving]       = useState(false);

  /* ── Analyze ── */
  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeCompetition({ text });
      setComp(res.fields);
      setUnextracted(res.unextracted || []);
      if (res.needsReview) toast('Some fields could not be extracted — please fill them in.', { icon: '✏️' });
      else toast.success('Details extracted. Please review before continuing.');
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setAnalyzing(false);
    }
  };

  /* ── Skills ── */
  const addSkill = (e) => {
    e.preventDefault();
    const s = skillInput.trim();
    if (!s) return;
    if (!skills.some((x) => x.skill.toLowerCase() === s.toLowerCase())) {
      setSkills([...skills, { skill: s, priority: 'medium' }]);
    }
    setSkillInput('');
  };

  const setPriority = (i, priority) =>
    setSkills(skills.map((s, idx) => (idx === i ? { ...s, priority } : s)));

  const removeSkill = (i) =>
    setSkills(skills.filter((_, idx) => idx !== i));

  /* ── Submit ── */
  const submit = async () => {
    setSaving(true);
    try {
      const saved = await api.createCompetition(comp);
      const team  = await api.createTeam({
        name: teamName,
        competitionId: saved.competitionId,
        requiredSkills: skills,
      });
      toast.success('Team created!');
      navigate(`/teams/${team.teamId}`);
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setSaving(false);
    }
  };

  /* ── Comp field helper ── */
  const field = (key, label, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {unextracted.includes(key) && (
          <span className="ml-2 text-xs font-normal text-amber-600">could not extract — please fill in</span>
        )}
      </label>
      <input
        type={type}
        className="input-field"
        value={comp?.[key] ?? ''}
        onChange={(e) =>
          setComp({ ...comp, [key]: type === 'number' ? Number(e.target.value) || null : e.target.value })
        }
      />
    </div>
  );

  const PRIORITY_COLORS = {
    high:   'bg-red-50 text-red-700 border border-red-100',
    medium: 'badge-skills',
    low:    'bg-gray-100 text-gray-600',
  };

  return (
    <div className="page-shell">
      <div className="page-content-narrow">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Create a Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Add your competition first, then list the skills you need.
          </p>
        </div>

        <div className="space-y-5">

          {/* ── Step 1: Competition source ── */}
          <div className="card">
            <StepHeader step={1} title="Competition" />
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Paste the competition page or description. We will pull out the details for you to check.
            </p>
            <textarea
              rows={5}
              className="input-field font-mono text-xs resize-y"
              placeholder="Paste the competition text here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <button
                className="btn-primary flex items-center gap-2"
                onClick={analyze}
                disabled={!text.trim() || analyzing}
              >
                {analyzing ? <><Spinner /> Extracting…</> : 'Extract details'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setComp({
                    name: '', organizer: '', deadline: '', teamSizeMin: null, teamSizeMax: null,
                    eligibility: { studentOnly: false, institutionRestriction: false, allowedInstitutions: [] },
                  });
                  setUnextracted([]);
                }}
              >
                Enter manually
              </button>
            </div>
          </div>

          {/* ── Step 2: Review extracted fields ── */}
          {comp && (
            <div className="card">
              <StepHeader step={2} title="Check the details" />
              <p className="text-sm text-gray-500 mt-1 mb-4">Edit anything that looks wrong before continuing.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {field('name', 'Competition name')}
                {field('organizer', 'Organizer')}
                {field('deadline', 'Deadline')}
                <div className="grid grid-cols-2 gap-3">
                  {field('teamSizeMin', 'Min team size', 'number')}
                  {field('teamSizeMax', 'Max team size', 'number')}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Skills ── */}
          {comp && (
            <div className="card">
              <StepHeader step={3} title="Skills you need" />
              <p className="text-sm text-gray-500 mt-1 mb-4">
                What is your team missing? You decide — we never guess from the competition text.
              </p>

              {/* Team name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Team name</label>
                <input
                  className="input-field"
                  placeholder="e.g. VisionX"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
              </div>

              {/* Add skill */}
              <form onSubmit={addSkill} className="flex gap-2 mb-4">
                <input
                  className="input-field"
                  placeholder="e.g. Machine Learning"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                />
                <button className="btn-secondary flex items-center gap-1 flex-shrink-0" type="submit">
                  <HiPlus className="h-4 w-4" /> Add
                </button>
              </form>

              {/* Skills list */}
              {skills.length > 0 && (
                <ul className="space-y-2 mb-5">
                  {skills.map((s, i) => (
                    <li key={s.skill} className="flex items-center gap-3">
                      <span className={`badge ${PRIORITY_COLORS[s.priority] || 'badge-skills'}`}>
                        {s.skill}
                      </span>
                      <select
                        className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        value={s.priority}
                        onChange={(e) => setPriority(i, e.target.value)}
                      >
                        <option value="high">High priority</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-red-500 transition-colors ml-auto"
                        onClick={() => removeSkill(i)}
                      >
                        <HiX className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <button
                className="btn-primary flex items-center gap-2"
                onClick={submit}
                disabled={saving || !teamName.trim() || !comp?.name || !comp?.teamSizeMax}
              >
                {saving ? <><Spinner /> Creating…</> : 'Create team'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ step, title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-bold leading-none">{step}</span>
      </div>
      <h2 className="font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

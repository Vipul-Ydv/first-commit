import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as api from '../api';

/**
 * Path A entry point: add a competition, then create the team.
 *
 * Reference implementation for the rest of the app - it shows the two
 * patterns every other page needs: calling the api layer, and rendering the
 * extraction review state where unextracted fields come back blank for a
 * human to fill (never guessed).
 */
export default function CreateTeam() {
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [comp, setComp] = useState(null);
  const [unextracted, setUnextracted] = useState([]);

  const [teamName, setTeamName] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const [saving, setSaving] = useState(false);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await api.analyzeCompetition({ text });
      setComp(res.fields);
      setUnextracted(res.unextracted || []);
      if (res.needsReview) toast(res.message, { icon: '✏️' });
      else toast.success('Details extracted — please review');
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setAnalyzing(false);
    }
  };

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

  const submit = async () => {
    setSaving(true);
    try {
      const saved = await api.createCompetition(comp);
      const team = await api.createTeam({
        name: teamName,
        competitionId: saved.competitionId,
        requiredSkills: skills,
      });
      toast.success('Team created');
      navigate(`/teams/${team.teamId}`);
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, type = 'text') => (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {unextracted.includes(key) && (
          <span className="ml-2 text-xs font-normal text-amber-600">couldn't extract — please fill in</span>
        )}
      </label>
      <input
        type={type}
        className="input-field mt-1"
        value={comp?.[key] ?? ''}
        onChange={(e) =>
          setComp({ ...comp, [key]: type === 'number' ? Number(e.target.value) || null : e.target.value })
        }
      />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a Team</h1>
        <p className="text-sm text-gray-600 mt-1">
          Add the competition first, then list the skills you need.
        </p>
      </div>

      {/* 1. competition source */}
      <section className="card">
        <h2 className="font-semibold text-gray-900">1. Competition</h2>
        <p className="text-sm text-gray-500 mt-1">
          Paste the competition page or description. We'll pull out the details for you to check.
        </p>
        <textarea
          rows={6}
          className="input-field mt-3 font-mono text-sm"
          placeholder="Paste the competition text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex gap-3">
          <button className="btn-primary" onClick={analyze} disabled={!text.trim() || analyzing}>
            {analyzing ? 'Reading…' : 'Extract details'}
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
      </section>

      {/* 2. human review - nothing is saved until the leader confirms */}
      {comp && (
        <section className="card">
          <h2 className="font-semibold text-gray-900">2. Check the details</h2>
          <p className="text-sm text-gray-500 mt-1">Edit anything that looks wrong.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {field('name', 'Competition name')}
            {field('organizer', 'Organizer')}
            {field('deadline', 'Deadline')}
            <div className="grid grid-cols-2 gap-3">
              {field('teamSizeMin', 'Min team size', 'number')}
              {field('teamSizeMax', 'Max team size', 'number')}
            </div>
          </div>
        </section>
      )}

      {/* 3. the leader's own judgement - never inferred */}
      {comp && (
        <section className="card">
          <h2 className="font-semibold text-gray-900">3. Skills you need</h2>
          <p className="text-sm text-gray-500 mt-1">
            What are you missing? You choose these — we never guess them from the competition.
          </p>

          <input
            className="input-field mt-3"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
          />

          <form onSubmit={addSkill} className="mt-3 flex gap-2">
            <input
              className="input-field"
              placeholder="e.g. Machine Learning"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
            <button className="btn-secondary whitespace-nowrap" type="submit">Add</button>
          </form>

          <ul className="mt-4 space-y-2">
            {skills.map((s, i) => (
              <li key={s.skill} className="flex items-center gap-3">
                <span className="badge badge-skills">{s.skill}</span>
                <select
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  value={s.priority}
                  onChange={(e) => setPriority(i, e.target.value)}
                >
                  <option value="high">High priority</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  className="text-sm text-gray-400 hover:text-red-600 ml-auto"
                  onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>

          <button
            className="btn-primary mt-6"
            onClick={submit}
            disabled={saving || !teamName.trim() || !comp?.name || !comp?.teamSizeMax}
          >
            {saving ? 'Creating…' : 'Create team'}
          </button>
        </section>
      )}
    </div>
  );
}

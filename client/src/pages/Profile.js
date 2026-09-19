import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { HiPlus, HiX, HiCheck, HiPencil, HiLink } from 'react-icons/hi';
import { Spinner } from './Login';

const AVAILABILITY_OPTIONS = ['weekdays', 'weekends', 'evenings', 'flexible'];
const ROLE_OPTIONS = [
  'ML Engineer', 'Frontend Dev', 'Backend Dev', 'UI/UX Designer',
  'Data Scientist', 'DevOps', 'Full Stack Dev', 'Product Manager',
];

/* ── Small reusable pieces ── */

function SectionCard({ title, required, children }) {
  return (
    <div className="card">
      <div className="flex items-baseline gap-2 mb-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {required && <span className="text-xs text-gray-400">required</span>}
      </div>
      {children}
    </div>
  );
}

function FormField({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TagInput({ value: tags, onChange, placeholder, colorClass = 'badge-skills' }) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (!v || tags.includes(v)) return;
    onChange([...tags, v]);
    setInput('');
  };

  const remove = (tag) => onChange(tags.filter((t) => t !== tag));

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span key={tag} className={`badge ${colorClass} flex items-center gap-1`}>
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                className="hover:opacity-70 ml-0.5 flex-shrink-0"
                aria-label={`Remove ${tag}`}
              >
                <HiX className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className="input-field flex-1"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={add}
          className="btn-secondary px-3 flex-shrink-0"
          aria-label="Add"
        >
          <HiPlus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ToggleChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm font-medium transition-colors duration-150 ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
      }`}
    >
      {active && <HiCheck className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}

/* ── View mode: read-only display ── */

function ViewSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}

function ViewProfile({ form, onEdit }) {
  const institution = form.userType === 'student' ? form.collegeName : form.organizationName;

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary-700 leading-none">
                {(form.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{form.name || 'Unnamed'}</h2>
              {institution && <p className="text-sm text-gray-500 mt-0.5">{institution}</p>}
              <span className="badge bg-gray-100 text-gray-600 capitalize mt-1">
                {form.userType}
              </span>
            </div>
          </div>
          <button onClick={onEdit} className="btn-secondary flex items-center gap-1.5 flex-shrink-0">
            <HiPencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Skills + interests */}
      <div className="card space-y-5">
        <ViewSection title="Skills">
          {form.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.skills.map((s) => <span key={s} className="badge badge-skills">{s}</span>)}
            </div>
          ) : <p className="text-sm text-gray-400">No skills added yet.</p>}
        </ViewSection>

        <div className="border-t border-gray-100" />

        <ViewSection title="Interests">
          {form.interests.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.interests.map((s) => <span key={s} className="badge bg-purple-50 text-purple-700 border border-purple-100">{s}</span>)}
            </div>
          ) : <p className="text-sm text-gray-400">No interests added yet.</p>}
        </ViewSection>
      </div>

      {/* Availability + roles */}
      <div className="card space-y-5">
        <ViewSection title="Availability">
          {form.availability
            ? <span className="badge bg-green-50 text-green-700 border border-green-100 capitalize">{form.availability}</span>
            : <p className="text-sm text-gray-400">Not set.</p>}
        </ViewSection>

        <div className="border-t border-gray-100" />

        <ViewSection title="Role preference">
          {form.rolePreference.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {form.rolePreference.map((r) => <span key={r} className="badge bg-indigo-50 text-indigo-700 border border-indigo-100">{r}</span>)}
            </div>
          ) : <p className="text-sm text-gray-400">Not set.</p>}
        </ViewSection>
      </div>

      {/* Links */}
      {(form.github || form.linkedin) && (
        <div className="card space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Links</p>
          {form.github && (
            <a href={form.github} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline">
              <HiLink className="h-4 w-4" /> GitHub
            </a>
          )}
          {form.linkedin && (
            <a href={form.linkedin} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 hover:underline">
              <HiLink className="h-4 w-4" /> LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    userType: 'student',
    name: '',
    collegeName: '',
    organizationName: '',
    github: '',
    linkedin: '',
    interests: [],
    skills: [],
    competitionPreferences: [],
    availability: '',
    rolePreference: [],
  });

  /* ── Load ── */
  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    api.getProfile(user.userId)
      .then((data) => { setProfileData(data); populateForm(data); })
      .catch((e) => {
        if (api.errorCode(e) === 'NOT_FOUND') setEditing(true);
        else toast.error(api.readError(e));
      })
      .finally(() => setLoadingProfile(false));
  }, [user]); // eslint-disable-line

  function populateForm(data) {
    setForm({
      userType:               data.userType || 'student',
      name:                   data.name || '',
      collegeName:            data.collegeName || '',
      organizationName:       data.organizationName || '',
      github:                 data.github || '',
      linkedin:               data.linkedin || '',
      interests:              data.interests || [],
      skills:                 data.skills || [],
      competitionPreferences: data.competitionPreferences || [],
      availability:           data.availability || '',
      rolePreference:         data.rolePreference || [],
    });
  }

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleAvailability = (opt) =>
    set('availability', form.availability === opt ? '' : opt);

  const toggleRole = (role) =>
    set('rolePreference',
      form.rolePreference.includes(role)
        ? form.rolePreference.filter((r) => r !== role)
        : [...form.rolePreference, role]
    );

  /* ── Save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    if (form.userType === 'student' && !form.collegeName.trim()) {
      toast.error('College name is required for students.'); return;
    }
    if (form.userType === 'professional' && !form.organizationName.trim()) {
      toast.error('Organisation name is required for professionals.'); return;
    }
    if (form.skills.length === 0) {
      toast.error('Add at least one skill — it is needed for matching.'); return;
    }
    setSaving(true);
    try {
      const saved = profileData
        ? await api.updateProfile(user.userId, form)
        : await api.createProfile(form);
      setProfileData(saved);
      populateForm(saved);
      updateUser({
        name: saved.name,
        skills: saved.skills,
        collegeName: saved.collegeName,
        organizationName: saved.organizationName,
      });
      toast.success('Profile saved!');
      setEditing(false);
    } catch (e) {
      toast.error(api.readError(e));
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profileData) { populateForm(profileData); setEditing(false); }
  };

  /* ── Loading ── */
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  /* ── View mode ── */
  if (!editing) {
    return (
      <div className="page-shell">
        <div className="page-content-narrow">
          <ViewProfile form={form} onEdit={() => setEditing(true)} />
        </div>
      </div>
    );
  }

  /* ── Edit mode ── */
  return (
    <div className="page-shell">
      <div className="page-content-narrow">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">
            {profileData ? 'Edit profile' : 'Set up your profile'}
          </h1>
          {profileData && (
            <button onClick={cancelEdit} className="btn-secondary">Cancel</button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {/* ── Identity ── */}
          <SectionCard title="Identity" required>
            <div className="space-y-4">

              {/* User type */}
              <FormField label="Account type">
                <div className="grid grid-cols-2 gap-2">
                  {['student', 'professional'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => set('userType', type)}
                      className={`py-2 text-sm font-medium rounded-md border transition-colors duration-150 capitalize ${
                        form.userType === type
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </FormField>

              {/* Name */}
              <FormField label="Full name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                  required
                />
              </FormField>

              {/* Institution */}
              {form.userType === 'student' ? (
                <FormField label="College / University" required>
                  <input
                    type="text"
                    value={form.collegeName}
                    onChange={(e) => set('collegeName', e.target.value)}
                    className="input-field"
                    placeholder="e.g. BTKIT, IIT Delhi"
                  />
                </FormField>
              ) : (
                <FormField label="Organisation" required>
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={(e) => set('organizationName', e.target.value)}
                    className="input-field"
                    placeholder="e.g. Google, Startup Inc."
                  />
                </FormField>
              )}
            </div>
          </SectionCard>

          {/* ── Skills ── */}
          <SectionCard title="Skills" required>
            <p className="text-xs text-gray-500 mb-3">
              Used by the AI for matching. Add everything you are comfortable with.
            </p>
            <TagInput
              value={form.skills}
              onChange={(v) => set('skills', v)}
              placeholder="e.g. Python, AWS, UI/UX — press Enter to add"
              colorClass="badge-skills"
            />
          </SectionCard>

          {/* ── Interests ── */}
          <SectionCard title="Interests">
            <TagInput
              value={form.interests}
              onChange={(v) => set('interests', v)}
              placeholder="e.g. AI, Climate Tech, EdTech"
              colorClass="bg-purple-50 text-purple-700 border border-purple-100"
            />
          </SectionCard>

          {/* ── Availability ── */}
          <SectionCard title="Availability">
            <div className="flex flex-wrap gap-2">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <ToggleChip
                  key={opt}
                  label={opt}
                  active={form.availability === opt}
                  onClick={() => toggleAvailability(opt)}
                />
              ))}
            </div>
          </SectionCard>

          {/* ── Role preference ── */}
          <SectionCard title="Role preference">
            <p className="text-xs text-gray-500 mb-3">The roles you want to play on a team.</p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <ToggleChip
                  key={role}
                  label={role}
                  active={form.rolePreference.includes(role)}
                  onClick={() => toggleRole(role)}
                />
              ))}
            </div>
          </SectionCard>

          {/* ── Links ── */}
          <SectionCard title="Links">
            <div className="space-y-3">
              <FormField label="GitHub">
                <div className="relative">
                  <HiLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.github}
                    onChange={(e) => set('github', e.target.value)}
                    className="input-field pl-9"
                    placeholder="https://github.com/username"
                  />
                </div>
              </FormField>
              <FormField label="LinkedIn">
                <div className="relative">
                  <HiLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={form.linkedin}
                    onChange={(e) => set('linkedin', e.target.value)}
                    className="input-field pl-9"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </FormField>
            </div>
          </SectionCard>

          {/* ── Submit ── */}
          <div className="flex items-center gap-3 pb-4">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? <><Spinner /> Saving…</> : 'Save profile'}
            </button>
            {profileData && (
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

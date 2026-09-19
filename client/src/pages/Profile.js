import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import {
  HiUser, HiAcademicCap, HiBriefcase, HiPlus, HiX,
  HiPencil, HiLink, HiCheck
} from 'react-icons/hi';

const AVAILABILITY_OPTIONS = ['weekdays', 'weekends', 'evenings', 'flexible'];
const ROLE_OPTIONS = ['ML Engineer', 'Frontend Dev', 'Backend Dev', 'UI/UX Designer', 'Data Scientist', 'DevOps', 'Full Stack Dev', 'Product Manager'];

function Profile() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Tag input helpers
  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    api
      .getProfile(user.userId)
      .then((data) => {
        setProfileData(data);
        populateForm(data);
      })
      .catch((e) => {
        // 404 means the profile doesn't exist yet — drop into edit mode
        if (api.errorCode(e) === 'NOT_FOUND') {
          setEditing(true);
        } else {
          toast.error(api.readError(e));
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [user]); // eslint-disable-line

  function populateForm(data) {
    setForm({
      userType: data.userType || 'student',
      name: data.name || '',
      collegeName: data.collegeName || '',
      organizationName: data.organizationName || '',
      github: data.github || '',
      linkedin: data.linkedin || '',
      interests: data.interests || [],
      skills: data.skills || [],
      competitionPreferences: data.competitionPreferences || [],
      availability: data.availability || '',
      rolePreference: data.rolePreference || [],
    });
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const addTag = (field, value, setter) => {
    const v = value.trim();
    if (!v || form[field].includes(v)) return;
    set(field, [...form[field], v]);
    setter('');
  };

  const removeTag = (field, value) =>
    set(field, form[field].filter((t) => t !== value));

  const toggleArrayItem = (field, value) => {
    const current = form[field];
    set(
      field,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (form.userType === 'student' && !form.collegeName.trim()) {
      toast.error('College name is required for students.');
      return;
    }
    if (form.userType === 'professional' && !form.organizationName.trim()) {
      toast.error('Organisation name is required for professionals.');
      return;
    }
    if (form.skills.length === 0) {
      toast.error('Add at least one skill — it is needed for matching.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };

      let saved;
      if (profileData) {
        saved = await api.updateProfile(user.userId, payload);
      } else {
        saved = await api.createProfile(payload);
      }

      setProfileData(saved);
      populateForm(saved);
      // Merge back into AuthContext so profileComplete updates immediately
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
    if (profileData) {
      populateForm(profileData);
      setEditing(false);
    }
    // If no profile yet, stay in edit mode — there is nothing to cancel to
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        {/* ── Page header ── */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HiUser className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {form.name || user?.name || 'Your Profile'}
                </h1>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                {form.userType === 'student' && form.collegeName && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <HiAcademicCap className="h-4 w-4" /> {form.collegeName}
                  </p>
                )}
                {form.userType === 'professional' && form.organizationName && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <HiBriefcase className="h-4 w-4" /> {form.organizationName}
                  </p>
                )}
              </div>
            </div>

            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <HiPencil className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          /* ════════════════════════ EDIT MODE ════════════════════════ */
          <form onSubmit={handleSave} className="space-y-6">

            {/* User type toggle */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account type</h2>
              <div className="flex gap-3">
                {['student', 'professional'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set('userType', type)}
                    className={`flex-1 py-3 rounded-lg border font-medium capitalize transition-colors duration-150 ${
                      form.userType === type
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {type === 'student' ? (
                      <span className="flex items-center justify-center gap-2">
                        <HiAcademicCap className="h-4 w-4" /> Student
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <HiBriefcase className="h-4 w-4" /> Professional
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="input-field"
                    placeholder="Your name"
                    required
                  />
                </div>

                {form.userType === 'student' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College / University <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.collegeName}
                      onChange={(e) => set('collegeName', e.target.value)}
                      className="input-field"
                      placeholder="e.g. BTKIT, IIT Delhi"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Organisation <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.organizationName}
                      onChange={(e) => set('organizationName', e.target.value)}
                      className="input-field"
                      placeholder="e.g. Google, Startup Inc."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub
                  </label>
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
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
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
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Skills <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Used by the AI for matching — add everything you are comfortable with.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.skills.map((skill) => (
                  <span key={skill} className="badge badge-skills flex items-center gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeTag('skills', skill)}
                      className="hover:text-blue-900 ml-0.5"
                      aria-label={`Remove ${skill}`}
                    >
                      <HiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {form.skills.length === 0 && (
                  <p className="text-sm text-gray-400">No skills added yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag('skills', newSkill, setNewSkill); }
                  }}
                  className="input-field"
                  placeholder="e.g. Python, AWS, UI/UX"
                />
                <button
                  type="button"
                  onClick={() => addTag('skills', newSkill, setNewSkill)}
                  className="btn-primary flex-shrink-0 flex items-center gap-1"
                >
                  <HiPlus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>

            {/* Interests */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.interests.map((interest) => (
                  <span key={interest} className="badge bg-purple-100 text-purple-800 flex items-center gap-1">
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeTag('interests', interest)}
                      className="hover:text-purple-900 ml-0.5"
                      aria-label={`Remove ${interest}`}
                    >
                      <HiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {form.interests.length === 0 && (
                  <p className="text-sm text-gray-400">No interests added yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag('interests', newInterest, setNewInterest); }
                  }}
                  className="input-field"
                  placeholder="e.g. AI, Climate Tech, EdTech"
                />
                <button
                  type="button"
                  onClick={() => addTag('interests', newInterest, setNewInterest)}
                  className="btn-primary flex-shrink-0 flex items-center gap-1"
                >
                  <HiPlus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>

            {/* Availability */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability</h2>
              <div className="flex flex-wrap gap-3">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('availability', form.availability === opt ? '' : opt)}
                    className={`px-4 py-2 rounded-lg border font-medium capitalize transition-colors duration-150 ${
                      form.availability === opt
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Role preference */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Role preference</h2>
              <p className="text-sm text-gray-500 mb-4">
                The roles you want to play on a team — pick all that apply.
              </p>
              <div className="flex flex-wrap gap-3">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleArrayItem('rolePreference', role)}
                    className={`px-4 py-2 rounded-lg border font-medium transition-colors duration-150 flex items-center gap-1.5 ${
                      form.rolePreference.includes(role)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {form.rolePreference.includes(role) && <HiCheck className="h-3.5 w-3.5" />}
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Action row */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  'Save Profile'
                )}
              </button>
              {profileData && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

        ) : (
          /* ════════════════════════ VIEW MODE ════════════════════════ */
          <div className="space-y-6">

            {/* Skills */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
              {form.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span key={skill} className="badge badge-skills">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No skills added yet.</p>
              )}
            </div>

            {/* Interests */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Interests</h2>
              {form.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.interests.map((interest) => (
                    <span key={interest} className="badge bg-purple-100 text-purple-800">{interest}</span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No interests added yet.</p>
              )}
            </div>

            {/* Availability + Role preference */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability &amp; role</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Availability: </span>
                  {form.availability ? (
                    <span className="badge bg-green-100 text-green-800 capitalize">{form.availability}</span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not set</span>
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Role preference: </span>
                  {form.rolePreference.length > 0 ? (
                    <span className="flex flex-wrap gap-2 mt-1">
                      {form.rolePreference.map((r) => (
                        <span key={r} className="badge bg-indigo-100 text-indigo-800">{r}</span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">Not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Links */}
            {(form.github || form.linkedin) && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Links</h2>
                <div className="space-y-2">
                  {form.github && (
                    <a
                      href={form.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:underline text-sm"
                    >
                      <HiLink className="h-4 w-4" /> GitHub
                    </a>
                  )}
                  {form.linkedin && (
                    <a
                      href={form.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:underline text-sm"
                    >
                      <HiLink className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

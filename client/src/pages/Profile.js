import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiUser, HiAcademicCap, HiCog, HiPlus, HiX, 
  HiShieldCheck, HiStar, HiPencil 
} from 'react-icons/hi';

function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    year: '',
    skills: [],
    interests: [],
    lookingFor: []
  });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        department: user.department || '',
        year: user.year || '',
        skills: user.skills || [],
        interests: user.interests || [],
        lookingFor: user.lookingFor || []
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, { ...newSkill }]
      });
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((_, i) => i !== index)
    });
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest]
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interest)
    });
  };

  const handleLookingFor = (value) => {
    const updated = formData.lookingFor.includes(value)
      ? formData.lookingFor.filter(v => v !== value)
      : [...formData.lookingFor, value];
    setFormData({ ...formData, lookingFor: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await axios.put('/api/users/profile', formData);
      updateUser(res.data);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                <HiUser className="h-10 w-10 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  {user?.isVerified && (
                    <span className="badge badge-verified">
                      <HiShieldCheck className="h-4 w-4 mr-1" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <HiAcademicCap className="h-4 w-4" /> {user?.college}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary flex items-center gap-2"
            >
              <HiPencil className="h-4 w-4" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {editing ? (
          /* Edit Mode */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Basic Info</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="input-field"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="3"
                  className="input-field"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Skills */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="badge badge-skills flex items-center gap-1">
                    {skill.name} ({skill.level})
                    <button type="button" onClick={() => handleRemoveSkill(index)}>
                      <HiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="input-field flex-1"
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="input-field w-40"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button type="button" onClick={handleAddSkill} className="btn-primary">
                  <HiPlus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Interests */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Interests</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.interests.map((interest) => (
                  <span key={interest} className="badge bg-purple-100 text-purple-800 flex items-center gap-1">
                    {interest}
                    <button type="button" onClick={() => handleRemoveInterest(interest)}>
                      <HiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  className="input-field flex-1"
                  placeholder="Add an interest"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                />
                <button type="button" onClick={handleAddInterest} className="btn-primary">
                  <HiPlus className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Looking For */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Looking For</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 'hackathon', label: 'Hackathon Team' },
                  { value: 'project', label: 'Project Collaboration' },
                  { value: 'networking', label: 'Networking' },
                  { value: 'mentorship', label: 'Mentorship' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleLookingFor(option.value)}
                    className={`px-4 py-2 rounded-lg border transition ${
                      formData.lookingFor.includes(option.value)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Skills */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiCog className="text-primary-600" /> Skills
              </h2>
              {formData.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="badge badge-skills">
                      {skill.name} ({skill.level})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills added yet</p>
              )}
            </div>

            {/* Interests */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <HiStar className="text-aws-orange" /> Interests
              </h2>
              {formData.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest) => (
                    <span key={interest} className="badge bg-purple-100 text-purple-800">
                      {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No interests added yet</p>
              )}
            </div>

            {/* Looking For */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Looking For</h2>
              {formData.lookingFor.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {formData.lookingFor.map((item) => (
                    <span key={item} className="badge bg-green-100 text-green-800 capitalize">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not specified</p>
              )}
            </div>

            {/* Hackathon History */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Hackathon History</h2>
              {user?.hackathonHistory?.length > 0 ? (
                <div className="space-y-3">
                  {user.hackathonHistory.map((hack, index) => (
                    <div key={index} className="border border-gray-100 rounded-lg p-3">
                      <div className="font-medium">{hack.name}</div>
                      <div className="text-sm text-gray-600">
                        {hack.role} • {hack.achievement}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(hack.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No hackathon history yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiUsers, HiPlus, HiSearch, HiFilter, 
  HiLightningBolt, HiUserGroup 
} from 'react-icons/hi';

function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    maxMembers: 4,
    requiredSkills: [],
    lookingFor: []
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await axios.get('/api/teams');
      setTeams(res.data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/teams', newTeam);
      setTeams([res.data, ...teams]);
      setShowCreateModal(false);
      setNewTeam({
        name: '',
        description: '',
        maxMembers: 4,
        requiredSkills: [],
        lookingFor: []
      });
      toast.success('Team created!');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !newTeam.requiredSkills.includes(newSkill)) {
      setNewTeam({
        ...newTeam,
        requiredSkills: [...newTeam.requiredSkills, newSkill]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setNewTeam({
      ...newTeam,
      requiredSkills: newTeam.requiredSkills.filter(s => s !== skill)
    });
  };

  const handleLookingFor = (value) => {
    const updated = newTeam.lookingFor.includes(value)
      ? newTeam.lookingFor.filter(v => v !== value)
      : [...newTeam.lookingFor, value];
    setNewTeam({ ...newTeam, lookingFor: updated });
  };

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = !filterSkill || 
      team.requiredSkills.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()));
    return matchesSearch && matchesSkill;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HiUserGroup className="text-primary-600" /> Teams
            </h1>
            <p className="text-gray-600 mt-1">Find or create a team for your next hackathon</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <HiPlus className="h-5 w-5" /> Create Team
          </button>
        </div>

        {/* Search and Filter */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                placeholder="Search teams..."
              />
            </div>
            <div className="relative">
              <HiFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={filterSkill}
                onChange={(e) => setFilterSkill(e.target.value)}
                className="input-field pl-10 w-full md:w-64"
                placeholder="Filter by skill..."
              />
            </div>
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <Link
                key={team._id}
                to={`/teams/${team._id}`}
                className="card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                  <span className={`badge ${team.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {team.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {team.description || 'No description provided'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {team.requiredSkills?.slice(0, 3).map(skill => (
                    <span key={skill} className="badge badge-skills text-xs">{skill}</span>
                  ))}
                  {team.requiredSkills?.length > 3 && (
                    <span className="badge bg-gray-100 text-gray-600 text-xs">
                      +{team.requiredSkills.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {team.members?.slice(0, 3).map((member, i) => (
                        <div 
                          key={i}
                          className="w-8 h-8 bg-primary-100 rounded-full border-2 border-white flex items-center justify-center"
                        >
                          <span className="text-xs text-primary-600 font-medium">
                            {member.user?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {team.members?.length || 0}/{team.maxMembers}
                    </span>
                  </div>
                  
                  {team.lookingFor?.length > 0 && (
                    <div className="flex gap-1">
                      {team.lookingFor.slice(0, 2).map(role => (
                        <span key={role} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                          {role}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <HiUsers className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600 mb-4">Be the first to create a team!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Team
            </button>
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Create Team</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <HiX className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Name
                    </label>
                    <input
                      type="text"
                      value={newTeam.name}
                      onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                      className="input-field"
                      placeholder="Awesome Coders"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTeam.description}
                      onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                      className="input-field"
                      rows="3"
                      placeholder="What's your project about?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Members
                    </label>
                    <select
                      value={newTeam.maxMembers}
                      onChange={(e) => setNewTeam({ ...newTeam, maxMembers: parseInt(e.target.value) })}
                      className="input-field"
                    >
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Skills
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {newTeam.requiredSkills.map(skill => (
                        <span key={skill} className="badge badge-skills flex items-center gap-1">
                          {skill}
                          <button type="button" onClick={() => handleRemoveSkill(skill)}>
                            <HiX className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="input-field flex-1"
                        placeholder="Add a skill"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <button type="button" onClick={handleAddSkill} className="btn-secondary">
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Looking For
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: 'frontend', label: 'Frontend' },
                        { value: 'backend', label: 'Backend' },
                        { value: 'designer', label: 'Designer' },
                        { value: 'devops', label: 'DevOps' },
                        { value: 'data', label: 'Data Science' },
                        { value: 'any', label: 'Any' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleLookingFor(option.value)}
                          className={`px-3 py-1 rounded-full text-sm border transition ${
                            newTeam.lookingFor.includes(option.value)
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'bg-white text-gray-700 border-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" className="w-full btn-primary mt-6">
                    Create Team
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Teams;

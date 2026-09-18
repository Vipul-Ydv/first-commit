import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiUsers, HiArrowLeft, HiCheck, HiX, 
  HiLightningBolt, HiUserPlus 
} from 'react-icons/hi';

function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchScore, setMatchScore] = useState(null);

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await axios.get(`/api/teams/${id}`);
      setTeam(res.data);
      
      // Calculate match score for current user
      if (user && res.data) {
        calculateMatchScore(res.data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      toast.error('Team not found');
      navigate('/teams');
    } finally {
      setLoading(false);
    }
  };

  const calculateMatchScore = async (teamData) => {
    try {
      const res = await axios.get(`/api/teams/match/${user._id}`);
      const match = res.data.find(m => m.team._id === teamData._id);
      if (match) {
        setMatchScore(match);
      }
    } catch (error) {
      console.error('Error calculating match:', error);
    }
  };

  const handleJoinTeam = async () => {
    try {
      await axios.post(`/api/teams/${id}/join`);
      toast.success('Joined team successfully!');
      fetchTeam();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to join team');
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await axios.post(`/api/teams/${id}/leave`);
      toast.success('Left the team');
      fetchTeam();
    } catch (error) {
      toast.error('Failed to leave team');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!team) return null;

  const isMember = team.members?.some(m => m.user?._id === user?._id);
  const isLeader = team.leader?._id === user?._id;
  const canJoin = team.isOpen && !isMember && team.members?.length < team.maxMembers;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/teams')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <HiArrowLeft className="h-5 w-5" /> Back to Teams
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                  <p className="text-gray-600 mt-1">
                    Created by {team.leader?.name}
                  </p>
                </div>
                <span className={`badge ${team.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {team.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>

              <p className="text-gray-700 mb-6">
                {team.description || 'No description provided'}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-sm text-gray-600">Required Skills:</span>
                {team.requiredSkills?.map(skill => (
                  <span key={skill} className="badge badge-skills">{skill}</span>
                ))}
              </div>

              {team.lookingFor?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Looking for:</span>
                  {team.lookingFor.map(role => (
                    <span key={role} className="badge bg-amber-100 text-amber-800 capitalize">{role}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Match Score */}
            {matchScore && (
              <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center">
                    <HiLightningBolt className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-900">AI Match Score</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary-600">
                        {Math.round(matchScore.score)}%
                      </span>
                      <span className="text-sm text-primary-700">match</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-primary-600 font-medium">
                      {Math.round(matchScore.breakdown.skillMatch)}%
                    </div>
                    <div className="text-primary-700">Skill Match</div>
                  </div>
                  <div>
                    <div className="text-primary-600 font-medium">
                      {Math.round(matchScore.breakdown.interestMatch)}%
                    </div>
                    <div className="text-primary-700">Interest Match</div>
                  </div>
                  <div>
                    <div className="text-primary-600 font-medium">
                      {Math.round(matchScore.breakdown.complementaryScore)}%
                    </div>
                    <div className="text-primary-700">Complementary</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Team Status</h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary-600">
                  {team.members?.length || 0}/{team.maxMembers}
                </div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
              
              {canJoin && (
                <button
                  onClick={handleJoinTeam}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <HiUserPlus className="h-5 w-5" /> Join Team
                </button>
              )}
              
              {isMember && !isLeader && (
                <button
                  onClick={handleLeaveTeam}
                  className="w-full btn-secondary text-red-600 flex items-center justify-center gap-2"
                >
                  <HiX className="h-5 w-5" /> Leave Team
                </button>
              )}
              
              {isLeader && (
                <div className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  You are the team leader
                </div>
              )}
            </div>

            {/* Members */}
            <div className="card">
              <h3 className="font-semibold mb-4">Members</h3>
              <div className="space-y-3">
                {team.members?.map((member, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-medium">
                        {member.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {member.user?.name}
                        {member.user?._id === team.leader?._id && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{member.role || 'Member'}</div>
                    </div>
                    {member.user?.isVerified && (
                      <HiCheck className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: team.maxMembers - (team.members?.length || 0) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex items-center gap-3 opacity-50">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                      <span className="text-gray-400">?</span>
                    </div>
                    <div className="font-medium text-sm text-gray-400">Open slot</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamDetail;

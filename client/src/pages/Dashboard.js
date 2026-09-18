import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  HiUsers, HiCalendar, HiLocationMarker, 
  HiLightningBolt, HiPlus, HiArrowRight 
} from 'react-icons/hi';

function Dashboard() {
  const { user } = useAuth();
  const [recommendedTeams, setRecommendedTeams] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [teamsRes, eventsRes] = await Promise.all([
        axios.get('/api/teams?limit=3'),
        axios.get('/api/events?limit=3')
      ]);
      setRecommendedTeams(teamsRes.data);
      setUpcomingEvents(eventsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.isVerified 
              ? "✓ Your account is verified" 
              : "⚠ Please verify your college email to unlock all features"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">
              {user?.skills?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Skills</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">
              {user?.hackathonHistory?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Hackathons</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">
              {user?.connectedUsers?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Connections</div>
          </div>
          <div className="card text-center">
            <div className="text-2xl font-bold text-primary-600">0</div>
            <div className="text-sm text-gray-600">Teams</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Recommendations */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <HiLightningBolt className="text-aws-orange" />
                  Recommended Teams
                </h2>
                <Link to="/teams" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                  View all <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              {recommendedTeams.length > 0 ? (
                <div className="space-y-4">
                  {recommendedTeams.map(team => (
                    <div key={team._id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-200 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {team.description?.slice(0, 100)}...
                          </p>
                          <div className="flex gap-2 mt-2">
                            {team.requiredSkills?.slice(0, 3).map(skill => (
                              <span key={skill} className="badge badge-skills text-xs">{skill}</span>
                            ))}
                          </div>
                        </div>
                        <span className="badge bg-primary-100 text-primary-700">
                          {team.members?.length}/{team.maxMembers} members
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiUsers className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No teams available yet. Create one!</p>
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <HiCalendar className="text-primary-600" />
                  Upcoming Events
                </h2>
                <Link to="/events" className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1">
                  View all <HiArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event._id} className="border border-gray-100 rounded-lg p-4 hover:border-primary-200 transition">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <HiCalendar className="h-4 w-4" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <HiLocationMarker className="h-4 w-4" />
                          {event.address || 'Online'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <HiCalendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Completion */}
            <div className="card">
              <h3 className="font-semibold mb-4">Complete Your Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Add skills</span>
                  <Link to="/profile" className="text-primary-600 text-sm">Add</Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Add interests</span>
                  <Link to="/profile" className="text-primary-600 text-sm">Add</Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hackathon history</span>
                  <Link to="/profile" className="text-primary-600 text-sm">Add</Link>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  to="/teams" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <HiPlus className="text-primary-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Create Team</div>
                    <div className="text-xs text-gray-500">Start a new team</div>
                  </div>
                </Link>
                <Link 
                  to="/map" 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <HiLocationMarker className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Find Nearby</div>
                    <div className="text-xs text-gray-500">Discover people nearby</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

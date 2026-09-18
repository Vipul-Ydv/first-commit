import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { 
  HiCalendar, HiLocationMarker, HiUsers, HiQrcode,
  HiArrowLeft, HiCheck, HiX, HiExternalLink 
} from 'react-icons/hi';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedIn, setCheckedIn] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await axios.get(`/api/events/${id}`);
      setEvent(res.data);
      
      // Check if user is already checked in
      const isCheckedIn = res.data.checkedInUsers?.some(
        checkin => checkin.user?._id === user?._id
      );
      setCheckedIn(isCheckedIn);
      
      // Fetch nearby users if checked in
      if (isCheckedIn) {
        fetchNearbyUsers();
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Event not found');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async () => {
    try {
      const res = await axios.get(`/api/events/${id}/nearby`);
      setNearbyUsers(res.data);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await axios.post(`/api/events/${id}/checkin`);
      setCheckedIn(true);
      toast.success('Checked in successfully!');
      fetchEvent();
      fetchNearbyUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await axios.post(`/api/events/${id}/checkout`);
      setCheckedIn(false);
      setNearbyUsers([]);
      toast.success('Checked out');
      fetchEvent();
    } catch (error) {
      toast.error('Failed to check out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <HiArrowLeft className="h-5 w-5" /> Back to Events
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <div className="card">
              <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg mb-6 flex items-center justify-center">
                <HiCalendar className="h-24 w-24 text-white/50" />
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                  <p className="text-gray-600 mt-1">
                    Organized by {event.organizer?.name || 'Unknown'}
                  </p>
                </div>
                <span className={`badge ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {event.isActive ? 'Active' : 'Past'}
                </span>
              </div>

              <p className="text-gray-700 mb-6">
                {event.description || 'No description provided'}
              </p>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <HiCalendar className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="font-medium">Date & Time</div>
                    <div className="text-gray-600">
                      {new Date(event.date).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <HiLocationMarker className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-gray-600">{event.address || 'Online'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <HiUsers className="h-5 w-5 text-primary-500" />
                  <div>
                    <div className="font-medium">Checked In</div>
                    <div className="text-gray-600">
                      {event.checkedInUsers?.length || 0} attendees
                    </div>
                  </div>
                </div>
                {event.maxParticipants && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <HiUsers className="h-5 w-5 text-primary-500" />
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-gray-600">
                        {event.checkedInUsers?.length || 0} / {event.maxParticipants}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendees */}
            {checkedIn && nearbyUsers.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <HiUsers className="text-primary-600" /> People at this Event
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {nearbyUsers.map attendee => (
                    <div key={attendee.user._id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-primary-200 transition">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-lg">
                          {attendee.user.name?.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {attendee.user.name}
                          {attendee.user.isVerified && (
                            <HiCheck className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {attendee.user.college}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {attendee.user.skills?.slice(0, 2).map(skill => (
                            <span key={skill.name} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{attendee.distance}</div>
                        <button className="text-primary-600 text-sm hover:underline">
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code / Check-in */}
            <div className="card text-center">
              <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                <HiQrcode className="text-primary-600" /> 
                {checkedIn ? 'Your Check-in QR' : 'Check In'}
              </h3>
              
              {checkedIn ? (
                <>
                  <div className="bg-white p-4 rounded-lg inline-block border-2 border-gray-100 mb-4">
                    <QRCodeSVG 
                      value={JSON.stringify({
                        eventId: event._id,
                        userId: user._id,
                        timestamp: Date.now()
                      })}
                      size={200}
                      level="H"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Show this QR code to connect with others
                  </p>
                  <button
                    onClick={handleCheckOut}
                    className="w-full btn-secondary text-red-600 flex items-center justify-center gap-2"
                  >
                    <HiX className="h-5 w-5" /> Check Out
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-gray-100 rounded-lg p-8 mb-4">
                    <HiQrcode className="h-24 w-24 mx-auto text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Check in to see who's at this event
                  </p>
                  <button
                    onClick={handleCheckIn}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <HiCheck className="h-5 w-5" /> Check In
                  </button>
                </>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h3 className="font-semibold mb-4">Event Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Checked In</span>
                  <span className="font-medium">{event.checkedInUsers?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Users</span>
                  <span className="font-medium">
                    {event.checkedInUsers?.filter(c => c.user?.isVerified).length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Connections</span>
                  <span className="font-medium">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  HiLocationMarker, HiRefresh, HiFilter, 
  HiUser, HiCheck 
} from 'react-icons/hi';

function MapView() {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [filter, setFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          try {
            await axios.put('/api/users/location', {
              longitude,
              latitude
            });
            setLocationEnabled(true);
            fetchNearbyUsers();
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Please enable location access');
          setLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported');
      setLoading(false);
    }
  };

  const fetchNearbyUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/events/nearby-users', {
        params: { filter }
      });
      setNearbyUsers(res.data);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (userId) => {
    try {
      await axios.post(`/api/users/connect/${userId}`);
      toast.success('Connection request sent!');
      fetchNearbyUsers();
    } catch (error) {
      toast.error('Failed to send connection request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(64px)]">
        {/* Map Container */}
        <div className="flex-1 relative">
          {/* Map Placeholder */}
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            {userLocation ? (
              <div className="text-center">
                <HiLocationMarker className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-bounce" />
                <p className="text-gray-700 font-medium">Your Location</p>
                <p className="text-sm text-gray-500">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <HiLocationMarker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Enable location to see nearby users</p>
                <button 
                  onClick={getCurrentLocation}
                  className="btn-primary mt-4"
                >
                  Enable Location
                </button>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={fetchNearbyUsers}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <HiRefresh className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Filter */}
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                fetchNearbyUsers();
              }}
              className="text-sm border-0 focus:ring-0"
            >
              <option value="all">All Users</option>
              <option value="hackathon">Looking for Hackathon</option>
              <option value="project">Looking for Project</option>
              <option value="networking">Networking</option>
            </select>
          </div>
        </div>

        {/* Sidebar - Nearby Users */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HiLocationMarker className="text-primary-600" />
              Nearby Users
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {nearbyUsers.length} people found
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Finding nearby users...</p>
            </div>
          ) : nearbyUsers.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {nearbyUsers.map(({ user: nearbyUser, distance }) => (
                <div key={nearbyUser._id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-medium text-lg">
                        {nearbyUser.name?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {nearbyUser.name}
                        </h3>
                        {nearbyUser.isVerified && (
                          <HiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {nearbyUser.college}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {distance || 'Distance unknown'}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {nearbyUser.skills?.slice(0, 3).map(skill => (
                          <span 
                            key={skill.name} 
                            className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleConnect(nearbyUser._id)}
                          className="text-sm bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700 transition"
                        >
                          Connect
                        </button>
                        <button className="text-sm border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-50 transition">
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <HiUser className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No users found nearby</p>
              <p className="text-sm mt-1">Try changing the filter or check back later</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapView;

import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Trophy, Users, MapPin, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Challenger = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: 'all',
    skillLevel: 'all'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await API.get('/challenger');
      setPosts(response.data.bookings);
    } catch (error) {
      console.error('Failed to fetch challenger posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (bookingId) => {
    try {
      const response = await API.post(`/challenger/${bookingId}/respond`);
      toast.success(response.data.message);
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond');
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filters.sport !== 'all' && p.facility?.sport !== filters.sport) return false;
    if (filters.skillLevel !== 'all' && p.challengerMode?.skillLevel !== filters.skillLevel) return false;
    return true;
  });

  const skillBadge = {
    beginner: 'bg-emerald-50 text-emerald-700',
    intermediate: 'bg-primary-50 text-primary-700',
    advanced: 'bg-accent-100 text-accent-600',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="relative overflow-hidden rounded-3xl shadow-lg p-8 text-white mb-8 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-accent-500/20 rounded-full blur-2xl" />
        <div className="relative flex items-center">
          <div className="icon-duotone w-14 h-14 bg-white/15 mr-4">
            <Trophy className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Challenger Mode</h1>
            <p className="text-primary-100 mt-1">Find players, issue challenges, and build your sports community!</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            className="input-field max-w-xs"
            value={filters.sport}
            onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
          >
            <option value="all">All Sports</option>
            <option value="badminton">Badminton</option>
            <option value="tennis">Tennis</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
          </select>

          <select
            className="input-field max-w-xs"
            value={filters.skillLevel}
            onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}
          >
            <option value="all">All Skill Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="icon-duotone w-16 h-16 bg-gray-50 mx-auto mb-3">
            <Trophy className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-gray-500">No active challenges</p>
          <p className="text-sm text-gray-400 mt-1">Book a facility and enable "Make Public" to post a challenge</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <div key={post._id} className="card card-hover">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold font-display text-gray-900">{post.facility?.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {post.facility?.sport?.replace('-', ' ')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${skillBadge[post.challengerMode?.skillLevel] || 'bg-gray-100 text-gray-700'}`}>
                  {post.challengerMode?.skillLevel}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-400" />
                  {format(new Date(post.startTime), 'MMM dd, HH:mm')} - {format(new Date(post.endTime), 'HH:mm')}
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {post.facility?.location}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  {post.participants?.length || 0} joined
                </div>
              </div>

              {post.challengerMode?.message && (
                <div className="p-3 bg-primary-50/60 border border-primary-100 rounded-xl mb-3">
                  <p className="text-sm text-primary-900 italic">"{post.challengerMode.message}"</p>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">Posted by</p>
                  <p className="font-medium text-gray-900">{post.primaryBooker?.name}</p>
                  <p className="text-xs text-gray-400">{post.primaryBooker?.department}</p>
                </div>
              </div>

              <button
                onClick={() => handleRespond(post._id)}
                className="btn-primary w-full flex items-center justify-center"
              >
                <Send className="h-4 w-4 mr-2" />
                Join Challenge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenger;
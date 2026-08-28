// frontend/src/pages/Health.jsx
import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Activity, Flame, Trophy, Target, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const Health = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);

  const [activityLog, setActivityLog] = useState({
    sport: 'badminton',
    duration: 60,
    caloriesBurned: '',
    heartRateAvg: '',
    notes: ''
  });

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const [profileRes, statsRes, leaderboardRes] = await Promise.all([
        API.get('/health/profile'),
        API.get('/health/stats?days=30'),
        API.get('/health/leaderboard?days=30')
      ]);

      setProfile(profileRes.data.profile);
      setStats(statsRes.data.stats);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (error) {
      toast.error('Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogActivity = async (e) => {
    e.preventDefault();

    if (!activityLog.duration || Number.isNaN(Number(activityLog.duration))) {
      toast.error('Please enter a valid duration');
      return;
    }

    try {
      // Strip empty optional fields instead of sending '' for numeric backend fields
      const payload = {
        sport: activityLog.sport,
        duration: Number(activityLog.duration),
        ...(activityLog.caloriesBurned !== '' && { caloriesBurned: Number(activityLog.caloriesBurned) }),
        ...(activityLog.heartRateAvg !== '' && { heartRateAvg: Number(activityLog.heartRateAvg) }),
        ...(activityLog.notes !== '' && { notes: activityLog.notes })
      };

      await API.post('/health/activity', payload);
      toast.success('Activity logged!');
      setShowLogForm(false);
      setActivityLog({ sport: 'badminton', duration: 60, caloriesBurned: '', heartRateAvg: '', notes: '' });
      fetchHealthData();
    } catch (error) {
      toast.error('Failed to log activity');
    }
  };

  const handleToggleLeaderboard = async () => {
    if (!profile) return;
    try {
      await API.put('/health/profile', { leaderboardOptIn: !profile.leaderboardOptIn });
      fetchHealthData();
      toast.success('Leaderboard preference updated');
    } catch (error) {
      toast.error('Failed to update preference');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white mb-8">
        <div className="flex items-center mb-2">
          <Activity className="h-8 w-8 mr-3" />
          <h1 className="text-3xl font-bold">Health & Fitness</h1>
        </div>
        <p className="text-green-100">Track your sports activities and achievements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Minutes</p>
              <p className="text-3xl font-bold">{stats?.totalMinutes || 0}</p>
            </div>
            <Activity className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Calories Burned</p>
              <p className="text-3xl font-bold">{stats?.totalCalories || 0}</p>
            </div>
            <Flame className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-3xl font-bold">{stats?.currentStreak || 0} days</p>
            </div>
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Goal</p>
              <p className="text-3xl font-bold">{Math.round(stats?.weeklyProgress || 0)}%</p>
            </div>
            <Target className="h-10 w-10 text-green-500" />
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, stats?.weeklyProgress || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Achievements */}
      {stats?.achievements?.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Achievements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.achievements.map((achievement, idx) => (
              <div key={idx} className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-3xl mb-1">{achievement.icon}</p>
                <p className="font-semibold text-sm">{achievement.name}</p>
                <p className="text-xs text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Activity Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Activity Tracking</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleLeaderboard}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              profile?.leaderboardOptIn
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {profile?.leaderboardOptIn ? '✓ On Leaderboard' : 'Join Leaderboard'}
          </button>
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="btn-primary"
          >
            {showLogForm ? 'Cancel' : 'Log Activity'}
          </button>
        </div>
      </div>

      {/* Log Activity Form */}
      {showLogForm && (
        <div className="card mb-6">
          <form onSubmit={handleLogActivity} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Sport</label>
                <select
                  className="input-field"
                  value={activityLog.sport}
                  onChange={(e) => setActivityLog({ ...activityLog, sport: e.target.value })}
                >
                  <option value="badminton">Badminton</option>
                  <option value="tennis">Tennis</option>
                  <option value="football">Football</option>
                  <option value="basketball">Basketball</option>
                  <option value="swimming">Swimming</option>
                  <option value="table-tennis">Table Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  className="input-field"
                  value={activityLog.duration}
                  onChange={(e) =>
                    setActivityLog({
                      ...activityLog,
                      duration: e.target.value === '' ? '' : parseInt(e.target.value, 10)
                    })
                  }
                  min="1"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary">Save Activity</button>
          </form>
        </div>
      )}

      {/* Leaderboard */}
      {profile?.leaderboardOptIn && leaderboard.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Leaderboard (Last 30 Days)</h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, idx) => (
              <div key={entry._id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="font-bold text-lg w-8">#{idx + 1}</span>
                  <div>
                    <p className="font-medium">{entry.user?.name || 'Unknown user'}</p>
                    <p className="text-xs text-gray-500">{entry.user?.department || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{entry.totalMinutes} min</p>
                  <p className="text-xs text-gray-500">{entry.activitiesCount} activities</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Health;
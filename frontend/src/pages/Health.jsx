// frontend/src/pages/Health.jsx
import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { Activity, Flame, Trophy, Target, Award, HeartPulse } from 'lucide-react';
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
      <div className="relative overflow-hidden rounded-3xl shadow-lg p-8 text-white mb-8 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500">
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-accent-500/20 rounded-full blur-2xl" />
        <div className="relative flex items-center">
          <div className="icon-duotone w-14 h-14 bg-white/15 mr-4">
            <HeartPulse className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display">Health & Fitness</h1>
            <p className="text-primary-100 mt-1">Track your sports activities and achievements</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Minutes</p>
              <p className="text-3xl font-bold font-display text-gray-900 mt-1">{stats?.totalMinutes || 0}</p>
            </div>
            <div className="icon-duotone w-12 h-12 bg-primary-50">
              <Activity className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Calories Burned</p>
              <p className="text-3xl font-bold font-display text-gray-900 mt-1">{stats?.totalCalories || 0}</p>
            </div>
            <div className="icon-duotone w-12 h-12 bg-accent-50">
              <Flame className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Streak</p>
              <p className="text-3xl font-bold font-display text-gray-900 mt-1">{stats?.currentStreak || 0} days</p>
            </div>
            <div className="icon-duotone w-12 h-12 bg-amber-50">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="card card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Weekly Goal</p>
              <p className="text-3xl font-bold font-display text-gray-900 mt-1">{Math.round(stats?.weeklyProgress || 0)}%</p>
            </div>
            <div className="icon-duotone w-12 h-12 bg-emerald-50">
              <Target className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, stats?.weeklyProgress || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {stats?.achievements?.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center mb-4">
            <div className="icon-duotone w-10 h-10 bg-amber-50 mr-3">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold font-display text-gray-900">Achievements</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.achievements.map((achievement, idx) => (
              <div key={idx} className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-center">
                <p className="text-3xl mb-1">{achievement.icon}</p>
                <p className="font-semibold text-sm text-gray-900">{achievement.name}</p>
                <p className="text-xs text-gray-500">{achievement.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display text-gray-900">Activity Tracking</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleToggleLeaderboard}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              profile?.leaderboardOptIn
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {showLogForm && (
        <div className="card mb-6">
          <form onSubmit={handleLogActivity} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Sport</label>
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
                <label className="block text-sm font-medium mb-1 text-gray-700">Duration (minutes)</label>
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

      {profile?.leaderboardOptIn && leaderboard.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold font-display mb-4 text-gray-900">Leaderboard (Last 30 Days)</h2>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, idx) => (
              <div key={entry._id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center">
                  <span className="font-bold font-display text-lg w-8 text-primary-600">#{idx + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{entry.user?.name || 'Unknown user'}</p>
                    <p className="text-xs text-gray-500">{entry.user?.department || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{entry.totalMinutes} min</p>
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
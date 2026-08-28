// backend/controllers/healthController.js
const HealthProfile = require('../models/HealthProfile');
const Booking = require('../models/Booking');

// Get or create health profile
exports.getHealthProfile = async (req, res) => {
  try {
    let profile = await HealthProfile.findOne({ user: req.user._id });
    
    if (!profile) {
      profile = await HealthProfile.create({ user: req.user._id });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update health profile
exports.updateHealthProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, runValidators: true, upsert: true }
    );

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log manual activity
exports.logActivity = async (req, res) => {
  try {
    const { sport, duration, caloriesBurned, heartRateAvg, notes, date } = req.body;

    const profile = await HealthProfile.findOne({ user: req.user._id });
 if (!profile) {
      return res.status(404).json({ message: 'Health profile not found' });
    }

    const activityDate = date ? new Date(date) : new Date();

    profile.activities.push({
      date: activityDate,
      sport,
      duration,
      caloriesBurned: caloriesBurned || 0,
      heartRateAvg,
      notes,
      source: 'manual'
    });

    // Update total minutes
    profile.totalMinutesActive += duration;

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
 const lastActivity = profile.activities[profile.activities.length - 2];

    if (lastActivity) {
      const lastDate = new Date(lastActivity.date);
      lastDate.setHours(0, 0, 0, 0);
      const daysDiff = (today - lastDate) / (1000 * 60 * 60 * 24);

      if (daysDiff === 1) {
        profile.currentStreak += 1;
      } else if (daysDiff > 1) {
        profile.currentStreak = 1;
      }
    } else {
      profile.currentStreak = 1;
    }

    if (profile.currentStreak > profile.longestStreak) {
      profile.longestStreak = profile.currentStreak;
    }

    // Check achievements
    checkAchievements(profile);

    await profile.save();

    res.json({
      success: true,
      profile,
      message: 'Activity logged successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync activity from completed booking
exports.syncBookingActivity = async (userId, bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate('facility');
    if (!booking || booking.status !== 'completed') return;

    let profile = await HealthProfile.findOne({ user: userId });
    if (!profile) {
      profile = await HealthProfile.create({ user: userId });
    }

    const duration = (booking.endTime - booking.startTime) / (1000 * 60);

    const caloriesPerMinute = {
      badminton: 7,
      football: 9,
      basketball: 8,
      tennis: 8,
      'table-tennis': 4,
      swimming: 10,
      cricket: 5,
      volleyball: 4,
      squash: 9,
      athletics: 8
    };

    const sport = booking.facility.sport;
    const calories = duration * (caloriesPerMinute[sport] || 5);

    profile.activities.push({
      date: booking.startTime,
      sport,
      duration,
      caloriesBurned: Math.round(calories),
      bookingId,
      source: 'booking'
    });

    profile.totalMinutesActive += duration;
    await profile.save();
  } catch (error) {
    console.error('Sync activity error:', error);
  }
};

// Get activity stats
exports.getActivityStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.json({
        success: true,
        stats: {
          totalMinutes: 0,
          totalCalories: 0,
          activitiesCount: 0,
          weeklyProgress: 0
        }
      });
    }

    const recentActivities = profile.activities.filter(a => 
      new Date(a.date) >= startDate
    );

    const totalMinutes = recentActivities.reduce((sum, a) => sum + a.duration, 0);
    const totalCalories = recentActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

    res.json({
      success: true,
      stats: {
        totalMinutes,
        totalCalories,
        activitiesCount: recentActivities.length,
        weeklyProgress: Math.min(100, (totalMinutes / profile.weeklyGoal) * 100),
        currentStreak: profile.currentStreak,
        longestStreak: profile.longestStreak,
        achievements: profile.achievements
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { sport, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const profiles = await HealthProfile.find({
      leaderboardOptIn: true
    }).populate('user', 'name department');

    const leaderboard = profiles.map(profile => {
      const relevantActivities = profile.activities.filter(a => {
        const isInDateRange = new Date(a.date) >= startDate;
        const isSport = sport ? a.sport === sport : true;
        return isInDateRange && isSport;
      });

      const totalMinutes = relevantActivities.reduce((sum, a) => sum + a.duration, 0);
      const totalCalories = relevantActivities.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

      return {
        user: profile.user,
        totalMinutes,
        totalCalories,
        activitiesCount: relevantActivities.length,
        currentStreak: profile.currentStreak
      };
    })
    .filter(entry => entry.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 50);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to check achievements
function checkAchievements(profile) {
  const achievements = [
    {
      name: 'First Step',
      description: 'Logged your first activity',
      icon: '🌟',
      condition: () => profile.activities.length === 1
    },
    {
      name: 'Week Warrior',
      description: '7-day activity streak',
      icon: '🔥',
      condition: () => profile.currentStreak >= 7
    },
    {
      name: 'Iron Will',
      description: '30-day activity streak',
      icon: '💪',
      condition: () => profile.currentStreak >= 30
    },
    {
      name: 'Century Club',
      description: '100 total activities',
      icon: '💯',
      condition: () => profile.activities.length >= 100
    },
    {
      name: 'Marathon Spirit',
      description: '1000 total active minutes',
      icon: '🏃',
      condition: () => profile.totalMinutesActive >= 1000
    }
  ];

  achievements.forEach(achievement => {
    const alreadyEarned = profile.achievements.some(a => a.name === achievement.name);
    
    if (!alreadyEarned && achievement.condition()) {
      profile.achievements.push({
        name: achievement.name,
        description: achievement.description,
        earnedAt: new Date(),
        icon: achievement.icon
      });
    }
  });
}

module.exports = {
  getHealthProfile: exports.getHealthProfile,
  updateHealthProfile: exports.updateHealthProfile,
  logActivity: exports.logActivity,
  syncBookingActivity: exports.syncBookingActivity,
  getActivityStats: exports.getActivityStats,
  getLeaderboard: exports.getLeaderboard
};

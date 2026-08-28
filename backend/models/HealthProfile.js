// backend/models/HealthProfile.js
const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Basic Stats
  height: { type: Number, min: 100, max: 250 }, // cm
  weight: { type: Number, min: 30, max: 200 }, // kg
  dateOfBirth: Date,
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  
  // Fitness Metrics
  fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  
  // Activity Tracking
  weeklyGoal: { type: Number, default: 150 }, // minutes per week (WHO recommendation)
  
  // Connected Devices
  connectedDevices: [{
    provider: { type: String, enum: ['google_fit', 'apple_health', 'fitbit', 'garmin', 'strava'] },
    accessToken: String, // encrypted in production
    refreshToken: String,
    lastSync: Date,
    isActive: Boolean
  }],
  
  // Manual Activity Log
  activities: [{
    date: Date,
    sport: String,
    duration: Number, // minutes
    caloriesBurned: Number,
    heartRateAvg: Number,
    notes: String,
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    source: { type: String, enum: ['manual', 'booking', 'device'] }
  }],
  
  // Achievements & Streaks
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  totalMinutesActive: { type: Number, default: 0 },
  achievements: [{
    name: String,
    description: String,
    earnedAt: Date,
    icon: String
  }],
  
  // Privacy Settings
  shareWithFriends: { type: Boolean, default: true },
  leaderboardOptIn: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('HealthProfile', healthProfileSchema);

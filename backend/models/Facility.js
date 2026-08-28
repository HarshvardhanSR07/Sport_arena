// backend/models/Facility.js
const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['indoor', 'outdoor'],
    required: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['badminton', 'tennis', 'football', 'basketball', 'cricket', 'volleyball', 'table-tennis', 'squash', 'swimming', 'athletics']
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  minParticipants: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: String,
  equipment: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  maintenanceSlots: [{
    startTime: Date,
    endTime: Date,
    reason: String
  }],
  images: [String],
  bookingRules: {
    maxDurationHours: { type: Number, default: 3 },
    minDurationMinutes: { type: Number, default: 30 }
  }
}, {
  timestamps: true
});

facilitySchema.index({ sport: 1, type: 1, isActive: 1 });

module.exports = mongoose.model('Facility', facilitySchema);
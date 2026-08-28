// backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  primaryBooker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed', 'no-show', 'released'],
    default: 'confirmed'
  },
  participants: [{
    _id: false,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['joined', 'left'], default: 'joined' }
  }],
  waitlist: [{
    _id: false,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    position: Number,
    joinedAt: { type: Date, default: Date.now }
  }],
  maxWaitlistSize: {
    type: Number,
    default: 5
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  challengerMode: {
    isActive: { type: Boolean, default: false },
    skillLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
    message: String
  },
  checkIn: {
    isCheckedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    qrCode: String,
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  weatherCheck: {
    checked: { type: Boolean, default: false },
    suitable: { type: Boolean, default: true },
    conditions: String,
    warning: String
  },
  notes: String,
  cancellation: {
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    reason: String,
    withinWindow: Boolean
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
// Compound index supports both "facility's schedule" lookups and
// overlap checks (startTime <= X && endTime >= Y) in one pass.
bookingSchema.index({ facility: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ primaryBooker: 1, startTime: 1 });
bookingSchema.index({ status: 1, startTime: 1 });

// Virtual for duration
bookingSchema.virtual('durationMinutes').get(function () {
  return Math.round((this.endTime - this.startTime) / (1000 * 60));
});

// Pre-save validation
bookingSchema.pre('save', function (next) {
  if (this.startTime >= this.endTime) {
    return next(new Error('End time must be after start time'));
  }
  if (this.startTime < new Date()) {
    return next(new Error('Cannot book in the past'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
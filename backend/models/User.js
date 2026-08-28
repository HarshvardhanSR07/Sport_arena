// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /@iitg\.ac\.in$/.test(v);
      },
      message: 'Must use IITG email'
    }
  },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
  department: String,
  rollNumber: String,
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[1-9]\d{9,14}$/.test(v);
      },
      message: 'Invalid phone number'
    }
  },
  penalties: {
    count: { type: Number, default: 0 },
    history: [{
      bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      reason: String,
      date: { type: Date, default: Date.now }
    }],
    isSuspended: { type: Boolean, default: false },
    suspendedUntil: Date
  },
  stats: {
    totalBookings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 }
  }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.canBook = function () {
  if (this.penalties?.isSuspended && this.penalties.suspendedUntil > new Date()) {
    return { canBook: false, reason: `Suspended until ${this.penalties.suspendedUntil}` };
  }
  return { canBook: true };
};

module.exports = mongoose.model('User', userSchema);
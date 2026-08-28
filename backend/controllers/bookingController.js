const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { checkWeatherForBooking } = require('../services/weatherService');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { facilityId, startTime, endTime, isPublic, challengerMode, notes } = req.body;
    const userId = req.user._id;

    // Validate user can book
    const canBookCheck = req.user.canBook();
    if (!canBookCheck.canBook) {
      return res.status(403).json({ message: canBookCheck.reason });
    }

    // Check if user already has a booking on this day
    const bookingDate = new Date(startTime);
    const dayStart = new Date(bookingDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(bookingDate.setHours(23, 59, 59, 999));

    const existingDailyBooking = await Booking.findOne({
      primaryBooker: userId,
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingDailyBooking) {
      return res.status(400).json({ 
        message: 'You already have a booking for this day. Only one booking per day allowed.',
        existingBooking: existingDailyBooking
      });
    }

    // Get facility
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    // Validate duration
    const durationMinutes = (new Date(endTime) - new Date(startTime)) / (1000 * 60);
    if (durationMinutes < facility.bookingRules.minDurationMinutes) {
      return res.status(400).json({ 
        message: `Minimum duration is ${facility.bookingRules.minDurationMinutes} minutes` 
      });
    }
    if (durationMinutes > facility.bookingRules.maxDurationHours * 60) {
      return res.status(400).json({ 
        message: `Maximum duration is ${facility.bookingRules.maxDurationHours} hours` 
      });
    }

    // Check for conflicts
    const conflicts = await Booking.find({
      facility: facilityId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ]
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ 
        message: 'Time slot is already booked',
        conflicts,
        canJoinWaitlist: true
      });
    }

    // Check weather for outdoor sports
    let weatherCheck = { checked: false, suitable: true };
    if (facility.type === 'outdoor') {
      weatherCheck = await checkWeatherForBooking(
        new Date(startTime),
        new Date(endTime)
      );
    }

    // Generate unique QR code
    const qrCodeData = JSON.stringify({
      bookingId: uuidv4(),
      userId: userId.toString(),
      facilityId,
      startTime,
      timestamp: Date.now()
    });
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Create booking
    const booking = await Booking.create({
      facility: facilityId,
      primaryBooker: userId,
      startTime,
      endTime,
      isPublic: isPublic || false,
      challengerMode: challengerMode || { isActive: false },
      notes,
      checkIn: { qrCode },
      weatherCheck,
      status: 'confirmed'
    });

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalBookings': 1 }
    });

    await booking.populate('facility primaryBooker');

    res.status(201).json({
      success: true,
      booking,
      weatherWarning: weatherCheck.suitable ? null : weatherCheck.warning
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join waitlist
exports.joinWaitlist = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if already in waitlist
    if (booking.waitlist.some(w => w.user.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already in waitlist' });
    }

    // Check if waitlist is full
    if (booking.waitlist.length >= booking.maxWaitlistSize) {
      return res.status(400).json({ message: 'Waitlist is full (max 5)' });
    }

    // Add to waitlist
    booking.waitlist.push({
      user: userId,
      position: booking.waitlist.length + 1
    });

    await booking.save();
    await booking.populate('waitlist.user', 'name email');

    res.json({
      success: true,
      message: `Added to waitlist at position ${booking.waitlist.length}`,
      waitlist: booking.waitlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.primaryBooker.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check cancellation window
    const now = new Date();
    const minutesUntilStart = (booking.startTime - now) / (1000 * 60);
    const withinWindow = minutesUntilStart >= parseInt(process.env.CANCELLATION_WINDOW_MINUTES);

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: userId,
      cancelledAt: now,
      reason,
      withinWindow
    };

    // If within window and waitlist exists, promote next user
    if (withinWindow && booking.waitlist.length > 0) {
      const nextUser = booking.waitlist.shift();
      booking.primaryBooker = nextUser.user;
      booking.status = 'confirmed';
      booking.waitlist.forEach((w, idx) => w.position = idx + 1);
 await booking.save();

      // Update stats - cancel for original booker
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.cancelledBookings': 1 }
      });

      return res.json({
        success: true,
        message: 'Booking cancelled. Next user from waitlist has been promoted.',
        promoted: nextUser
      });
    }

    await booking.save();

    // Apply penalty if outside window
    if (!withinWindow && req.user.role !== 'admin') {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'penalties.count': 1,
          'stats.cancelledBookings': 1
        },
        $push: {
          'penalties.history': {
            bookingId: booking._id,
            reason: 'Late cancellation (within penalty window)',
            date: now
          }
        }
      });
    }

    res.json({
      success: true,
      message: withinWindow ? 'Booking cancelled without penalty' : 'Booking cancelled with penalty',
      withinWindow,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Swap bookings
exports.swapBookings = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { targetBookingId, targetUserId } = req.body;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    const targetBooking = await Booking.findById(targetBookingId);

    if (!booking || !targetBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify authorization
    if (booking.primaryBooker.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Verify target user owns target booking
    if (targetBooking.primaryBooker.toString() !== targetUserId) {
      return res.status(403).json({ message: 'Target user does not own this booking' });
    }

    // Check that target user has no conflicts on either day
    const bookingDate = new Date(targetBooking.startTime);
    const dayStart = new Date(bookingDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(bookingDate.setHours(23, 59, 59, 999));

    const conflict = await Booking.findOne({
      primaryBooker: userId,
      _id: { $ne: targetBookingId },
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $gte: dayStart, $lte: dayEnd }
    });

    if (conflict) {
      return res.status(400).json({ 
        message: 'You already have another booking on the swap target day',
        conflict
      });
    }

    // Perform swap
    booking.primaryBooker = targetUserId;
    targetBooking.primaryBooker = userId;

    await booking.save();
    await targetBooking.save();

    res.json({
      success: true,
      message: 'Bookings swapped successfully',
      yourNewBooking: targetBooking,
      theirNewBooking: booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Join as participant
exports.joinAsParticipant = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const facility = await Facility.findById(booking.facility);

    // Check if already a participant
    if (booking.participants.some(p => p.user.toString() === userId.toString())) {
      return res.status(400).json({ message: 'Already a participant' });
    }

    // Check capacity
    if (booking.participants.length >= facility.maxParticipants) {
      return res.status(400).json({ message: 'Booking is full' });
    }

    booking.participants.push({ user: userId });
    await booking.save();

    await booking.populate('participants.user', 'name email');

    res.json({
      success: true,
      message: 'Joined successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, upcoming } = req.query;

    const filter = {
      $or: [
        { primaryBooker: userId },
        { 'participants.user': userId },
        { 'waitlist.user': userId }
      ]
    };

    if (status) {
      filter.status = status;
    }

    if (upcoming === 'true') {
      filter.startTime = { $gte: new Date() };
    }

    const bookings = await Booking.find(filter)
      .populate('facility')
      .populate('primaryBooker', 'name email')
      .populate('participants.user', 'name email')
      .populate('waitlist.user', 'name email')
      .sort({ startTime: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get public bookings (for challenger/matchmaking)
exports.getPublicBookings = async (req, res) => {
  try {
    const { sport, startDate, endDate } = req.query;
    const filter = {
      isPublic: true,
      status: 'confirmed',
      startTime: { $gte: new Date() }
    };

    if (sport) {
      const facilities = await Facility.find({ sport }).select('_id');
      filter.facility = { $in: facilities.map(f => f._id) };
    }

    if (startDate && endDate) {
      filter.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(filter)
      .populate('facility')
      .populate('primaryBooker', 'name email department')
      .sort({ startTime: 1 })
      .limit(50);

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Release booking (for admin or check-in expiry)
exports.releaseBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Promote from waitlist if exists
    if (booking.waitlist.length > 0) {
      const nextUser = booking.waitlist.shift();
      booking.primaryBooker = nextUser.user;
      booking.status = 'confirmed';
      booking.waitlist.forEach((w, idx) => w.position = idx + 1);
      booking.cancellation = {
        cancelledBy: null,
        cancelledAt: new Date(),
        reason: reason || 'Auto-released',
        withinWindow: true
      };
      await booking.save();

      return res.json({
        success: true,
        message: 'Slot released and next user promoted',
        promoted: nextUser
      });
    }

    booking.status = 'released';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking released (no waitlist)'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add to backend/controllers/bookingController.js
const AntiCheatService = require('../services/antiCheatService');

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Rate limiting check
    const rateLimit = await AntiCheatService.checkRateLimit(userId, 'create_booking', 10, 60);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        message: 'Too many booking attempts. Please wait.',
        resetAt: rateLimit.resetAt
      });
    }

    // Check behavior score
    const behaviorScore = await AntiCheatService.calculateBehaviorScore(userId);
    if (behaviorScore.classification === 'risky') {
      // Require admin approval for risky users
      const pendingBookings = await Booking.countDocuments({
        primaryBooker: userId,
        status: 'pending'
      });
      
      if (pendingBookings > 2) {
        return res.status(403).json({ 
          message: 'Account flagged for review. Contact sports office.',
          behaviorScore: behaviorScore.score
        });
      }
    }

    // ... rest of existing booking creation logic
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

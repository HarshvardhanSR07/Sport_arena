// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const QRService = require('../services/qrService');
const WebSocketService = require('../services/websocketService');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ---------------------------------------------------------
// Create booking
// - blocks suspended users
// - enforces one booking per user per day
// - checks for slot conflicts on the same facility
// - generates a signed, scannable QR code for check-in
// ---------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { facilityId, startTime, endTime, notes, isPublic, participantIds } = req.body;

    const user = await User.findById(req.userId);
    if (user.penalties?.isSuspended && user.penalties.suspendedUntil > new Date()) {
      return res.status(403).json({
        message: `Your account is suspended until ${user.penalties.suspendedUntil.toLocaleDateString()}`
      });
    }

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = (end - start) / (1000 * 60);

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

    // One booking per day check
    const bookingDate = new Date(start);
    const dayStart = new Date(bookingDate.setHours(0, 0, 0, 0));
    const dayEnd = new Date(bookingDate.setHours(23, 59, 59, 999));

    const existingDailyBooking = await Booking.findOne({
      primaryBooker: req.userId,
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingDailyBooking) {
      return res.status(400).json({
        message: 'You already have a booking for this day. Only one booking per day allowed.',
        existingBooking: existingDailyBooking
      });
    }

    // Conflict detection (same facility, overlapping time)
    const conflicts = await Booking.find({
      facility: facilityId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Time slot is already booked. You can join the waitlist.',
        conflicts,
        canJoinWaitlist: true
      });
    }

    const participants = [];
    if (participantIds && participantIds.length > 0) {
      participantIds.forEach(userId => participants.push({ user: userId }));
    }

    const booking = await Booking.create({
      facility: facilityId,
      primaryBooker: req.userId,
      startTime: start,
      endTime: end,
      notes,
      isPublic: isPublic || false,
      participants
    });

    // Generate the check-in QR code now, while primaryBooker/_id are still
    // plain ObjectIds (not yet populated into full documents below).
    // Validity runs through the end of the booking, not a flat 15 minutes
    // from creation — /api/checkin/verify separately enforces that check-in
    // itself only opens 15 minutes before the slot starts.
    const qrToken = QRService.generateCheckInToken(booking._id, req.userId, booking.endTime);
    booking.checkIn.qrCode = await QRCode.toDataURL(qrToken.token);
    await booking.save();

    await booking.populate('facility primaryBooker participants.user');

    WebSocketService.notifyBookingConfirmed(req.userId, booking);

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------
// NEW: Slot availability for a facility on a given date.
// Frontend uses this to grey out / label slots as "Already Booked"
// before the user even tries to submit.
// ---------------------------------------------------------
router.get('/facility/:facilityId/availability', authMiddleware, async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.query; // 'YYYY-MM-DD'

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      facility: facilityId,
      status: { $in: ['confirmed', 'pending'] },
      startTime: { $gte: dayStart, $lte: dayEnd }
    }).select('startTime endTime primaryBooker');

    // Don't leak who booked it to other users — just the range,
    // plus whether it's the requester's own booking.
    const bookedSlots = bookings.map(b => ({
      startTime: b.startTime,
      endTime: b.endTime,
      isOwnBooking: b.primaryBooker.toString() === req.userId
    }));

    res.json({ success: true, bookedSlots });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join waitlist
router.post('/:id/join-waitlist', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.waitlist.some(w => w.user.toString() === req.userId)) {
      return res.status(400).json({ message: 'Already in waitlist' });
    }

    if (booking.waitlist.length >= booking.maxWaitlistSize) {
      return res.status(400).json({ message: 'Waitlist is full (max 5)' });
    }

    booking.waitlist.push({
      user: req.userId,
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
});

// Join as participant (for public bookings)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const facility = await Facility.findById(booking.facility);

    if (!booking.isPublic) {
      return res.status(403).json({ message: 'This booking is not public' });
    }

    if (booking.participants.some(p => p.user.toString() === req.userId)) {
      return res.status(400).json({ message: 'Already a participant' });
    }

    if (booking.participants.length >= facility.maxParticipants) {
      return res.status(400).json({ message: 'Booking is full' });
    }

    booking.participants.push({ user: req.userId });
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
});

// Get public bookings (matchmaking)
router.get('/public', authMiddleware, async (req, res) => {
  try {
    const { sport } = req.query;
    const filter = {
      isPublic: true,
      status: 'confirmed',
      startTime: { $gte: new Date() }
    };

    if (sport) {
      const facilities = await Facility.find({ sport }).select('_id');
      filter.facility = { $in: facilities.map(f => f._id) };
    }

    const bookings = await Booking.find(filter)
      .populate('facility')
      .populate('primaryBooker', 'name email department')
      .populate('participants.user', 'name email')
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
});

// Get user's bookings
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({ primaryBooker: req.userId })
      .populate('facility')
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
});

// ---------------------------------------------------------
// Cancel booking
// - promotes next waitlisted user if within cancellation window
// - applies a penalty (and 7-day suspension after 3 penalties)
//   for late cancellations
// ---------------------------------------------------------
router.post('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.primaryBooker.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'Booking cannot be cancelled' });
    }

    const now = new Date();
    const minutesUntilStart = (booking.startTime - now) / (1000 * 60);
    const withinWindow = minutesUntilStart >= 30; // 30-minute cancellation window

    if (withinWindow && booking.waitlist.length > 0) {
      const nextUser = booking.waitlist.shift();
      booking.primaryBooker = nextUser.user;
      booking.waitlist.forEach((w, idx) => (w.position = idx + 1));
      booking.cancellation = {
        cancelledBy: req.userId,
        cancelledAt: now,
        reason: reason || 'User cancellation - promoted from waitlist',
        withinWindow: true
      };
      await booking.save();
      await booking.populate('facility primaryBooker');

      WebSocketService.notifyWaitlistPromotion(nextUser.user.toString(), booking);

      return res.json({
        success: true,
        message: 'Booking cancelled. Next user from waitlist promoted.',
        booking,
        promoted: nextUser
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = { cancelledBy: req.userId, cancelledAt: now, reason, withinWindow };
    await booking.save();

    if (!withinWindow) {
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'penalties.count': 1 },
        $push: {
          'penalties.history': {
            bookingId: booking._id,
            reason: 'Late cancellation',
            date: now
          }
        }
      });

      const updatedUser = await User.findById(req.userId);
      if (updatedUser.penalties.count >= 3 && !updatedUser.penalties.isSuspended) {
        updatedUser.penalties.isSuspended = true;
        updatedUser.penalties.suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await updatedUser.save();
      }
    }

    res.json({
      success: true,
      message: withinWindow ? 'Booking cancelled (no penalty)' : 'Booking cancelled (penalty applied)',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
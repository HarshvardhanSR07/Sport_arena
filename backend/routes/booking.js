const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/public', bookingController.getPublicBookings);
router.post('/:bookingId/cancel', bookingController.cancelBooking);
router.post('/:bookingId/swap', bookingController.swapBookings);
router.post('/:bookingId/join-waitlist', bookingController.joinWaitlist);
router.post('/:bookingId/join', bookingController.joinAsParticipant);
router.post('/:bookingId/release', bookingController.releaseBooking);

module.exports = router;


// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

// Create booking with one-per-day rule
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { facilityId, startTime, endTime, notes, isPublic, participantIds } = req.body;

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

    // Conflict detection
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

    // Add participants if provided
    const participants = [];
    if (participantIds && participantIds.length > 0) {
      participantIds.forEach(userId => {
        participants.push({ user: userId });
      });
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

    await booking.populate('facility primaryBooker participants.user');

    res.status(201).json({
      success: true,
      booking
    });
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

// Cancel booking (with waitlist promotion)
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

    // If waitlist exists and within window, promote next user
    if (withinWindow && booking.waitlist.length > 0) {
      const nextUser = booking.waitlist.shift();
      booking.primaryBooker = nextUser.user;
      booking.waitlist.forEach((w, idx) => w.position = idx + 1);
      booking.cancellation = {
        cancelledBy: req.userId,
        cancelledAt: now,
        reason: reason || 'User cancellation - promoted from waitlist',
        withinWindow: true
      };
      await booking.save();
      await booking.populate('facility primaryBooker');

      return res.json({
        success: true,
        message: 'Booking cancelled. Next user from waitlist promoted.',
        booking,
        promoted: nextUser
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: req.userId,
      cancelledAt: now,
      reason,
      withinWindow
    };
    await booking.save();

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
  // Add this AFTER booking.save() in the cancel route:

// Apply penalty if late cancellation
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
   
     // Check if user should be suspended (3+ penalties)
     const user = await User.findById(req.userId);
     if (user.penalties.count >= 3 && !user.penalties.isSuspended) {
       user.penalties.isSuspended = true;
       user.penalties.suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
       await user.save();
     }
   }
   
   // Add this at the start of the POST '/' route, before facility lookup:

const user = await User.findById(req.userId);
if (user.penalties.isSuspended && user.penalties.suspendedUntil > new Date()) {
  return res.status(403).json({ 
    message: `Your account is suspended until ${user.penalties.suspendedUntil.toLocaleDateString()}`  });
}

// At the top of the file, add:
const WebSocketService = require('../services/websocketService');

// In the POST '/' route, after booking creation:
WebSocketService.notifyBookingConfirmed(req.userId, booking);

// In the POST '/:id/cancel' route, when promoting from waitlist:
if (nextUser) {
  WebSocketService.notifyWaitlistPromotion(nextUser.user.toString(), booking);
}

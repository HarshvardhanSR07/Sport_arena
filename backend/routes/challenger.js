const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Facility = require('../models/Facility');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Create challenger post
router.post('/', async (req, res) => {
  try {
    const { facilityId, startTime, endTime, skillLevel, message } = req.body;

    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const conflicts = await Booking.find({
      facility: facilityId,
      status: 'confirmed',
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } }
      ]
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Slot already booked' });
    }

    const QRCode = require('qrcode');
    const { v4: uuidv4 } = require('uuid');
    const qrCode = await QRCode.toDataURL(JSON.stringify({
      bookingId: uuidv4(),
      timestamp: Date.now()
    }));

    const booking = await Booking.create({
      facility: facilityId,
      primaryBooker: req.user._id,
      startTime,
      endTime,
      isPublic: true,
      challengerMode: {
        isActive: true,
        skillLevel,
        message
      },
      checkIn: { qrCode },
      status: 'confirmed'
    });

    res.status(201).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get challenger posts
router.get('/', async (req, res) => {
  try {
    const { sport, skillLevel } = req.query;

    const filter = {
      isPublic: true,
      'challengerMode.isActive': true,
      status: 'confirmed',
      startTime: { $gte: new Date() }
    };

    const bookings = await Booking.find(filter)
      .populate('facility')
      .populate('primaryBooker', 'name email department rollNumber')
      .populate('participants.user', 'name email')
      .sort({ startTime: 1 })
      .limit(100);

    let filtered = bookings;
    if (sport) {
      filtered = filtered.filter(b => b.facility.sport === sport);
    }
    if (skillLevel) {
      filtered = filtered.filter(b => b.challengerMode.skillLevel === skillLevel);
    }

    res.json({ success: true, count: filtered.length, bookings: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to challenger
router.post('/:bookingId/respond', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Challenger post not found' });
    }

    const facility = await Facility.findById(booking.facility);

    if (booking.participants.length >= facility.maxParticipants) {
      return res.status(400).json({ message: 'Challenger post is full' });
    }

    if (booking.participants.some(p => p.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already responded' });
    }

    booking.participants.push({ user: req.user._id });
    await booking.save();

    res.json({ success: true, message: 'Response submitted successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
// backend/routes/checkin.js
const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');
const QRService = require('../services/qrService');

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

// Check in via QR code data
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR code data is required' });
    }

    // Peek at the token just to learn which booking it claims to be for.
    // The actual trust decision happens below in QRService.validateToken,
    // which re-decodes the same token and checks its HMAC signature and expiry —
    // this peek alone proves nothing on its own.
    let claimedBookingId;
    try {
      claimedBookingId = JSON.parse(Buffer.from(qrData, 'base64').toString()).bookingId;
    } catch {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    if (!claimedBookingId) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const verification = QRService.validateToken(qrData, claimedBookingId, req.userId);

    if (!verification.valid) {
      return res.status(400).json({ message: verification.reason });
    }

    const booking = await Booking.findById(claimedBookingId).populate('facility primaryBooker');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.primaryBooker._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'This QR code is not for your booking' });
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const minutesUntilStart = (startTime - now) / (1000 * 60);

    if (minutesUntilStart > 15) {
      return res.status(400).json({
        message: `Check-in opens 15 minutes before your slot. Please wait ${Math.round(minutesUntilStart - 15)} more minutes.`
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        message: 'Your time slot has ended. QR code is no longer valid.',
        expired: true
      });
    }

    if (booking.checkIn.isCheckedIn) {
      return res.status(400).json({
        message: `Already checked in at ${booking.checkIn.checkedInAt.toLocaleString()}`
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        message: `Cannot check in. Booking status: ${booking.status}`
      });
    }

    booking.checkIn.isCheckedIn = true;
    booking.checkIn.checkedInAt = now;
    booking.checkIn.checkedInBy = req.userId;
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful! Enjoy your game.',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Manual check-in (for testing)
router.post('/:id/manual', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.primaryBooker.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    const minutesUntilStart = (startTime - now) / (1000 * 60);

    if (minutesUntilStart > 15) {
      return res.status(400).json({ message: `Check-in opens 15 minutes before your slot` });
    }

    if (now > endTime) {
      return res.status(400).json({ message: 'Your time slot has ended', expired: true });
    }

    booking.checkIn.isCheckedIn = true;
    booking.checkIn.checkedInAt = now;
    booking.checkIn.checkedInBy = req.userId;
    await booking.save();

    res.json({ success: true, message: 'Check-in successful!', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
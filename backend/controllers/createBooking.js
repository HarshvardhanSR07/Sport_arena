// backend/controllers/createBooking.js
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Booking = require('../models/Booking');

async function createBooking(req, res) {
  try {
    const { facilityId, start, end, notes, isPublic, participants } = req.body;

    // Pre-generate the _id so the QR payload can reference it, and so
    // the booking (with its QR code already attached) is written once
    // instead of create() -> generate QR -> save() (two round trips).
    const bookingId = new mongoose.Types.ObjectId();

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify({
      bookingId: bookingId.toString(),
      userId: req.userId.toString(),
      facilityId,
      startTime: start,
      timestamp: Date.now()
    }));

    const booking = await Booking.create({
      _id: bookingId,
      facility: facilityId,
      primaryBooker: req.userId,
      startTime: start,
      endTime: end,
      notes,
      isPublic: isPublic || false,
      participants,
      checkIn: { qrCode: qrCodeDataURL }
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { createBooking };
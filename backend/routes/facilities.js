// backend/routes/facilities.js
const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Booking = require('../models/Booking');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Get all facilities (public)
router.get('/', async (req, res) => {
  try {
    const { sport, type } = req.query;
    const filter = { isActive: true };
    if (sport) filter.sport = sport;
    if (type) filter.type = type;

    const facilities = await Facility.find(filter).sort({ sport: 1, name: 1 });
    res.json({ success: true, count: facilities.length, facilities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single facility
router.get('/:id', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ success: true, facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check availability — either a specific slot, or a full day's schedule
router.get('/:facilityId/availability', async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    const activeStatuses = ['confirmed', 'pending', 'completed'];
    const { startTime, endTime, date } = req.query;

    // Case 1: is this exact slot free?
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      const conflicts = await Booking.find({
        facility: facility._id,
        status: { $in: activeStatuses },
        startTime: { $lt: end },
        endTime: { $gt: start }
      }).select('startTime endTime status');

      const maintenanceConflict = (facility.maintenanceSlots || []).some(
        (slot) => slot.startTime < end && slot.endTime > start
      );

      return res.json({
        success: true,
        available: conflicts.length === 0 && !maintenanceConflict,
        conflicts,
        maintenanceConflict
      });
    }

    // Case 2: give me the whole day's bookings (for a calendar view)
    const day = date ? new Date(date) : new Date();
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);

    const bookings = await Booking.find({
      facility: facility._id,
      status: { $in: activeStatuses },
      startTime: { $lt: dayEnd },
      endTime: { $gt: dayStart }
    }).select('startTime endTime status primaryBooker');

    const maintenance = (facility.maintenanceSlots || []).filter(
      (slot) => slot.startTime < dayEnd && slot.endTime > dayStart
    );

    res.json({
      success: true,
      date: dayStart.toISOString().split('T')[0],
      bookings,
      maintenance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create facility (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const facility = await Facility.create(req.body);
    res.status(201).json({ success: true, facility });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update facility (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ success: true, facility });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Deactivate facility (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }
    res.json({ success: true, message: 'Facility deactivated', facility });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
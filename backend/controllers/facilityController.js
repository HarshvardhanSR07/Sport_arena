const Facility = require('../models/Facility');

// Get all facilities
exports.getAllFacilities = async (req, res) => {
  try {
    const { sport, type, isActive } = req.query;
    
    const filter = {};
    if (sport) filter.sport = sport;
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const facilities = await Facility.find(filter).sort({ sport: 1, name: 1 });

    res.json({
      success: true,
      count: facilities.length,
      facilities
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single facility
exports.getFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    res.json({
      success: true,
      facility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create facility (Admin only)
exports.createFacility = async (req, res) => {
  try {
    const facility = await Facility.create(req.body);

    res.status(201).json({
      success: true,
      facility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update facility
exports.updateFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    res.json({
      success: true,
      facility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete facility
exports.deleteFacility = async (req, res) => {
  try {
    const facility = await Facility.findByIdAndDelete(req.params.id);

    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    res.json({
      success: true,
      message: 'Facility deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check facility availability
exports.checkAvailability = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start and end time required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const Booking = require('../models/Booking');

    // Check for conflicting bookings
    const conflictingBookings = await Booking.find({
      facility: facilityId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ]
    }).populate('primaryBooker', 'name')
 .populate('waitlist.user', 'name');

    const facility = await Facility.findById(facilityId);
    
    // Check maintenance
    const inMaintenance = facility.maintenanceSlots.some(slot => 
      slot.startTime <= start && slot.endTime >= end
    );

    res.json({
      success: true,
      available: conflictingBookings.length === 0 && !inMaintenance,
      conflictingBookings,
      inMaintenance,
      facility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


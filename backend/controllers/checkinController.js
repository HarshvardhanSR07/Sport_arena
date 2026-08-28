const Booking = require('../models/Booking');
const User = require('../models/User');

// Check in via QR code
exports.checkInByQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data required' });
    }

    let parsedQR;
    try {
      parsedQR = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    // Find booking by qrCode
    const booking = await Booking.findOne({
      'checkIn.qrCode': { $exists: true }
  }).populate('facility primaryBooker');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify QR matches
    if (booking.checkIn.qrCode !== qrData && booking.checkIn.qrCode !== parsedQR.qrCode) {
      return res.status(401).json({ message: 'Invalid QR code' });
    }

    // Check time window (15 minutes before to 15 minutes after start)
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const endTime = new Date(booking.endTime);
    
    const minutesUntilStart = (startTime - now) / (1000 * 60);
    const minutesAfterStart = (now - startTime) / (1000 * 60);

    if (minutesUntilStart > 15) {
      return res.status(400).json({ 
        message: 'Too early to check in. Check-in opens 15 minutes before start time.',
 minutesUntilStart: Math.round(minutesUntilStart)
      });
    }

    if (minutesAfterStart > 15 && !booking.checkIn.isCheckedIn) {
      return res.status(400).json({ 
        message: 'Check-in window expired. Booking will be released to waitlist.',
        expired: true
      });
    }

    // Check if booking is still valid
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: `Cannot check in. Booking status: ${booking.status}` 
      });
    }

    // Perform check-in
    booking.checkIn.isCheckedIn = true;
    booking.checkIn.checkedInAt = now;
    booking.checkIn.checkedInBy = req.user._id;
    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manual check-in (admin/facility staff)
exports.manualCheckIn = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: `Cannot check in. Booking status: ${booking.status}` 
      });
    }

    booking.checkIn.isCheckedIn = true;
    booking.checkIn.checkedInAt = new Date();
    booking.checkIn.checkedInBy = userId;
    await booking.save();

    res.json({
      success: true,
      message: 'Manual check-in successful',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

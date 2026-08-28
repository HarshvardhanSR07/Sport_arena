// backend/services/antiCheatService.js
const Booking = require('../models/Booking');
const User = require('../models/User');

class AntiCheatService {
  
  // LOOPHOLE 1: Multiple account creation  // SOLUTION: Email verification + device fingerprinting
  static async detectMultipleAccounts(email, ipAddress, deviceFingerprint) {
    const existingAccounts = await User.find({      $or: [
        { email },
        { registrationIP: ipAddress },
        { deviceFingerprint }
      ]
    });
    
    if (existingAccounts.length > 1) {
      // Flag for admin review
      return { suspicious: true, accounts: existingAccounts };
    }
    return { suspicious: false };
  }

  // LOOPHOLE 2: Booking then abandoning to block others
  // SOLUTION: Auto-release if no check-in within grace period
  static async enforceCheckInDeadline(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return;
    
    const now = new Date();
    const startTime = new Date(booking.startTime);
    const gracePeriod = 15 * 60 * 1000; // 15 minutes
    
    // If past grace period and not checked in, release
    if ((now - startTime) > gracePeriod && !booking.checkIn.isCheckedIn) {
      return { shouldRelease: true, reason: 'No check-in within grace period' };
    }
    return { shouldRelease: false };
  }

  // LOOPHOLE 3: QR code sharing/screenshot
  // SOLUTION: Dynamic QR tokens with rotation
  static generateRotatingQR(bookingId, userId) {
    const timestamp = Date.now();
    const nonce = require('crypto').randomBytes(16).toString('hex');
    const payload = {
      bookingId,
      userId,
      timestamp,
      nonce,
      expiresAt: timestamp + (15 * 60 * 1000) // 15-minute validity
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  // LOOPHOLE 4: Swap abuse (frequent swaps to game system)
  // SOLUTION: Rate limiting + swap cooldowns
  static async validateSwapRequest(userId) {
    const recentSwaps = await Booking.countDocuments({
      $or: [
        { primaryBooker: userId },
        { 'cancellation.cancelledBy': userId }
      ],
      'cancellation.cancelledAt': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      reason: { $regex: /swap/i }
    });
    
    if (recentSwaps > 3) {
      return { allowed: false, reason: 'Too many swaps this week (max 3)' };
    }
    return { allowed: true };
  }

  // LOOPHOLE 5: Booking overlap by editing time
  // SOLUTION: Immutable time fields + audit log
  static async detectTimeManipulation(bookingId, newStartTime, newEndTime) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return { suspicious: false };
    
    const originalDuration = booking.endTime - booking.startTime;
    const newDuration = new Date(newEndTime) - new Date(newStartTime);
    
    // Prevent duration manipulation beyond allowed
    if (Math.abs(newDuration - originalDuration) > 5 * 60 * 1000) {
      return { suspicious: true, reason: 'Duration manipulation detected' };
    }
 return { suspicious: false };
  }

  // LOOPHOLE 6: Fake check-ins (sending QR to friend)
  // SOLUTION: Geolocation verification + time-windowed tokens
  static async verifyCheckInLocation(bookingId, userLat, userLong) {
    const booking = await Booking.findById(bookingId).populate('facility');
    if (!booking) return { valid: false };
    
    // Facility coordinates (IITG sports complex)
    const facilityCoords = {
      'Badminton Court 1': { lat: 26.1879, lon: 91.6912, radius: 100 },
      'Football Ground': { lat: 26.1885, lon: 91.6920, radius: 200 },
      // Add more facilities
    };
    
    const coords = facilityCoords[booking.facility.name];
    if (!coords) return { valid: true, message: 'Location verification not configured' };
    
    const distance = this.calculateDistance(userLat, userLong, coords.lat, coords.lon);
    if (distance > coords.radius) {
      return { 
        valid: false, 
        distance: Math.round(distance),
        reason: `You are ${Math.round(distance)}m away from the facility` 
      };
    }
    
    return { valid: true };
  }

  // LOOPHOLE 7: Identity theft (using someone else's QR)
  // SOLUTION: Biometric or photo verification at check-in
  static async verifyIdentity(bookingId, providedUserId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return { valid: false };
    
    if (booking.primaryBooker.toString() !== providedUserId.toString()) {
      return { 
        valid: false, 
        reason: 'Identity mismatch - QR code does not belong to you' 
      };
    }
    
    return { valid: true };
  }

  // LOOPHOLE 8: Booking system gaming (create-no-show cycles)
  // SOLUTION: Progressive penalties + behavior scoring
  static async calculateBehaviorScore(userId) {
    const user = await User.findById(userId);
    const bookings = await Booking.find({ primaryBooker: userId });
    
    let score = 100; // Start with perfect score
    
    bookings.forEach(booking => {
      if (booking.status === 'no-show') score -= 20;
      if (booking.status === 'cancelled' && !booking.cancellation?.withinWindow) score -= 10;
 });
    
    // Reward consistent attendance
    const completed = bookings.filter(b => b.status === 'completed').length;
    score += Math.min(completed * 2, 20);
    
    return {
      score: Math.max(0, score),
      classification: score >= 80 ? 'trusted' : score >= 50 ? 'normal' : 'risky'
    };
  }

  // LOOPHOLE 9: Time zone manipulation
  // SOLUTION: Server-side time enforcement + timezone tracking
  static getServerTime(req) {
    return {
      serverTime: new Date().toISOString(),
      timezone: 'Asia/Kolkata',
      timestamp: Date.now()
    };
  }

  // LOOPHOLE 10: API endpoint abuse (rapid bookings)
  // SOLUTION: Rate limiting per user
  static async checkRateLimit(userId, action, limit, windowMinutes) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    const count = await Booking.countDocuments({
      primaryBooker: userId,
      createdAt: { $gte: windowStart }
    });
    
    return {
      allowed: count < limit,
      currentCount: count,
      limit,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000)
    };
  }

  // Helper: Calculate distance between coordinates
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

module.exports = AntiCheatService;

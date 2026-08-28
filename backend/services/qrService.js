// backend/services/qrService.js
const crypto = require('crypto');

class QRService {
  
  // Generate time-limited QR token
  static generateCheckInToken(bookingId, userId) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiresAt = timestamp + (15 * 60 * 1000); // 15 minutes
    
    const payload = {
      bookingId: bookingId.toString(),
      userId: userId.toString(),
      timestamp,
      nonce,
      expiresAt
    };
    
    // Sign with secret key
    const signature = crypto .createHmac('sha256', process.env.QR_SECRET || 'iitg_qr_secret')
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return {
      token: Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64'),
      expiresAt: new Date(expiresAt),
      qrCodeDataURL: null // Will be set when converted to QR image
    };
  }

  // Validate QR token
  static validateToken(token, currentBookingId, currentUserId) {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      // Check expiration
      if (Date.now() > decoded.expiresAt) {
        return { valid: false, reason: 'QR code expired' };
      }
      
      // Verify signature
      const { signature, ...payload } = decoded;
      const expectedSignature = crypto
 .createHmac('sha256', process.env.QR_SECRET || 'iitg_qr_secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return { valid: false, reason: 'Invalid QR signature' };
      }
      
      // Check booking match
      if (decoded.bookingId !== currentBookingId.toString()) {
        return { valid: false, reason: 'QR for different booking' };
      }
      
      // Check user match
      if (decoded.userId !== currentUserId.toString()) {
        return { valid: false, reason: 'QR does not belong to this user' };
      }
      
      return { valid: true, payload: decoded };
    } catch (error) {
      return { valid: false, reason: 'Malformed QR data' };
    }
  }

  // Check if booking time is over
  static isBookingTimeOver(booking) {
    const now = Date.now();
    const endTime = new Date(booking.endTime).getTime();
    return now > endTime;
  }
}

module.exports = QRService;

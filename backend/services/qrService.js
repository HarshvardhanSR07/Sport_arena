// backend/services/qrService.js
const crypto = require('crypto');

class QRService {

  // Generate a signed QR token.
  // `expiresAt` (Date | timestamp, optional) lets the caller scope validity
  // to something meaningful — e.g. the booking's end time — instead of the
  // old hardcoded "15 minutes from whenever this was generated", which broke
  // check-in for anyone who downloaded their QR code more than 15 minutes
  // before actually showing up. Falls back to the old 15-minute default if
  // no expiry is passed in, so existing callers keep working.
  static generateCheckInToken(bookingId, userId, expiresAt) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const expiry = expiresAt ? new Date(expiresAt).getTime() : timestamp + (15 * 60 * 1000);

    const payload = {
      bookingId: bookingId.toString(),
      userId: userId.toString(),
      timestamp,
      nonce,
      expiresAt: expiry
    };

    // Sign with secret key
    const signature = crypto.createHmac('sha256', process.env.QR_SECRET || 'iitg_qr_secret')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      token: Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64'),
      expiresAt: new Date(expiry),
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
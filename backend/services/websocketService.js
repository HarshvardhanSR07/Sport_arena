// backend/services/websocketService.js
/*const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? 'your_frontend_url' 
          : 'http://localhost:5173',
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) return next(new Error('Invalid user'));

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ WebSocket server initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Track connection
    this.connectedUsers.set(userId, socket.id);
    
    console.log(`🟢 User connected: ${socket.user.name} (${userId})`);
    
    // Join personal room
    socket.join(`user:${userId}`);
    
    // Send connection confirmation
    socket.emit('connected', {
      message: 'Real-time notifications enabled',
      timestamp: new Date().toISOString()
    });

    // Handle facility subscription (for live availability)
    socket.on('subscribe:facility', (facilityId) => {
      socket.join(`facility:${facilityId}`);
    });

    socket.on('unsubscribe:facility', (facilityId) => {
      socket.leave(`facility:${facilityId}`);
    });

    // Handle booking status updates subscription
    socket.on('subscribe:booking', (bookingId) => {
      socket.join(`booking:${bookingId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.connectedUsers.delete(userId);
      console.log(`🔴 User disconnected: ${socket.user.name}`);
    });

    // Typing indicator for messages
    socket.on('typing', (data) => {
      socket.to(`booking:${data.bookingId}`).emit('user:typing', {
        userId,
        name: socket.user.name
      });
    });
  }

  // Notify user of booking confirmation
  notifyBookingConfirmed(userId, booking) {
    this.io.to(`user:${userId}`).emit('booking:confirmed', {
      booking,
      message: `Your booking for ${booking.facility.name} is confirmed!`,
      timestamp: new Date()
    });
  }

  // Notify waitlist promotion
  notifyWaitlistPromotion(userId, booking) {
    this.io.to(`user:${userId}`).emit('waitlist:promoted', {
      booking,
      message: `🎉 You've been promoted from waitlist! Your slot for ${booking.facility.name} is now confirmed.`,
      timestamp: new Date()
    });
  }

  // Notify booking cancellation
  notifyBookingCancelled(userId, booking) {
    this.io.to(`user:${userId}`).emit('booking:cancelled', {
      booking,
      message: `Your booking for ${booking.facility.name} has been cancelled.`,
      timestamp: new Date()
    });
  }

  // Notify slot released (to waitlist)
  notifySlotAvailable(facilityId, booking) {
    this.io.to(`facility:${facilityId}`).emit('slot:available', {
      booking,
      message: `A slot opened up for ${booking.facility.name}!`,
      timestamp: new Date()
    });
  }

  // Broadcast facility status change
  broadcastFacilityUpdate(facilityId, update) {
    this.io.to(`facility:${facilityId}`).emit('facility:updated', {
      facilityId,
      update,
      timestamp: new Date()
    });
  }

  // Send check-in reminder (15 min before)
  sendCheckInReminder(userId, booking) {
    this.io.to(`user:${userId}`).emit('checkin:reminder', {
      booking,
      message: `⏰ Your slot starts in 15 minutes! Don't forget to check in.`,
      qrCode: booking.checkIn?.qrCode,
      timestamp: new Date()
    });
  }

  // Penalty notification
  notifyPenalty(userId, penaltyInfo) {
    this.io.to(`user:${userId}`).emit('penalty:applied', {
      penalty: penaltyInfo,
      message: `⚠️ You've received a penalty: ${penaltyInfo.reason}`,
      timestamp: new Date()
    });
  }

  // Challenger notification (someone wants to join)
  notifyChallengerResponse(bookingOwnerId, booking, response) {
    this.io.to(`user:${bookingOwnerId}`).emit('challenger:response', {
      booking,
      response,
      message: `${response.user.name} wants to join your challenge!`,
      timestamp: new Date()
    });
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.connectedUsers.has(userId.toString());
  }
}

module.exports = new WebSocketService();

*/



// backend/services/websocketService.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
        credentials: true
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) return next(new Error('Invalid user'));

        socket.userId = user._id.toString();
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    console.log('✅ WebSocket server initialized');
  }

  handleConnection(socket) {
    const userId = socket.userId;
    this.connectedUsers.set(userId, socket.id);
    
    console.log(`🟢 User connected: ${socket.user.name}`);
    
    socket.join(`user:${userId}`);
    
    socket.emit('connected', {
      message: 'Real-time notifications enabled'
    });

    socket.on('disconnect', () => {
      this.connectedUsers.delete(userId);
      console.log(`🔴 User disconnected: ${socket.user.name}`);
    });
  }

  notifyBookingConfirmed(userId, booking) {
    this.io.to(`user:${userId}`).emit('booking:confirmed', {
      message: `Your booking for ${booking.facility?.name} is confirmed!`,
      booking
    });
  }

  notifyWaitlistPromotion(userId, booking) {
    this.io.to(`user:${userId}`).emit('waitlist:promoted', {
      message: `🎉 You've been promoted from waitlist! Your slot is confirmed.`,
      booking
    });
  }

  notifyBookingCancelled(userId, booking) {
    this.io.to(`user:${userId}`).emit('booking:cancelled', {
      message: `Your booking for ${booking.facility?.name} has been cancelled.`,
      booking
    });
  }

  notifySlotAvailable(facilityId, booking) {
    this.io.emit('slot:available', {
      message: `A slot opened up!`,
      facilityId,
      booking
    });
  }

  notifyPenalty(userId, penaltyInfo) {
    this.io.to(`user:${userId}`).emit('penalty:applied', {
      message: `⚠️ Penalty applied: ${penaltyInfo.reason}`,
      penalty: penaltyInfo
    });
  }
}

module.exports = new WebSocketService();

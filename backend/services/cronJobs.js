const cron = require('node-cron');
const WebSocketService = require('./websocketService');

let Booking;
try {
  Booking = require('../models/Booking');
} catch {
  Booking = null;
}

const sendCheckInReminders = async () => {
  if (!Booking) return;

  try {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 15 * 60 * 1000);

    const bookings = await Booking.find({
      status: 'confirmed',
      startTime: {
        $gte: now,
        $lte: reminderWindow
      },
      'checkIn.isCheckedIn': false,
      reminderSent: { $ne: true }
    }).populate('facility primaryBooker');

    bookings.forEach((booking) => {
      const minutesUntilStart = (new Date(booking.startTime) - now) / (1000 * 60);

      if (minutesUntilStart >= 10 && minutesUntilStart <= 15) {
        WebSocketService.sendCheckInReminder(booking.primaryBooker._id, booking);
        booking.reminderSent = true;
        booking.save();
      }
    });
  } catch (error) {
    console.error('Reminder job error:', error);
  }
};

const initCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    await sendCheckInReminders();
  });
  console.log('⏰ Cron jobs initialized');
};

module.exports = { initCronJobs };

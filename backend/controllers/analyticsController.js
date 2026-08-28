const Booking = require('../models/Booking');
const Facility = require('../models/Facility');

const toLocalDayKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Get weekly traffic chart data
exports.getWeeklyTraffic = async (req, res) => {
  try {
    const { facilityId, sport, weeks = 1 } = req.query;

    const startDate = new Date();
startDate.setDate(startDate.getDate() - (7 * weeks));   // today − 7
for (let i = 0; i < 7; i++) {           // i = 0..6
  const day = new Date(startDate);
  day.setDate(day.getDate() + i);       // startDate+0 ... startDate+6

    const filter = {
      startTime: { $gte: startDate },
      status: { $in: ['confirmed', 'completed'] }
    };

    if (facilityId) {
      filter.facility = facilityId;
    } else if (sport) {
      const facilities = await Facility.find({ sport }).select('_id');
      filter.facility = { $in: facilities.map(f => f._id) };
    }

    const bookings = await Booking.find(filter)
      .populate('facility', 'sport name')
      .select('startTime endTime facility');

    const trafficData = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dayKey = toLocalDayKey(day);
      trafficData[dayKey] = Array(24).fill(0);
    }

    bookings.forEach(booking => {
      const date = booking.startTime;
      const dayKey = toLocalDayKey(date);
      const hour = date.getHours();

      if (trafficData[dayKey]) {
        const duration = (booking.endTime - booking.startTime) / (1000 * 60 * 60);
        trafficData[dayKey][hour] += duration;
      }
    });

    const result = Object.entries(trafficData).map(([date, hours]) => ({
      date,
      hours: hours.map((count, hour) => ({
        hour,
        bookings: Math.round(count * 10) / 10,
        intensity: count > 2 ? 'high' : count > 0.5 ? 'medium' : count > 0 ? 'low' : 'none'
      }))
    }));

    const hourTotals = Array(24).fill(0);
    result.forEach(day => {
      day.hours.forEach(h => {
        hourTotals[h.hour] += h.bookings;
      });
    });

    const peakHours = hourTotals
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (7 * weeks - 1));  // was: 7 * weeks
      startDate.setHours(0, 0, 0, 0);

    res.json({
      success: true,
      trafficData: result,
      peakHours,
      summary: {
        totalBookings: bookings.length,
        averagePerDay: (bookings.length / 7).toFixed(2)
      }
    });
  } 
} catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get sport popularity
exports.getSportPopularity = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const bookings = await Booking.aggregate([
      {
        $match: {
          startTime: { $gte: startDate },
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $lookup: {
          from: 'facilities',
          localField: 'facility',
          foreignField: '_id',
          as: 'facilityData'
        }
      },
      { $unwind: '$facilityData' },
      {
        $group: {
          _id: '$facilityData.sport',
          count: { $sum: 1 },
          totalHours: {
            $sum: {
              $divide: [
                { $subtract: ['$endTime', '$startTime'] },
                1000 * 60 * 60
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      popularity: bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
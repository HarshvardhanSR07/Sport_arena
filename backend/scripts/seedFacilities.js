// backend/scripts/seedFacilities.js
require('dotenv').config();
const connectDB = require('../config/db');
const Facility = require('../models/Facility');

const demoFacilities = [
  {
    name: 'Badminton Court 1',
    type: 'indoor',
    sport: 'badminton',
    capacity: 4,
    minParticipants: 2,
    maxParticipants: 4,
    location: 'Sports Complex, Ground Floor',
    description: 'Wooden court with standard net height',
    equipment: ['rackets available on request', 'shuttlecocks'],
    bookingRules: { maxDurationHours: 2, minDurationMinutes: 30 }
  },
  {
    name: 'Tennis Court A',
    type: 'outdoor',
    sport: 'tennis',
    capacity: 4,
    minParticipants: 2,
    maxParticipants: 4,
    location: 'Outdoor Sports Ground',
    description: 'Hard court, floodlit for evening play',
    equipment: [],
    bookingRules: { maxDurationHours: 2, minDurationMinutes: 60 }
  },
  {
    name: 'Basketball Court',
    type: 'outdoor',
    sport: 'basketball',
    capacity: 10,
    minParticipants: 2,
    maxParticipants: 10,
    location: 'Sports Complex, Outdoor Area',
    description: 'Full-size court, floodlit',
    equipment: ['basketballs available at counter'],
    bookingRules: { maxDurationHours: 2, minDurationMinutes: 30 }
  },
  {
    name: 'Football Ground',
    type: 'outdoor',
    sport: 'football',
    capacity: 22,
    minParticipants: 4,
    maxParticipants: 22,
    location: 'Main Sports Ground',
    description: 'Full-size turf ground',
    equipment: [],
    bookingRules: { maxDurationHours: 3, minDurationMinutes: 60 }
  },
  {
    name: 'Table Tennis Room',
    type: 'indoor',
    sport: 'table-tennis',
    capacity: 4,
    minParticipants: 1,
    maxParticipants: 4,
    location: 'Sports Complex, First Floor',
    description: '2 tables, paddles available',
    equipment: ['paddles', 'balls'],
    bookingRules: { maxDurationHours: 1, minDurationMinutes: 30 }
  },
  {
    name: 'Swimming Pool',
    type: 'outdoor',
    sport: 'swimming',
    capacity: 30,
    minParticipants: 1,
    maxParticipants: 30,
    location: 'Aquatic Center',
    description: 'Olympic-size pool, lifeguard on duty',
    equipment: [],
    bookingRules: { maxDurationHours: 2, minDurationMinutes: 30 }
  }
];

const seed = async () => {
  await connectDB();

  for (const demo of demoFacilities) {
    const exists = await Facility.findOne({ name: demo.name });
    if (exists) {
      console.log(`⚠️  ${demo.name} already exists — skipping`);
      continue;
    }
    await Facility.create(demo);
    console.log(`✅ Created facility: ${demo.name}`);
  }

  console.log('Done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
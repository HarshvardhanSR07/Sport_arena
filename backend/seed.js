// backend/seed.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Facility = require('./models/Facility');

dotenv.config();

const seedFacilities = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌱 Seeding facilities...');

    await Facility.deleteMany({});

    const facilities = [
      {
        name: 'Badminton Court 1',
        type: 'indoor',
        sport: 'badminton',
        capacity: 4,
        minParticipants: 2,
        maxParticipants: 4,
        location: 'Sports Complex, Indoor Hall',
        equipment: ['Rackets', 'Shuttlecocks']
      },
      {
        name: 'Badminton Court 2',
        type: 'indoor',
        sport: 'badminton',
        capacity: 4,
        minParticipants: 2,
        maxParticipants: 4,
        location: 'Sports Complex, Indoor Hall',
        equipment: ['Rackets', 'Shuttlecocks']
      },
      {
        name: 'Football Ground',
        type: 'outdoor',
        sport: 'football',
        capacity: 22,
        minParticipants: 8,
        maxParticipants: 22,
        location: 'Main Sports Ground',
        description: 'Full-size football field',
        equipment: ['Football', 'Goal Posts']
      },
      {
        name: 'Basketball Court',
        type: 'outdoor',
        sport: 'basketball',
        capacity: 10,
        minParticipants: 4,
        maxParticipants: 10,
        location: 'Near Hostel Area',
        equipment: ['Basketballs']
      },
      {
        name: 'Tennis Court 1',
        type: 'outdoor',
        sport: 'tennis',
        capacity: 4,
        minParticipants: 2,
        maxParticipants: 4,
        location: 'Tennis Complex'
      },
      {
        name: 'Table Tennis Room',
        type: 'indoor',
        sport: 'table-tennis',
        capacity: 4,
        minParticipants: 2,
        maxParticipants: 4,
        location: 'SAC Building',
        equipment: ['Paddles', 'Balls']
      },
      {
        name: 'Swimming Pool',
        type: 'indoor',
        sport: 'swimming',
        capacity: 20,
        minParticipants: 1,
        maxParticipants: 20,
        location: 'Aquatic Center'
      }
    ];

    await Facility.insertMany(facilities);
    console.log(`✅ Created ${facilities.length} facilities`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedFacilities();

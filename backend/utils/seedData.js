const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Facility = require('../models/Facility');

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await Facility.deleteMany({});

    // Create admin user
    const admin = await User.create({
      name: 'Sports Admin',
      email: 'admin@iitg.ac.in',
      password: 'admin123',
      role: 'admin',
      department: 'Sports Office'
    });

    // Create sample students
    const students = await User.create([
      {
        name: 'Rahul Sharma',
        email: 'r.sharma@iitg.ac.in',
        password: 'student123',
        role: 'student',
        department: 'Computer Science',
        rollNumber: '210101001'
      },
      {
        name: 'Priya Verma',
        email: 'p.verma@iitg.ac.in',
        password: 'student123',
        role: 'student',
        department: 'Electronics',
        rollNumber: '210102002'
      },
      {
        name: 'Amit Kumar',
        email: 'a.kumar@iitg.ac.in',
        password: 'student123',
        role: 'faculty',
        department: 'Mechanical'
      }
    ]);

    // Create facilities
    const facilities = await Facility.insertMany([
      {
        name: 'Badminton Court 1',
        type: 'indoor',
        sport: 'badminton',
        capacity: 4,
        minParticipants: 2,
        maxParticipants: 4,
        location: 'Sports Complex, Indoor Hall',
        equipment: ['Rackets', 'Shuttlecocks'],
        bookingRules: { maxDurationHours: 2, minDurationMinutes: 60 }
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
        description: 'Full-size football field with proper markings',
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
    ]);

    console.log(`✅ Created ${students.length} users, ${facilities.length} facilities`);
    console.log('\n📝 Sample Login Credentials:');
    console.log('   Admin: admin@iitg.ac.in / admin123');
    console.log('   Student: r.sharma@iitg.ac.in / student123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();

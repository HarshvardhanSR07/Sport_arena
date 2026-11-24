// backend/scripts/seedUsers.js
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const demoUsers = [
  {
    name: 'R. Sharma',
    email: 'r.sharma@example.com',
    password: process.env.SEED_STUDENT_PASSWORD || 'student_demo_pass',
    role: 'student',
    department: 'Computer Science and Engineering',
    rollNumber: '210101001'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin_demo_pass',
    role: 'admin',
    department: 'Administration'
  }
];

const seed = async () => {
  await connectDB();

  for (const demo of demoUsers) {
    const exists = await User.findOne({ email: demo.email });
    if (exists) {
      console.log(`⚠️  ${demo.email} already exists — skipping`);
      continue;
    }
    await User.create(demo);
    console.log(`✅ Created ${demo.role}: ${demo.email}`);
  }

  console.log('Done.');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
// Run ONCE to create admin account
// Command: node createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Remove existing admin if any (fresh start)
  await User.deleteMany({ role: 'admin' });
  console.log('Old admin removed (if any)');

  const hashed = await bcrypt.hash('admin123', 10);
  const admin = await User.create({
    name:     'Admin',
    email:    'admin@sportconnect.com',
    password: hashed,
    role:     'admin',
  });

  console.log('\n✅ Admin account created successfully!');
  console.log('─────────────────────────────────');
  console.log('Email    : admin@sportconnect.com');
  console.log('Password : admin123');
  console.log('─────────────────────────────────');
  console.log('Login at http://localhost:3000/login');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
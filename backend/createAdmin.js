// Run: node createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── PASTE YOUR ATLAS URI HERE ──
const MONGO_URI = 'mongodb+srv://kadavurumaneesha:Maneesha123@cluster0.5zsysca.mongodb.net/sportconnect?retryWrites=true&w=majority&appName=Cluster0';

const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  role:      { type: String, enum: ['college', 'trainer', 'admin'], required: true },
  suspended: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected!');

  // Remove existing admin
  await User.deleteMany({ role: 'admin' });
  console.log('Old admin removed');

  const hashed = await bcrypt.hash('admin123', 10);
  await User.create({
    name:     'Admin',
    email:    'admin@sportconnect.com',
    password: hashed,
    role:     'admin',
  });

  console.log('\n✅ Admin created successfully!');
  console.log('─────────────────────────────────');
  console.log('Email    : admin@sportconnect.com');
  console.log('Password : admin123');
  console.log('─────────────────────────────────');
  console.log('Login at: https://sportconnect-chi.vercel.app/login');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
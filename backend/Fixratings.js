// Run this ONCE to fix all existing trainer ratings from past reviews
// Command: node fixRatings.js

const mongoose = require('mongoose');
require('dotenv').config();

const Booking = require('./models/Booking');
const Trainer = require('./models/Trainer');

async function fixRatings() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const trainers = await Trainer.find({});
  console.log(`Found ${trainers.length} trainers`);

  for (const trainer of trainers) {
    // Get all completed bookings with reviews for this trainer
    const reviewedBookings = await Booking.find({
      trainerId: trainer._id,
      'review.rating': { $exists: true, $gt: 0 },
    });

    // Get all completed bookings for session count
    const completedBookings = await Booking.find({
      trainerId: trainer._id,
      status: 'completed',
    });

    const totalSessions = completedBookings.length;
    let avgRating = 0;

    if (reviewedBookings.length > 0) {
      const total = reviewedBookings.reduce((sum, b) => sum + (b.review?.rating || 0), 0);
      avgRating = parseFloat((total / reviewedBookings.length).toFixed(1));
    }

    await Trainer.findByIdAndUpdate(trainer._id, {
      rating: avgRating,
      totalSessions: totalSessions,
    });

    console.log(`✓ ${trainer.name} — Rating: ${avgRating} — Sessions: ${totalSessions}`);
  }

  console.log('\n✅ All trainer ratings fixed!');
  process.exit(0);
}

fixRatings().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
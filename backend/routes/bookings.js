const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Slot    = require('../models/Slot');
const Trainer = require('../models/Trainer');
const User    = require('../models/User');
const { createNotification } = require('./notifications');

// Helper — recalculate trainer rating + sessions
async function updateTrainerStats(trainerId) {
  try {
    const completedCount = await Booking.countDocuments({ trainerId, status: 'completed' });
    const reviewed = await Booking.find({ trainerId, 'review.rating': { $exists: true, $gt: 0 } });
    let avgRating = 0;
    if (reviewed.length > 0) {
      const total = reviewed.reduce((s, b) => s + (b.review?.rating || 0), 0);
      avgRating = parseFloat((total / reviewed.length).toFixed(1));
    }
    await Trainer.findByIdAndUpdate(trainerId, { rating: avgRating, totalSessions: completedCount });
  } catch (err) {
    console.error('updateTrainerStats error:', err.message);
  }
}

// GET /api/bookings/mine
router.get('/mine', auth, async (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'college') {
      bookings = await Booking.find({ collegeId: req.user.id })
        .populate('trainerId').populate('slotId').sort({ createdAt: -1 });
    } else {
      const trainer = await Trainer.findOne({ userId: req.user.id });
      if (!trainer) return res.json([]);
      bookings = await Booking.find({ trainerId: trainer._id })
        .populate('collegeId', 'name email').populate('slotId').sort({ createdAt: -1 });
    }
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bookings
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'college') {
      return res.status(403).json({ message: 'Only colleges can book' });
    }
    const { trainerId, slotId, sport, message } = req.body;
    await Slot.findByIdAndUpdate(slotId, { status: 'booked' });
    const booking = await Booking.create({
      collegeId: req.user.id, trainerId, slotId, sport, message,
    });

    // Notify trainer
    const college = await User.findById(req.user.id).select('name');
    const trainer = await Trainer.findById(trainerId).select('userId name');
    if (trainer?.userId) {
      await createNotification(
        trainer.userId,
        '📅 New Booking Request',
        `${college?.name || 'A college'} requested a ${sport} training session.`,
        'booking', '/dashboard'
      );
    }
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const trainer = await Trainer.findById(booking.trainerId).select('name userId');
    const college = await User.findById(booking.collegeId).select('name');

    if (status === 'confirmed') {
      await createNotification(
        booking.collegeId,
        '✅ Booking Confirmed!',
        `${trainer?.name || 'Trainer'} confirmed your ${booking.sport} session.`,
        'status', '/dashboard'
      );
    }

    if (status === 'completed') {
      await updateTrainerStats(booking.trainerId);
      await createNotification(
        booking.collegeId,
        '🏁 Session Completed!',
        `Your ${booking.sport} session with ${trainer?.name} is done. Leave a review!`,
        'review', '/dashboard'
      );
      if (trainer?.userId) {
        await createNotification(
          trainer.userId,
          '🏁 Session Marked Complete',
          `Your ${booking.sport} session with ${college?.name} is marked complete.`,
          'status', '/dashboard'
        );
      }
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/cancel — cancellation with reason
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) {
      return res.status(400).json({ message: 'Cancellation reason is required' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('trainerId').populate('collegeId', 'name email');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Only pending or confirmed bookings can be cancelled
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${booking.status} booking` });
    }

    // Check permission — only the college or trainer involved can cancel
    const trainer = await Trainer.findById(booking.trainerId).select('userId name');
    const isCollege  = req.user.role === 'college' && booking.collegeId._id.toString() === req.user.id;
    const isTrainer  = req.user.role === 'trainer' && trainer?.userId?.toString() === req.user.id;

    if (!isCollege && !isTrainer) {
      return res.status(403).json({ message: 'Not authorised to cancel this booking' });
    }

    const cancelledBy = isCollege ? 'college' : 'trainer';

    // Update booking
    const updated = await Booking.findByIdAndUpdate(
      req.params.id,
      {
        status:           'cancelled',
        cancellationReason: reason.trim(),
        cancelledBy,
        cancelledAt:      new Date(),
      },
      { new: true }
    );

    // Free the slot back to available
    if (booking.slotId) {
      await Slot.findByIdAndUpdate(booking.slotId, { status: 'available' });
    }

    // Notify the other party
    if (cancelledBy === 'college') {
      // Notify trainer
      if (trainer?.userId) {
        await createNotification(
          trainer.userId,
          '❌ Booking Cancelled by College',
          `${booking.collegeId?.name} cancelled the ${booking.sport} booking. Reason: ${reason}`,
          'status', '/dashboard'
        );
      }
    } else {
      // Notify college
      await createNotification(
        booking.collegeId._id,
        '❌ Booking Cancelled by Trainer',
        `${trainer?.name} cancelled your ${booking.sport} session. Reason: ${reason}. The slot is now free.`,
        'status', '/dashboard'
      );
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/review
router.put('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { review: { rating: Number(rating), comment } },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    await updateTrainerStats(booking.trainerId);

    const trainer = await Trainer.findById(booking.trainerId).select('userId');
    const college = await User.findById(booking.collegeId).select('name');
    if (trainer?.userId) {
      await createNotification(
        trainer.userId,
        `⭐ New ${rating}-Star Review!`,
        `${college?.name} rated your ${booking.sport} session ${rating}/5.`,
        'review', '/dashboard'
      );
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/bookings/:id/report
router.put('/:id/report', auth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { performanceReport: req.body.report },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const trainer = await Trainer.findById(booking.trainerId).select('name');
    await createNotification(
      booking.collegeId,
      '📊 Performance Report Available',
      `${trainer?.name} submitted a performance report for your ${booking.sport} session.`,
      'report', '/dashboard'
    );
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
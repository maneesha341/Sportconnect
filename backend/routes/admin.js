const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Booking = require('../models/Booking');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const { createNotification } = require('./notifications');

// Admin middleware — only admin role allowed
const adminOnly = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// ── STATS ──
// GET /api/admin/stats
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers, totalColleges, totalTrainers,
      totalBookings, completedBookings, pendingBookings,
      cancelledBookings, totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'college' }),
      User.countDocuments({ role: 'trainer' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Message.countDocuments(),
    ]);

    // Recent registrations (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

    // Top rated trainers
    const topTrainers = await Trainer.find({ rating: { $gt: 0 } })
      .sort({ rating: -1 }).limit(5);

    // Recent bookings
    const recentBookings = await Booking.find()
      .populate('collegeId', 'name')
      .populate('trainerId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers, totalColleges, totalTrainers,
      totalBookings, completedBookings, pendingBookings,
      cancelledBookings, totalMessages, newUsers,
      topTrainers, recentBookings,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── USERS ──
// GET /api/admin/users
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};
    if (role && role !== 'all') query.role = role;
    if (search) query.name = { $regex: search, $options: 'i' };
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/users/:id/suspend — toggle suspend
router.put('/users/:id/suspend', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.suspended = !user.suspended;
    await user.save();
    await createNotification(
      user._id,
      user.suspended ? '⛔ Account Suspended' : '✅ Account Reinstated',
      user.suspended
        ? 'Your account has been suspended by the admin. Contact support.'
        : 'Your account has been reinstated. Welcome back!',
      'status', '/'
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Trainer.findOneAndDelete({ userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── TRAINERS ──
// GET /api/admin/trainers
router.get('/trainers', auth, adminOnly, async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/trainers/:id/verify — toggle verified badge
router.put('/trainers/:id/verify', auth, adminOnly, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    trainer.verified = !trainer.verified;
    await trainer.save();
    await createNotification(
      trainer.userId,
      trainer.verified ? '✅ Profile Verified!' : '⚠️ Verification Removed',
      trainer.verified
        ? 'Your trainer profile has been verified by admin. A verified badge now shows on your card!'
        : 'Your trainer verification has been removed by admin.',
      'status', '/trainer-profile'
    );
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── BOOKINGS ──
// GET /api/admin/bookings
router.get('/bookings', auth, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    const bookings = await Booking.find(query)
      .populate('collegeId', 'name email')
      .populate('trainerId', 'name sports hourlyRate')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
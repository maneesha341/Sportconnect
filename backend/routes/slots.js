const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Slot = require('../models/Slot');
const Trainer = require('../models/Trainer');

// GET /api/slots/my/all  (must be BEFORE /:trainerId)
router.get('/my/all', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ userId: req.user.id });
    if (!trainer) return res.status(404).json({ message: 'Trainer profile not found' });
    const slots = await Slot.find({ trainerId: trainer._id }).sort({ date: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/slots
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'trainer') {
      return res.status(403).json({ message: 'Only trainers can add slots' });
    }
    const trainer = await Trainer.findOne({ userId: req.user.id });
    const slot = await Slot.create({ ...req.body, trainerId: trainer._id });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/slots/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/slots/:trainerId
router.get('/:trainerId', async (req, res) => {
  try {
    const slots = await Slot.find({ trainerId: req.params.trainerId, status: 'available' }).sort({ date: 1 });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
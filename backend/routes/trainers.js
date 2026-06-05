const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Trainer = require('../models/Trainer');

// GET /api/trainers/my/profile  (must be BEFORE /:id)
router.get('/my/profile', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ userId: req.user.id });
    if (!trainer) return res.status(404).json({ message: 'Profile not found' });
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/trainers/my/profile
router.put('/my/profile', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findOneAndUpdate(
      { userId: req.user.id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trainers
router.get('/', async (req, res) => {
  try {
    const { sport, search } = req.query;
    let query = {};
    if (sport) query.sports = { $in: [sport] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { sports: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    const trainers = await Trainer.find(query);
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/trainers/:id
router.get('/:id', async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.id);
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    res.json(trainer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
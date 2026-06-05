const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const Trainer = require('../models/Trainer');
const User    = require('../models/User');
const { createNotification } = require('./notifications');

function convId(a, b) { return [a, b].sort().join('_'); }

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const msgs = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];

    for (const msg of msgs) {
      const partnerId = msg.senderId.toString() === userId
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (!seen.has(partnerId)) {
        seen.add(partnerId);
        const partner = await User.findById(partnerId).select('name role');
        let trainerProfile = null;
        if (partner?.role === 'trainer') {
          trainerProfile = await Trainer.findOne({ userId: partnerId }).select('photo sports');
        }
        const unreadCount = await Message.countDocuments({
          senderId: partnerId, receiverId: userId, read: false,
        });
        conversations.push({
          partnerId,
          partnerName:  partner?.name || 'Unknown',
          partnerRole:  partner?.role || 'unknown',
          trainerPhoto: trainerProfile?.photo || '',
          trainerSport: trainerProfile?.sports?.[0] || '',
          lastMessage:  msg.text,
          lastTime:     msg.createdAt,
          unread:       unreadCount,
        });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/partner-info/:trainerId
router.get('/partner-info/:trainerId', auth, async (req, res) => {
  try {
    const trainer = await Trainer.findById(req.params.trainerId).select('userId name photo sports');
    if (!trainer) return res.status(404).json({ message: 'Trainer not found' });
    res.json({ userId: trainer.userId, name: trainer.name, photo: trainer.photo, sport: trainer.sports?.[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/partner-info-by-user/:userId
router.get('/partner-info-by-user/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name role');
    if (!user) return res.status(404).json({ message: 'User not found' });
    let photo = '';
    if (user.role === 'trainer') {
      const t = await Trainer.findOne({ userId: req.params.userId }).select('photo');
      photo = t?.photo || '';
    }
    res.json({ name: user.name, role: user.role, photo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/:partnerId
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const cId = convId(req.user.id, req.params.partnerId);
    const messages = await Message.find({ conversationId: cId }).sort({ createdAt: 1 });
    await Message.updateMany(
      { conversationId: cId, receiverId: req.user.id, read: false },
      { read: true }
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages — send a message + notify receiver
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Message cannot be empty' });

    const message = await Message.create({
      conversationId: convId(req.user.id, receiverId),
      senderId:   req.user.id,
      receiverId,
      text: text.trim(),
    });

    // Notify receiver
    const sender = await User.findById(req.user.id).select('name');
    await createNotification(
      receiverId,
      `💬 New Message from ${sender?.name || 'Someone'}`,
      text.length > 60 ? text.slice(0, 60) + '...' : text,
      'message',
      `/messages/${req.user.id}`
    );

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
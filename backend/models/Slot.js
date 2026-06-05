const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  date:      { type: String, required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  status:    { type: String, enum: ['available', 'booked'], default: 'available' },
}, { timestamps: true });

module.exports = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);
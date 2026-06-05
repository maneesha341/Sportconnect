const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  collegeId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  trainerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer', required: true },
  slotId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Slot',    required: true },
  sport:              { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  message:            { type: String },
  review: {
    rating:  { type: Number },
    comment: { type: String },
  },
  performanceReport:  { type: String },
  // Cancellation fields
  cancellationReason: { type: String },
  cancelledBy:        { type: String, enum: ['college', 'trainer'] },
  cancelledAt:        { type: Date },
}, { timestamps: true });

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
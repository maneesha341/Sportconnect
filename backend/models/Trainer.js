const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:            { type: String, required: true },
  sports:          [{ type: String }],
  experience:      { type: Number, default: 0 },
  bio:             { type: String },
  location:        { type: String },
  trainerState:    { type: String },
  availability:    { type: String, enum: ['available', 'busy'], default: 'available' },
  certifications:  [{ type: String }],
  hourlyRate:      { type: Number, default: 0 },
  rating:          { type: Number, default: 0 },
  totalSessions:   { type: Number, default: 0 },
  photo:           { type: String, default: '' },
  verified:        { type: Boolean, default: false },
  // Approval system
  approvalStatus:  { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  approvedAt:      { type: Date },
  // Proof documents
  proofDocument:   { type: String, default: '' }, // base64 image of certificate/ID
  proofType:       { type: String, default: '' }, // e.g. "SAI Certificate", "Aadhar Card"
  governmentId:    { type: String, default: '' }, // base64 of govt ID
}, { timestamps: true });

module.exports = mongoose.models.Trainer || mongoose.model('Trainer', TrainerSchema);
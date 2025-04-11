// models/Payment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ticketIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  amount: Number,
  vnp_TxnRef: String,
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);

// models/Ticket.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ticketSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  flightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true,
  },
  seatNumber: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  bookingTime: {
    type: Date,
    default: Date.now,
  },
  price: {
    type: Number,
    required: true,
  },
  // Thêm trường trạng thái thanh toán
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded', 'cancelled'],
    default: 'unpaid',
  },
  // Tham chiếu đến thanh toán
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
});

module.exports = mongoose.model('Ticket', ticketSchema);

// controllers/ticketController.js
const Ticket = require('../models/Ticket');
const Flight = require('../models/Flight');
const Payment = require('../models/Payment');
const config = require('../config/vnpay');
const crypto = require('crypto');
const moment = require('moment');
const uuid = require('uuid');


// controllers/ticketController.js
exports.bookAndPayTicket = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const { flightId, tickets, discountedPrice } = req.body; // Add discountedPrice

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp thông tin vé.' });
    }

    const flight = await Flight.findById(flightId);
    if (!flight) return res.status(404).json({ message: 'Chuyến bay không tồn tại.' });

    if (flight.seatsAvailable < tickets.length) {
      return res.status(400).json({ message: 'Không đủ ghế trống.' });
    }

    for (const t of tickets) {
      const exists = await Ticket.findOne({ flightId, seatNumber: t.seatNumber });
      if (exists) return res.status(400).json({ message: `Ghế ${t.seatNumber} đã được đặt.` });
    }

    const ticketDocs = tickets.map(t => ({
      userId,
      flightId,
      seatNumber: t.seatNumber,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      bookingTime: Date.now(),
      price: flight.price,
      paymentStatus: 'pending'
    }));

    const savedTickets = await Ticket.insertMany(ticketDocs);
    const ticketIds = savedTickets.map(t => t._id);
   
    const totalPrice = discountedPrice; // Sử dụng giá đã giảm từ frontend
    const vnp_TxnRef = uuid.v4().replace(/-/g, '').substring(0, 8);
    const payment = await Payment.create({
      userId,
      ticketIds,
      amount: totalPrice,
      vnp_TxnRef,
      status: 'pending'
    });

    await Ticket.updateMany({ _id: { $in: ticketIds } }, { paymentId: payment._id });

    await Flight.findByIdAndUpdate(
      flightId,
      { $inc: { seatsAvailable: -tickets.length } },
      { new: true }
    );

    const vnp_Params = {
      vnp_Version: config.vnp_Version,
      vnp_Command: config.vnp_Command,
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_Amount: (totalPrice * 100).toString(),
      vnp_CurrCode: 'VND',
      vnp_BankCode: 'NCB',
      vnp_TxnRef: vnp_TxnRef,
      vnp_OrderInfo: `Thanh toán vé ${vnp_TxnRef}`,
      vnp_OrderType: config.orderType,
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.vnp_ReturnUrl,
      vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
      vnp_ExpireDate: moment().add(15, 'minutes').format('YYYYMMDDHHmmss'),
    };

    const signData = new URLSearchParams(sortObject(vnp_Params)).toString();
    const hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params.vnp_SecureHash = vnp_SecureHash;

    const paymentUrl = `${config.vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;

    return res.status(201).json({
      message: 'Đặt vé thành công! Chuyển đến thanh toán.',
      paymentUrl,
      paymentId: payment._id,
      totalPrice,
      ticketIds
    });
  } catch (err) {
    console.error('Lỗi bookAndPayTicket:', err);
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('userId', 'username email')
      .populate('flightId', 'code from to airline')
      .populate('paymentId', 'status amount');

    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    console.error('Lỗi getAllTickets:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách vé', error: err.message });
  }
};


exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;

    const tickets = await Ticket.find({ userId })
      .populate('flightId', 'code from to airline')
      .populate('paymentId', 'status amount');

    res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    console.error('Lỗi getUserTickets:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy vé của người dùng', error: err.message });
  }
};


function sortObject(obj) {
  return Object.keys(obj).sort().reduce((result, key) => {
    result[key] = obj[key];
    return result;
  }, {});
}
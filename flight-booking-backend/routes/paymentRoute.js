const express = require('express');
const crypto = require('crypto');
const moment = require('moment');
const uuid = require('uuid');
const Payment = require('../models/Payment');
const { verifyToken } = require('../middleware/authMiddleware');
const config = require('../config/vnpay');
const router = express.Router();

router.get('/create_payment', verifyToken, async (req, res) => {
  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const amount = 300000 * 100; // tiền * 100
  const vnp_TxnRef = uuid.v4().replace(/-/g, '').substring(0, 8);

  const tmnCode = config.vnp_TmnCode;
  const secretKey = config.vnp_HashSecret;

  const createDate = moment().format('YYYYMMDDHHmmss');
  const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

  let vnp_Params = {
    vnp_Version: config.vnp_Version,
    vnp_Command: config.vnp_Command,
    vnp_TmnCode: tmnCode,
    vnp_Amount: amount.toString(),
    vnp_CurrCode: 'VND',
    vnp_BankCode: 'NCB',
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: `Thanh toan don hang ${vnp_TxnRef}`,
    vnp_OrderType: config.orderType,
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  vnp_Params = sortObject(vnp_Params);

  const signData = new URLSearchParams(vnp_Params).toString();
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;

  const paymentUrl = `${config.vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;

  // Lưu vào DB
  await Payment.create({
    userId: req.user._id,
    amount: amount / 100,
    vnp_TxnRef
  });

  res.json({
    status: 'Ok',
    message: 'Successfully created payment',
    paymentUrl
  });
});

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// routes/paymentRoute.js
router.get('/vnpay_return', async (req, res) => {
    try {
      const query = req.query;
      const vnp_SecureHash = query.vnp_SecureHash;
  
      // Remove hash before signing
      delete query.vnp_SecureHash;
      delete query.vnp_SecureHashType;
  
      // Tạo dữ liệu hash lại để kiểm tra
      const sortedQuery = sortObject(query);
      const signData = new URLSearchParams(sortedQuery).toString();
      const hmac = crypto.createHmac('sha512', config.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  
      // So sánh chữ ký
      if (vnp_SecureHash !== signed) {
        return res.status(400).json({ message: 'Chữ ký không hợp lệ!' });
      }
  
      // Xác minh thanh toán thành công từ VNPAY
      const { vnp_TxnRef, vnp_ResponseCode } = query;
      const payment = await Payment.findOne({ vnp_TxnRef });
  
      if (!payment) {
        return res.status(404).json({ message: 'Không tìm thấy đơn thanh toán' });
      }
  
      if (vnp_ResponseCode === '00') {
        // Thành công → cập nhật
        payment.status = 'paid';
        await payment.save();
  
        // Cập nhật ticket
        await require('../models/Ticket').updateMany(
          { _id: { $in: payment.ticketIds } },
          { paymentStatus: 'paid' }
        );
  
        // Redirect đến trang thành công (bạn tùy chỉnh frontend tại route này)
        return res.redirect(`http://localhost:4200/checkout-success?status=success&paymentId=${payment._id}`);
      } else {
        payment.status = 'failed';
        await payment.save();
  
        await require('../models/Ticket').updateMany(
          { _id: { $in: payment.ticketIds } },
          { paymentStatus: 'cancelled' }
        );
  
        return res.redirect(`http://localhost:4200/checkout-failed?status=failed&paymentId=${payment._id}`);
      }
    } catch (err) {
      console.error('Lỗi vnpay_return:', err);
      return res.status(500).json({ message: 'Lỗi hệ thống', error: err.message });
    }
  });
  
  function sortObject(obj) {
    return Object.keys(obj).sort().reduce((result, key) => {
      result[key] = obj[key];
      return result;
    }, {});
  }
module.exports = router;

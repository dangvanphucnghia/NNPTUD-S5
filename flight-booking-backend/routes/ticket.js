const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');
const authAdmin = require('../middleware/authAdmin');


router.get('/user', verifyToken, ticketController.getUserTickets);
router.post('/book_and_pay', verifyToken, ticketController.bookAndPayTicket);
router.get('/admin', verifyToken, authAdmin, ticketController.getAllTickets);
module.exports = router;


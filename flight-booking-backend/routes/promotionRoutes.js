const express = require('express');
const router = express.Router();
const {
    createPromotion,
    getAllPromotions,
    getPromotion,
    updatePromotion,
    deletePromotion,
    validatePromotionCode
} = require('../controllers/promotionController');
const authAdmin = require('../middleware/authAdmin');

// Public routes
router.get('/', getAllPromotions);
router.get('/:id', getPromotion);
router.post('/validate', validatePromotionCode);

// Admin only routes
router.post('/', authAdmin, createPromotion);
router.put('/:id',authAdmin, updatePromotion);
router.delete('/:id',authAdmin, deletePromotion);

module.exports = router; 
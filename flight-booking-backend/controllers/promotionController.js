const Promotion = require('../models/Promotion');
const User = require('../models/User');
const Notification = require('../models/notification');

// Create new promotion
exports.createPromotion = async (req, res) => {
    try {
        const promotion = new Promotion(req.body);
        await promotion.save();

        // Gửi thông báo
        let usersToNotify = [];

        if (req.body.userIds && req.body.userIds.length > 0) {
            // Thông báo đến user cụ thể
            usersToNotify = req.body.userIds;
        } else {
            // Thông báo đến tất cả user
            const users = await User.find({}, '_id');
            usersToNotify = users.map(user => user._id);
        }

        const notifications = usersToNotify.map(userId => ({
            userId,
            title: '🎁 Khuyến mãi mới!',
            message: `Mã khuyến mãi ${promotion.code}: ${promotion.description}`,
            type: 'promo'
        }));

        await Notification.insertMany(notifications);

        res.status(201).json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get all promotions
exports.getAllPromotions = async (req, res) => {
    try {
        const promotions = await Promotion.find()
            .populate('applicableFlights')
            .populate('applicableAirlines');
        res.status(200).json({
            success: true,
            count: promotions.length,
            data: promotions
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Get single promotion
exports.getPromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findById(req.params.id)
            .populate('applicableFlights')
            .populate('applicableAirlines');
        
        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.status(200).json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Update promotion
exports.updatePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.status(200).json({
            success: true,
            data: promotion
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Delete promotion
exports.deletePromotion = async (req, res) => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Promotion not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

// Validate promotion code
exports.validatePromotionCode = async (req, res) => {
    try {
        const { code, amount } = req.body;
        const promotion = await Promotion.findOne({ code, isActive: true });

        if (!promotion) {
            return res.status(404).json({
                success: false,
                error: 'Invalid promotion code'
            });
        }

        // Check if promotion is expired
        const now = new Date();
        if (now < promotion.startDate || now > promotion.endDate) {
            return res.status(400).json({
                success: false,
                error: 'Promotion is not valid at this time'
            });
        }

        // Check usage limit
        if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
            return res.status(400).json({
                success: false,
                error: 'Promotion usage limit has been reached'
            });
        }

        // Check minimum purchase amount
        if (amount < promotion.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                error: `Minimum purchase amount of ${promotion.minPurchaseAmount} is required`
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (promotion.discountType === 'PERCENTAGE') {
            discountAmount = (amount * promotion.discountValue) / 100;
            if (promotion.maxDiscountAmount) {
                discountAmount = Math.min(discountAmount, promotion.maxDiscountAmount);
            }
        } else {
            discountAmount = promotion.discountValue;
        }

        res.status(200).json({
            success: true,
            data: {
                promotion,
                discountAmount,
                finalAmount: amount - discountAmount
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

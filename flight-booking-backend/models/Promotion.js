const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usedCount: {
        type: Number,
        default: 0
    },
    applicableFlights: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight'
    }],
    applicableAirlines: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline'
    }]
}, {
    timestamps: true
});

// Middleware để kiểm tra ngày hết hạn
promotionSchema.pre('save', function(next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion; 
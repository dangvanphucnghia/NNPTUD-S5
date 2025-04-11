const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tên hãng bay là bắt buộc'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Mã hãng bay là bắt buộc'],
        unique: true,
        trim: true,
        uppercase: true
    },
    logo: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Airline', airlineSchema); 
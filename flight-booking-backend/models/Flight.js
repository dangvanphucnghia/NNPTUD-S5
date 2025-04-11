const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema({
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    flightNumber: {
        type: String,
        required: true,
        unique: true
    },
    departure: {
        city: {
            type: String,
            required: true
        },
        airport: {
            type: String,
            required: true
        },
        time: {
            type: Date,
            required: true
        }
    },
    arrival: {
        city: {
            type: String,
            required: true
        },
        airport: {
            type: String,
            required: true
        },
        time: {
            type: Date,
            required: true
        }
    },
    aircraft: {
        type: String,
        required: true
    },
    seatsAvailable: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['scheduled', 'delayed', 'cancelled', 'completed'],
        default: 'scheduled'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexes for better query performance
flightSchema.index({ 'departure.time': 1 });
flightSchema.index({ 'departure.city': 1, 'arrival.city': 1 });
flightSchema.index({ airline: 1, flightNumber: 1 }, { unique: true });

// Pre-save middleware to ensure arrival time is after departure time
flightSchema.pre('save', function(next) {
    if (this.arrival.time <= this.departure.time) {
        next(new Error('Arrival time must be after departure time'));
    }
    next();
});

// Method to update available seats
flightSchema.methods.updateAvailableSeats = async function(bookedSeats) {
    if (this.seatsAvailable < bookedSeats) {
        throw new Error('Not enough seats available');
    }
    this.seatsAvailable -= bookedSeats;
    return this.save();
};

const Flight = mongoose.model("Flight", flightSchema);

module.exports = Flight;

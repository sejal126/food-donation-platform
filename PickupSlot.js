const mongoose = require('mongoose');

const pickupSlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // Format: "HH:MM" in 24-hour
        required: true
    },
    endTime: {
        type: String, // Format: "HH:MM" in 24-hour
        required: true
    },
    ngoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NGO',
        required: true
    },
    maxBookings: {
        type: Number,
        default: 1
    },
    bookings: {
        type: Number,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    }
});

// Index for efficient queries
pickupSlotSchema.index({ date: 1, ngoId: 1, available: 1 });

module.exports = mongoose.model('PickupSlot', pickupSlotSchema); 
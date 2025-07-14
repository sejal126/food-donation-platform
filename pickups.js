const express = require('express');
const router = express.Router();
const PickupSlot = require('../models/PickupSlot');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const { protect } = require('../middleware/authMiddleware');

// GET /api/pickups/slots - Get available pickup slots
router.get('/slots', async (req, res) => {
    try {
        const { ngoId, date } = req.query;
        
        if (!ngoId) {
            return res.status(400).json({ message: 'NGO ID is required' });
        }
        
        // Validate NGO
        const ngo = await NGO.findById(ngoId);
        if (!ngo || !ngo.verified) {
            return res.status(404).json({ message: 'NGO not found or not verified' });
        }
        
        // Build date range query
        let dateQuery = {};
        if (date) {
            // If specific date provided, get slots for that day
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            dateQuery = {
                date: {
                    $gte: selectedDate,
                    $lt: nextDay
                }
            };
        } else {
            // If no date, get slots for next 7 days
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
            
            dateQuery = {
                date: {
                    $gte: startDate,
                    $lt: endDate
                }
            };
        }
        
        // Find available slots
        const slots = await PickupSlot.find({
            ...dateQuery,
            ngoId,
            available: true,
            bookings: { $lt: '$maxBookings' }
        }).sort({ date: 1, startTime: 1 });
        
        res.json(slots);
    } catch (err) {
        console.error('Error fetching pickup slots:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/pickups/book - Book a pickup slot
router.post('/book', protect, async (req, res) => {
    try {
        const { slotId, donationId } = req.body;
        
        if (!slotId || !donationId) {
            return res.status(400).json({ message: 'Slot ID and Donation ID are required' });
        }
        
        // Check if slot exists and is available
        const slot = await PickupSlot.findById(slotId);
        if (!slot || !slot.available || slot.bookings >= slot.maxBookings) {
            return res.status(400).json({ message: 'Slot is not available' });
        }
        
        // Check if donation exists and belongs to this user
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }
        
        if (donation.donorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to book for this donation' });
        }
        
        // Check if donation is in pending state
        if (donation.status !== 'pending') {
            return res.status(400).json({ message: 'Only pending donations can be scheduled' });
        }
        
        // Check if the donation is for the same NGO
        if (donation.ngoId.toString() !== slot.ngoId.toString()) {
            return res.status(400).json({ message: 'Slot belongs to a different NGO' });
        }
        
        // Update donation with pickup details
        donation.pickupDate = new Date(slot.date);
        donation.pickupSlot = {
            slotId: slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime
        };
        
        await donation.save();
        
        // Update slot booking count
        slot.bookings += 1;
        if (slot.bookings >= slot.maxBookings) {
            slot.available = false;
        }
        
        await slot.save();
        
        res.json({
            message: 'Pickup scheduled successfully',
            donation,
            slot
        });
    } catch (err) {
        console.error('Error booking pickup slot:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/pickups/slots - Create pickup slots (NGO only)
router.post('/slots', protect, async (req, res) => {
    try {
        const { date, slots } = req.body;
        
        if (!date || !slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ message: 'Valid date and slots array are required' });
        }
        
        // Check if user is associated with an NGO
        const ngo = await NGO.findOne({ userId: req.user._id });
        if (!ngo) {
            return res.status(403).json({ message: 'Only NGOs can create pickup slots' });
        }
        
        // Create slots
        const slotDate = new Date(date);
        const createdSlots = [];
        
        for (const slotData of slots) {
            const newSlot = new PickupSlot({
                date: slotDate,
                startTime: slotData.startTime,
                endTime: slotData.endTime,
                ngoId: ngo._id,
                maxBookings: slotData.maxBookings || 1
            });
            
            await newSlot.save();
            createdSlots.push(newSlot);
        }
        
        res.status(201).json({
            message: 'Pickup slots created successfully',
            slots: createdSlots
        });
    } catch (err) {
        console.error('Error creating pickup slots:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
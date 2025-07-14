const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');
//const User = require('../models/user'); // Needed to potentially update user role or check it
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Import authentication middleware

// --- Public Routes ---

// GET /api/ngos - Get a list of all *verified* NGOs
router.get('/', async (req, res) => {
    try {
        // Find only NGOs marked as verified
        const ngos = await NGO.find({ verified: true }).populate('userId', 'name email'); // Optionally populate user details
        res.json(ngos);
    } catch (err) {
        console.error("Error fetching NGOs:", err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/ngos/:id - Get details of a specific NGO (verified or not, accessible publicly)
router.get('/:id', async (req, res) => {
    try {
        const ngo = await NGO.findById(req.params.id).populate('userId', 'name email'); // Optionally populate user details

        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }
        res.json(ngo);
    } catch (err) {
        console.error("Error fetching NGO:", err.message);
        // Handle potential CastError if ID format is invalid
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid NGO ID format' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});


// --- Protected Routes ---

// POST /api/ngos/register - Register a new NGO profile
// User must be logged in to register an NGO profile
router.post('/register', protect, async (req, res) => {
    try {
        const { name, description, contactEmail, phone, address, website } = req.body;
        const userId = req.user._id; // Get user ID from the authenticated request (set by 'protect' middleware)

        // Optional: Check if this user already has an NGO registered
        const existingNGO = await NGO.findOne({ userId: userId });
        if (existingNGO) {
            return res.status(400).json({ message: 'User already has an NGO profile registered' });
        }

        // Optional: Check if user role is 'donor', consider updating to 'ngo' or require specific role?
        // For now, we allow any logged-in user to register an NGO profile.
        // You might want to add logic here or during user signup to set the role.
        /*
        if (req.user.role !== 'ngo') {
             // Option 1: Update user role
             // await User.findByIdAndUpdate(userId, { role: 'ngo' });
             // Option 2: Reject if not 'ngo' role
             // return res.status(403).json({ message: 'Only users with NGO role can register an NGO profile.' });
        }
        */

        const newNGO = new NGO({
            name,
            description,
            contactEmail,
            phone,
            address,
            website,
            userId: userId, // Link the NGO profile to the logged-in user
            verified: false // NGOs start as unverified by default
        });

        const savedNGO = await newNGO.save();
        res.status(201).json(savedNGO);

    } catch (err) {
        console.error("Error registering NGO:", err.message);
        // Handle validation errors (e.g., missing required fields)
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/ngos/:id - Update an NGO profile
// Only the associated user (or potentially an admin) should be able to update
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, description, contactEmail, phone, address, website } = req.body;
        const ngoId = req.params.id;
        const userId = req.user._id; // Logged-in user

        const ngo = await NGO.findById(ngoId);

        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }

        // Check if the logged-in user is the one associated with this NGO profile
        // Note: Comparing ObjectId requires .equals() method or converting to string
        if (!ngo.userId.equals(userId)) {
             // Add admin check later if needed: && req.user.role !== 'admin'
            return res.status(403).json({ message: 'User not authorized to update this NGO profile' });
        }

        // Update fields
        ngo.name = name || ngo.name;
        ngo.description = description || ngo.description;
        ngo.contactEmail = contactEmail || ngo.contactEmail;
        ngo.phone = phone || ngo.phone;
        ngo.address = address || ngo.address;
        ngo.website = website || ngo.website;
        // Add other fields as needed, but 'verified' status should likely be controlled by an admin route

        const updatedNGO = await ngo.save();
        res.json(updatedNGO);

    } catch (err) {
        console.error("Error updating NGO:", err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid NGO ID format' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});


// Future routes to consider:
// DELETE /api/ngos/:id - Delete an NGO (protected, restricted to owner/admin)
// PATCH /api/ngos/:id/verify - Verify an NGO (protected, restricted to admin)

module.exports = router; 
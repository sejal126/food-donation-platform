const express = require('express');
const router = express.Router();
//const User = require('../models/user');
const NGO = require('../models/NGO');
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// All routes in this file are protected and restricted to admin role
router.use(protect);
router.use(restrictTo('admin'));

// GET /api/admin/users - Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const users = await User.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        const totalUsers = await User.countDocuments();
        
        res.json({
            users,
            pagination: {
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit),
                current: page,
                perPage: limit
            }
        });
    } catch (err) {
        console.error('Admin error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/ngos - Get all NGOs with pagination
router.get('/ngos', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const ngos = await NGO.find()
            .populate('userId', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ verified: 1, createdAt: -1 }); // Unverified first, then newest
            
        const totalNgos = await NGO.countDocuments();
        
        res.json({
            ngos,
            pagination: {
                total: totalNgos,
                pages: Math.ceil(totalNgos / limit),
                current: page,
                perPage: limit
            }
        });
    } catch (err) {
        console.error('Admin error fetching NGOs:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/admin/ngos/:id/verify - Verify an NGO
router.patch('/ngos/:id/verify', async (req, res) => {
    try {
        const ngo = await NGO.findById(req.params.id);
        
        if (!ngo) {
            return res.status(404).json({ message: 'NGO not found' });
        }
        
        ngo.verified = true;
        await ngo.save();
        
        // Update the user role to 'ngo' if not already
        await User.findByIdAndUpdate(ngo.userId, { role: 'ngo' });
        
        res.json({
            message: 'NGO verified successfully',
            ngo
        });
    } catch (err) {
        console.error('Admin error verifying NGO:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/donations - Get all donations with filters and pagination
router.get('/donations', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.ngo) {
            filter.ngoId = req.query.ngo;
        }
        
        if (req.query.donor) {
            filter.donorId = req.query.donor;
        }
        
        const donations = await Donation.find(filter)
            .populate('donorId', 'name email')
            .populate('ngoId', 'name')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
            
        const totalDonations = await Donation.countDocuments(filter);
        
        res.json({
            donations,
            pagination: {
                total: totalDonations,
                pages: Math.ceil(totalDonations / limit),
                current: page,
                perPage: limit
            }
        });
    } catch (err) {
        console.error('Admin error fetching donations:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/admin/users/:id/role - Change user role
router.post('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['donor', 'ngo', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.role = role;
        await user.save();
        
        res.json({
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Admin error changing user role:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
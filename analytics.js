const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
//const User = require('../models/user');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// GET /api/analytics/overview - Get platform overview statistics
router.get('/overview', async (req, res) => {
    try {
        // Get total counts
        const donationCount = await Donation.countDocuments();
        const ngoCount = await NGO.countDocuments({ verified: true });
        const userCount = await User.countDocuments({ role: 'donor' });
        
        // Calculate food weight
        const donations = await Donation.find({ status: { $in: ['accepted', 'completed'] } });
        let totalKg = 0;
        donations.forEach(donation => {
            donation.items.forEach(item => {
                if (item.unit === 'kg') {
                    totalKg += item.quantity;
                } else if (item.unit === 'packets' || item.unit === 'units') {
                    // Convert to approximate kg (you can adjust the conversion rates)
                    totalKg += item.quantity * 0.5;
                }
            });
        });
        
        res.json({
            donationCount,
            ngoCount,
            userCount,
            totalKg: Math.round(totalKg),
            donationsCompleted: await Donation.countDocuments({ status: 'completed' }),
            donationsPending: await Donation.countDocuments({ status: 'pending' })
        });
    } catch (err) {
        console.error('Analytics error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/user/:userId - Get user-specific statistics (for achievements)
router.get('/user/:userId', protect, async (req, res) => {
    try {
        // Ensure the user is requesting their own stats or is an admin
        if (req.params.userId !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this data' });
        }
        
        const userId = req.params.userId;
        
        // Get user's donation count
        const donationCount = await Donation.countDocuments({ 
            donorId: userId, 
            status: { $in: ['accepted', 'completed'] }
        });
        
        // Get unique NGOs the user has donated to
        const uniqueNgos = await Donation.distinct('ngoId', { 
            donorId: userId,
            status: { $in: ['accepted', 'completed'] }
        });
        
        // Calculate achievements
        const achievements = [
            {
                id: 'first_donation',
                title: 'First Donation',
                description: 'Made your first donation',
                achieved: donationCount >= 1,
                progress: Math.min(donationCount, 1),
                target: 1
            },
            {
                id: 'five_donations',
                title: '5 Donations',
                description: 'Made 5 donations',
                achieved: donationCount >= 5,
                progress: Math.min(donationCount, 5),
                target: 5
            },
            {
                id: 'ten_donations',
                title: '10 Donations',
                description: 'Made 10 donations',
                achieved: donationCount >= 10,
                progress: Math.min(donationCount, 10),
                target: 10
            },
            {
                id: 'supported_5_ngos',
                title: 'Supported 5 NGOs',
                description: 'Donated to 5 different NGOs',
                achieved: uniqueNgos.length >= 5,
                progress: Math.min(uniqueNgos.length, 5),
                target: 5
            }
        ];
        
        res.json({
            donationCount,
            uniqueNgoCount: uniqueNgos.length,
            achievements
        });
    } catch (err) {
        console.error('User analytics error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/analytics/donations/monthly - Get monthly donation statistics
router.get('/donations/monthly', protect, restrictTo('admin'), async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        
        const monthlyStats = await Donation.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        // Format the result as an array for all 12 months
        const formattedStats = Array(12).fill(0);
        monthlyStats.forEach(stat => {
            formattedStats[stat._id - 1] = stat.count;
        });
        
        res.json(formattedStats);
    } catch (err) {
        console.error('Monthly analytics error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
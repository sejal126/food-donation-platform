const express = require('express');
const router = express.Router();
const NGO = require('../models/NGO');
const Campaign = require('../models/Campaign');

// GET /api/search - Search across NGOs and campaigns
router.get('/', async (req, res) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        
        // Search NGOs
        const ngos = await NGO.find({
            $and: [
                { verified: true }, // Only verified NGOs
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).limit(5);
        
        // Search campaigns
        const campaigns = await Campaign.find({
            $and: [
                { status: 'active' }, // Only active campaigns
                {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).populate('ngoId', 'name').limit(5);
        
        res.json({
            query,
            results: {
                ngos,
                campaigns
            }
        });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
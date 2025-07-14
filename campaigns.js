const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const NGO = require('../models/NGO');
const Donation = require('../models/Donation');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// GET /api/campaigns - Get all active campaigns
router.get('/', async (req, res) => {
    try {
        // Filter options
        const filter = { status: 'active' };
        
        // Allow filtering by NGO
        if (req.query.ngo) {
            filter.ngoId = req.query.ngo;
        }
        
        // Allow filtering by priority
        if (req.query.priority) {
            filter.priority = req.query.priority;
        }
        
        const campaigns = await Campaign.find(filter)
            .populate('ngoId', 'name description contactEmail')
            .sort({ priority: -1, endDate: 1 });
        
        res.json(campaigns);
    } catch (err) {
        console.error('Error fetching campaigns:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/campaigns/:id - Get a specific campaign
router.get('/:id', async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('ngoId', 'name description contactEmail address website');
        
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        
        res.json(campaign);
    } catch (err) {
        console.error('Error fetching campaign:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/campaigns - Create a new campaign (NGOs only)
router.post('/', protect, async (req, res) => {
    try {
        const {
            title,
            description,
            target,
            startDate,
            endDate,
            priority,
            image
        } = req.body;
        
        // Check if user is associated with an NGO
        const ngo = await NGO.findOne({ userId: req.user._id });
        
        if (!ngo) {
            return res.status(403).json({ message: 'Only NGOs can create campaigns' });
        }
        
        // Verify the NGO is verified
        if (!ngo.verified) {
            return res.status(403).json({ message: 'Your NGO must be verified to create campaigns' });
        }
        
        const campaign = new Campaign({
            title,
            description,
            ngoId: ngo._id,
            target,
            startDate,
            endDate,
            priority: priority || 'medium',
            image,
            status: 'active'
        });
        
        await campaign.save();
        
        res.status(201).json(campaign);
    } catch (err) {
        console.error('Error creating campaign:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/campaigns/:id/contribute - Contribute to a campaign
router.post('/:id/contribute', protect, async (req, res) => {
    try {
        const { items, pickupAddress, pickupDate } = req.body;
        const campaignId = req.params.id;
        
        // Find the campaign
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }
        
        // Check if campaign is active
        if (campaign.status !== 'active') {
            return res.status(400).json({ message: 'This campaign is no longer active' });
        }
        
        // Create donation tied to the campaign
        const donation = new Donation({
            donorId: req.user._id,
            ngoId: campaign.ngoId,
            campaignId: campaign._id, // Link to campaign
            items,
            pickupAddress,
            pickupDate,
            status: 'pending'
        });
        
        await donation.save();
        
        // Update campaign stats (will be properly updated when donation is accepted)
        // This is just to show the pending contribution
        campaign.donorCount++;
        await campaign.save();
        
        res.status(201).json({
            message: 'Contribution submitted successfully',
            donation
        });
    } catch (err) {
        console.error('Error contributing to campaign:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
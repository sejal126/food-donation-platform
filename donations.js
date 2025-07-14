const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const NGO = require('../models/NGO'); // Needed to validate NGO ID
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Import auth middleware

// --- Donor Routes (Protected) ---

// POST /api/donations - Create a new donation request
router.post('/', protect, async (req, res) => {
    try {
        const { ngoId, items, pickupAddress, pickupDate } = req.body;
        const donorId = req.user._id; // Get donor ID from authenticated user

        // Validate NGO ID
        if (!ngoId) {
             return res.status(400).json({ message: 'NGO ID is required' });
        }
        const ngoExists = await NGO.findById(ngoId);
        if (!ngoExists) {
            return res.status(404).json({ message: 'NGO not found' });
        }
         // Optional: Ensure NGO is verified before allowing donations
        if (!ngoExists.verified) {
             return res.status(400).json({ message: 'Donations can only be made to verified NGOs' });
        }

        // Validate items array
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Donation items list cannot be empty' });
        }
        // Add more item validation if needed (e.g., check for name, quantity, unit)

        const newDonation = new Donation({
            donorId,
            ngoId,
            items,
            pickupAddress,
            pickupDate,
            status: 'pending' // Initial status
        });

        const savedDonation = await newDonation.save();
        res.status(201).json(savedDonation);

    } catch (err) {
        console.error("Error creating donation:", err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
         if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid NGO ID format' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/donations/my-donations - Get donation history for the logged-in donor
router.get('/my-donations', protect, async (req, res) => {
    try {
        const donorId = req.user._id;
        const donations = await Donation.find({ donorId: donorId })
                                      .populate('ngoId', 'name') // Populate NGO name
                                      .sort({ createdAt: -1 }); // Sort by newest first
        res.json(donations);
    } catch (err) {
        console.error("Error fetching donor's donations:", err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- NGO Routes (Protected & Restricted) ---

// GET /api/donations/ngo - Get donations received by the logged-in NGO
// User must be logged in AND have the 'ngo' role (or be linked to an NGO profile)
router.get('/ngo', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // Find the NGO profile associated with the logged-in user
        const ngoProfile = await NGO.findOne({ userId: userId });

        if (!ngoProfile) {
            return res.status(404).json({ message: 'No NGO profile found for this user. Cannot retrieve donations.' });
        }

        const ngoId = ngoProfile._id; // Get the ID of the NGO profile

        const donations = await Donation.find({ ngoId: ngoId })
                                      .populate('donorId', 'name email') // Populate donor details
                                      .sort({ createdAt: -1 });
        res.json(donations);

    } catch (err) {
        console.error("Error fetching NGO's donations:", err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


// PATCH /api/donations/:id/status - Update the status of a donation (e.g., accept, complete)
// Restricted to the receiving NGO (or potentially an admin)
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;
        const donationId = req.params.id;
        const userId = req.user._id;

         // Validate status
        const allowedStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        // Find the donation
        const donation = await Donation.findById(donationId);
        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        // Find the NGO profile associated with the logged-in user
        const ngoProfile = await NGO.findOne({ userId: userId });
         if (!ngoProfile) {
             return res.status(403).json({ message: 'User does not have an associated NGO profile' });
         }

        // Check if the logged-in user's NGO is the recipient of this donation
        if (!donation.ngoId.equals(ngoProfile._id)) {
            return res.status(403).json({ message: 'User not authorized to update status for this donation' });
        }

        // Update the status
        donation.status = status;
        const updatedDonation = await donation.save();
        res.json(updatedDonation);

    } catch (err) {
        console.error("Error updating donation status:", err.message);
         if (err.name === 'ValidationError') {
            return res.status(400).json({ message: err.message });
        }
         if (err.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid Donation ID format' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});


// Future routes to consider:
// GET /api/donations/:id - Get details of a specific donation (protected, restricted to donor/ngo/admin)
// DELETE /api/donations/:id - Cancel/delete a donation (protected, restricted based on status and role)


module.exports = router;
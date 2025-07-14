const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['donation_update', 'thank_you', 'reminder', 'system', 'achievement'],
        default: 'system'
    },
    relatedTo: {
        model: {
            type: String,
            enum: ['Donation', 'NGO', 'User', null],
            default: null
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema); 
<div class="campaign-showcase">
    <h2 class="section-title">Current Donation Campaigns</h2>
    
    <div class="campaign-cards">
        <div class="campaign-card">
            <div class="campaign-header">
                <h3 class="campaign-title">Rice for Rural Schools</h3>
                <span class="campaign-tag">Critical Need</span>
            </div>
            
            <p class="campaign-description">Help us reach our goal of 1000kg of rice for underprivileged schools across rural India.</p>
            
            <div class="campaign-progress">
                <div class="progress-stats">
                    <span class="progress-current">650kg</span>
                    <span class="progress-percentage">65%</span>
                    <span class="progress-target">1000kg</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 65%"></div>
                </div>
            </div>
            
            <div class="campaign-meta">
                <span class="donors-count">42 donors</span>
                <span class="time-left">15 days left</span>
            </div>
            
            <button class="contribute-button">
                <span class="btn-text">Contribute Now</span>
                <span class="btn-icon">+</span>
            </button>
        </div>
        
        <div class="campaign-card">
            <div class="campaign-header">
                <h3 class="campaign-title">Emergency Food Kits</h3>
                <span class="campaign-tag">Urgent</span>
            </div>
            
            <p class="campaign-description">Help families affected by recent floods with emergency food supplies for immediate relief.</p>
            
            <div class="campaign-progress">
                <div class="progress-stats">
                    <span class="progress-current">175 kits</span>
                    <span class="progress-percentage">35%</span>
                    <span class="progress-target">500 kits</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 35%"></div>
                </div>
            </div>
            
            <div class="campaign-meta">
                <span class="donors-count">28 donors</span>
                <span class="time-left">7 days left</span>
            </div>
            
            <button class="contribute-button">
                <span class="btn-text">Contribute Now</span>
                <span class="btn-icon">+</span>
            </button>
        </div>
    </div>
</div>

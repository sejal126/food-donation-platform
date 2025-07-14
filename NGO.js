const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  phone: String,
  address: String,
  website: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('NGO', ngoSchema); 
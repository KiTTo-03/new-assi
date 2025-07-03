const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  passengerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  pickupLocation: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true,
    min: [1, 'Fare must be at least 1']
  },
  status: { 
    type: String, 
    enum: ['requested', 'accepted', 'completed'],
    default: 'requested' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
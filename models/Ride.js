const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    validate: {
      validator: function(v) {
        return !this.passengerId.equals(v); // Prevent driver = passenger
      },
      message: 'Driver cannot be the same as passenger'
    }
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
    enum: ['requested', 'driver_accepted', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'requested' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Ride', rideSchema);
const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickupLocation: String,
    destination: String,
    status: { type: String, enum: ['requested', 'accepted', 'completed'], default: 'requested' },
    fare: Number,
});

module.exports = mongoose.model('Ride', rideSchema);

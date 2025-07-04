const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    minlength: 3
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['driver', 'passenger', 'admin'], 
    required: true 
  },
  profile: {
    phone: { type: String, default: '' },
    // ADDED DRIVER-SPECIFIC FIELDS
    carType: { type: String, default: '' },
    carColor: { type: String, default: '' },
    seatsAvailable: { type: Number, default: 4 }
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
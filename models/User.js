const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: { type: String, enum: ['driver', 'passenger', 'admin'], required: true },
    profile: { type: Object, default: {} }, // Profile info
});

module.exports = mongoose.model('User', userSchema);

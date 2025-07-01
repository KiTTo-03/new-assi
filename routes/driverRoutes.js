const User = require('../models/User');
const Ride = require('../models/Ride');
const jwt = require('jsonwebtoken');

module.exports = function(app) {
    // Driver login
    app.post('/driver/login', async (req, res) => {
        const { username, password } = req.body;
        const user = await User.findOne({ username, role: 'driver' });

        if (!user) return res.status(401).send('Invalid credentials.');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).send('Invalid credentials.');

        const token = jwt.sign({ userId: user._id, role: 'driver' }, 'secretkey');
        res.json({ token });
    });

    // View passenger
    app.get('/driver/viewPassenger', async (req, res) => {
        const passengers = await User.find({ role: 'passenger' });
        res.json(passengers);
    });

    // Update profile
    app.put('/driver/updateProfile', async (req, res) => {
        const { userId, profileData } = req.body;
        await User.findByIdAndUpdate(userId, { profile: profileData });
        res.send('Profile updated successfully');
    });

    // Delete account
    app.delete('/driver/deleteAccount', async (req, res) => {
        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.send('Account deleted successfully');
    });
};

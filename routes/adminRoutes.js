const User = require('../models/User');
const Ride = require('../models/Ride');

module.exports = function(app) {
    // Manage user (admin functionality)
    app.put('/admin/manageUser/:userId', async (req, res) => {
        const { action } = req.body;  // e.g., deactivate, update
        if (action === 'deactivate') {
            await User.findByIdAndUpdate(req.params.userId, { active: false });
        }
        res.send('User managed successfully');
    });

    // View all rides
    app.get('/admin/viewAllRides', async (req, res) => {
        const rides = await Ride.find().populate('driverId passengerId');
        res.json(rides);
    });
};

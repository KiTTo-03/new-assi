const User = require('../models/User');
const Ride = require('../models/Ride');

module.exports = function(app) {
    // Request a ride
    app.post('/passenger/requestRide', async (req, res) => {
        const { passengerId, driverId, pickupLocation, destination, fare } = req.body;

        const newRide = new Ride({
            passengerId,
            driverId,
            pickupLocation,
            destination,
            fare
        });

        await newRide.save();
        res.json(newRide);
    });

    // View driver info
    app.get('/passenger/viewDriverInfo/:driverId', async (req, res) => {
        const driver = await User.findById(req.params.driverId);
        res.json(driver);
    });

    // Accept a ride
    app.put('/passenger/acceptRide/:rideId', async (req, res) => {
        const ride = await Ride.findByIdAndUpdate(req.params.rideId, { status: 'accepted' }, { new: true });
        res.json(ride);
    });

    // Delete account
    app.delete('/passenger/deleteAccount', async (req, res) => {
        const { userId } = req.body;
        await User.findByIdAndDelete(userId);
        res.send('Account deleted successfully');
    });
};

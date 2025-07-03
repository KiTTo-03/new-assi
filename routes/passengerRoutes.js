module.exports = function(app, authenticate) {
  const User = require('../models/User');
  const Ride = require('../models/Ride');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  // Passenger login
  app.post('/passenger/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await User.findOne({ username, role: 'passenger' });
      if (!user || !user.active) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ 
        userId: user._id, 
        role: 'passenger' 
      }, 'secretkey', { expiresIn: '1h' });
      
      res.json({ 
        token, 
        userId: user._id, 
        username: user.username 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  // Request a ride
  app.post('/passenger/requestRide', authenticate, async (req, res) => {
    try {
      const { driverId, pickupLocation, destination, fare } = req.body;
      
      if (!driverId || !pickupLocation || !destination || !fare) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const newRide = new Ride({
        passengerId: req.user.userId,
        driverId,
        pickupLocation,
        destination,
        fare,
        status: 'requested'
      });

      await newRide.save();
      res.json(newRide);
    } catch (error) {
      res.status(500).json({ message: 'Error requesting ride' });
    }
  });

  // View driver info
  app.get('/passenger/viewDriverInfo/:driverId', authenticate, async (req, res) => {
    try {
      const driver = await User.findById(req.params.driverId).select('-password');
      if (!driver) {
        return res.status(404).json({ message: 'Driver not found' });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching driver info' });
    }
  });

  // Accept a ride
  app.put('/passenger/acceptRide/:rideId', authenticate, async (req, res) => {
    try {
      const ride = await Ride.findByIdAndUpdate(
        req.params.rideId, 
        { status: 'accepted' }, 
        { new: true }
      );
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: 'Error accepting ride' });
    }
  });

  // Delete account
  app.delete('/passenger/deleteAccount', authenticate, async (req, res) => {
    try {
      // Clean up associated rides
      await Ride.deleteMany({ 
        $or: [
          { passengerId: req.user.userId },
          { driverId: req.user.userId }
        ]
      });
      
      await User.findByIdAndDelete(req.user.userId);
      res.json({ message: 'Account deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting account' });
    }
  });
};
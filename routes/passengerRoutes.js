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

      // FIXED: Use environment variable for JWT secret
      const token = jwt.sign({ 
        userId: user._id, 
        role: 'passenger' 
      }, process.env.JWT_SECRET, { expiresIn: '12h' });
      
      res.json({ 
        token, 
        userId: user._id, 
        username: user.username 
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error during login' });
    }
  });

  // Request a ride (without driverId)
  app.post('/passenger/requestRide', authenticate, async (req, res) => {
    try {
      const { pickupLocation, destination, fare } = req.body;
      
      if (!pickupLocation || !destination || !fare) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const newRide = new Ride({
        passengerId: req.user.userId,
        driverId: null,
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

// Get active ride
app.get('/passenger/activeRide', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      passengerId: req.user.userId,
      status: { $in: ['requested', 'driver_accepted', 'accepted', 'in_progress'] }
    }).populate('driverId', 'username profile');
    
    if (!ride) {
      return res.status(404).json({ message: 'No active ride found' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active ride' });
  }
});


  // Accept driver
  app.put('/passenger/acceptDriver/:rideId', authenticate, async (req, res) => {
    try {
      const ride = await Ride.findByIdAndUpdate(
        req.params.rideId, 
        { status: 'accepted' }, 
        { new: true }
      ).populate('driverId', 'username');
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: 'Error accepting driver' });
    }
  });

  // Reject driver
  app.put('/passenger/rejectDriver/:rideId', authenticate, async (req, res) => {
    try {
      const ride = await Ride.findByIdAndUpdate(
        req.params.rideId, 
        { 
          status: 'rejected'  // Only update status to 'rejected'
        }, 
        { new: true }
      );
      
      if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
      }
      
      res.json(ride);
    } catch (error) {
      res.status(500).json({ message: 'Error rejecting driver' });
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
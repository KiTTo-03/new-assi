module.exports = function(app, authenticate) {
  const User = require('../models/User');
  const Ride = require('../models/Ride');
  const bcrypt = require('bcryptjs');
  const jwt = require('jsonwebtoken');

  // Driver login route
  app.post('/driver/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
      const user = await User.findOne({ username, role: 'driver' });
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
        role: 'driver' 
      }, process.env.JWT_SECRET, { expiresIn: '12h' });
      
      res.json({ 
        token, 
        userId: user._id, 
        username: user.username 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error logging in' });
    }
  });

  // View passengers
  app.get('/driver/viewPassenger', authenticate, async (req, res) => {
    try {
      const passengers = await User.find({ role: 'passenger' }).select('-password');
      res.json(passengers);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching passengers' });
    }
  });

  // Update profile
  app.put('/driver/updateProfile', authenticate, async (req, res) => {
    try {
      const { username, phone } = req.body;
      if (!username && !phone) {
        return res.status(400).json({ message: 'Nothing to update' });
      }

      const updateData = {};
      if (username) updateData.username = username;
      if (phone) updateData['profile.phone'] = phone;

      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        message: "Profile updated successfully",
        user: updatedUser
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating profile' });
    }
  });

 // Get available rides
app.get('/driver/availableRides', authenticate, async (req, res) => {
  try {
    const rides = await Ride.find({ status: 'requested' })
      .populate('passengerId', 'username');
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available rides' });
  }
});

// Get driver's active ride - MODIFIED TO INCLUDE REJECTED STATUS
app.get('/driver/activeRide', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      driverId: req.user.userId,
      status: { $in: ['driver_accepted', 'accepted', 'in_progress', 'rejected'] } // ADDED 'rejected'
    }).populate('passengerId', 'username');
    
    if (!ride) {
      return res.status(404).json({ message: 'No active ride' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active ride' });
  }
});

// Accept a ride request - FIXED DRIVER ID ASSIGNMENT
app.put('/driver/acceptRide/:rideId', authenticate, async (req, res) => {
  try {
    const driverId = req.user.userId;
    
    // Get ride first to check passenger
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    // Prevent driver from accepting their own ride
    if (ride.passengerId.equals(driverId)) {
      return res.status(400).json({ message: 'Cannot accept your own ride request' });
    }
    
    // Update ride
    const updatedRide = await Ride.findByIdAndUpdate(
      req.params.rideId,
      {
        driverId: driverId,
        status: 'driver_accepted'
      },
      { new: true }
    ).populate('passengerId', 'username');
    
    res.json(updatedRide);
  } catch (error) {
    res.status(500).json({ message: 'Error accepting ride' });
  }
});

// Get ride status
app.get('/driver/rideStatus/:rideId', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    res.json({ status: ride.status });
  } catch (error) {
    res.status(500).json({ message: 'Error checking ride status' });
  }
});

// Get driver's active ride
app.get('/driver/activeRide', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      driverId: req.user.userId,
      status: { $in: ['driver_accepted', 'accepted', 'in_progress'] } // REMOVED 'rejected'
    }).populate('passengerId', 'username');
    
    if (!ride) {
      return res.status(404).json({ message: 'No active ride' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching active ride' });
  }
});


// Start a ride
app.put('/driver/startRide/:rideId', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { status: 'in_progress' },
      { new: true }
    ).populate('passengerId', 'username');
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Error starting ride' });
  }
});

// Complete a ride
app.put('/driver/completeRide/:rideId', authenticate, async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(
      req.params.rideId,
      { status: 'completed' },
      { new: true }
    ).populate('passengerId', 'username');
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Error completing ride' });
  }
});

  // Delete account
  app.delete('/driver/deleteAccount', authenticate, async (req, res) => {
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


app.get('/driver/rideHistory', authenticate, async (req, res) => {
  try {
    const history = await Ride.find({
      driverId: req.user.userId,
      status: { $in: ['completed', 'rejected'] }
    })
    .populate('passengerId', 'username')
    .sort({ createdAt: -1 }); // Newest first
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching ride history' });
  }
});
};
module.exports = function(app, authenticate) {
  const User = require('../models/User');
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

      const token = jwt.sign({ 
        userId: user._id, 
        role: 'driver' 
      }, 'secretkey', { expiresIn: '1h' });
      
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

  // Delete account
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
};
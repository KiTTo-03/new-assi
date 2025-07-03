module.exports = function(app, authenticateAdmin) {
  const User = require('../models/User');
  const Ride = require('../models/Ride');

  // Get all users
  app.get('/admin/users', authenticateAdmin, async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users' });
    }
  });

  // Search users
  app.get('/admin/searchUsers', authenticateAdmin, async (req, res) => {
    const term = req.query.term;
    if (!term) return res.status(400).json({ message: 'Search term required' });

    try {
      const users = await User.find({
        $or: [
          { username: { $regex: term, $options: 'i' } },
          { role: { $regex: term, $options: 'i' } }
        ]
      }).select('-password');
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error searching users' });
    }
  });

  // Get all rides
  app.get('/admin/rides', authenticateAdmin, async (req, res) => {
    try {
      const rides = await Ride.find()
        .populate('passengerId', 'username')
        .populate('driverId', 'username');
      res.json(rides);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching rides' });
    }
  });

  // Manage user status
  app.put('/admin/manageUser/:userId', authenticateAdmin, async (req, res) => {
    const { action } = req.body;
    if (!action || !['activate', 'deactivate'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    try {
      const update = { active: action === 'activate' };
      const user = await User.findByIdAndUpdate(
        req.params.userId, 
        update, 
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        message: `User ${action}d successfully`,
        user 
      });
    } catch (error) {
      res.status(500).json({ message: 'Error updating user status' });
    }
  });
};
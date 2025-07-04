require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = 3000;
const User = require('./models/User'); // Add this at the top
const Ride = require('./models/Ride'); // Add this at the top

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// MongoDB Connection
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MongoDB URI is missing in environment variables');
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB Atlas!');
    // Remove these lines from here:
    // const User = require('./models/User');
    // const Ride = require('./models/Ride');
    createAdminAccount();
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Change createAdminAccount function to not accept parameters
async function createAdminAccount() {
  try {
    const adminExists = await User.findOne({ username: 'admin', role: 'admin' });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        active: true
      });
      await admin.save();
      console.log('Admin account created');
    }
  } catch (err) {
    console.error('Error creating admin account:', err);
  }
}

// Unified authentication middleware
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Access denied. No token provided.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    const path = req.path;

    // Role-based access control
    if (path.startsWith('/driver') && verified.role !== 'driver') {
      return res.status(403).json({ message: 'Driver access required' });
    }
    if (path.startsWith('/passenger') && verified.role !== 'passenger') {
      return res.status(403).json({ message: 'Passenger access required' });
    }
    if (path.startsWith('/admin') && verified.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.user = verified;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(400).json({ message: 'Invalid token' });
  }
}

// Routes
// Root route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// HTML routes
app.get('/login.html', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/signup.html', (req, res) => {
  res.sendFile(__dirname + '/public/signup.html');
});

app.get('/driverDashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/driverDashboard.html');
});

app.get('/passengerDashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/passengerDashboard.html');
});

app.get('/adminLogin.html', (req, res) => {
  res.sendFile(__dirname + '/public/adminLogin.html');
});

app.get('/adminDashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/adminDashboard.html');
});

// User signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password, role, profile } = req.body; // Added profile

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const User = mongoose.model('User');
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user with profile data
    const newUser = new User({
      username, 
      password: hashedPassword, 
      role,
      profile: profile || {}  // Handle profile data
    });
    
    await newUser.save();
    
    res.status(201).json({ 
      message: 'User created successfully',
      userId: newUser._id
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// User login endpoint
app.post('/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = await User.findOne({ username, role });
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
      role: user.role 
    }, process.env.JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ 
      token, 
      userId: user._id, 
      username: user.username,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Admin login endpoint
app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Missing credentials' });
  }

  try {
    const User = mongoose.model('User');
    const user = await User.findOne({ username, role: 'admin' });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // FIXED: Use environment variable for JWT secret
    const token = jwt.sign({ 
      userId: user._id, 
      role: 'admin' 
    }, process.env.JWT_SECRET, { expiresIn: '12h' });
    
    res.json({ 
      token, 
      userId: user._id, 
      username: user.username,
      role: 'admin'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Load route files
require('./routes/driverRoutes')(app, authenticate);
require('./routes/passengerRoutes')(app, authenticate);
require('./routes/adminRoutes')(app, authenticate);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
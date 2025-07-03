require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB Atlas connection string (replace with your actual connection string)
const uri = process.env.MONGO_URI;

// MongoDB Atlas connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Models
const User = require('./models/User');

// Routes
require('./routes/driverRoutes')(app);
require('./routes/passengerRoutes')(app);
require('./routes/adminRoutes')(app);

// User signup endpoint
app.post('/signup', async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).send('Missing required fields');
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
        role
    });

    try {
        await newUser.save();
        res.status(201).send('User created successfully');
    } catch (error) {
        res.status(500).send('Error creating user');
    }
});

// Login endpoint (as before)
app.post('/driver/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'driver' });

    if (!user) return res.status(401).send('Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid credentials.');

    const token = jwt.sign({ userId: user._id, role: 'driver' }, 'secretkey');
    res.json({ token });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

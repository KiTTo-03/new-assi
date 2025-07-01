const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB Atlas connection string
const uri = 'mongodb+srv://akmal03:akmal123@databaseassigment.we2ufn4.mongodb.net/mytaxi?retryWrites=true&w=majority';

// MongoDB Atlas connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Models
const User = require('./models/User');
const Ride = require('./models/Ride');

// Routes
require('./routes/driverRoutes')(app);
require('./routes/passengerRoutes')(app);
require('./routes/adminRoutes')(app);

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

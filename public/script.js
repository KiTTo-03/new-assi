document.addEventListener("DOMContentLoaded", () => {
  // Initialize all components
  initializeEventListeners();
  
  // Display username if on dashboard
  if (window.location.pathname.includes('dashboard.html')) {
    displayUsername();
  }
  
  // Start ride status checks if on passenger dashboard
  if (window.location.pathname.includes('passengerDashboard.html')) {
    setInterval(checkRideStatus, 5000);
  }
  
  // Start active ride checks if on driver dashboard
  if (window.location.pathname.includes('driverDashboard.html')) {
    setInterval(checkDriverActiveRide, 5000);
  }
});

function initializeEventListeners() {
  // Authentication
  if (document.getElementById('loginButton')) {
    document.getElementById('loginButton').addEventListener('click', loginUser);
  }
  if (document.getElementById('signupButton')) {
    document.getElementById('signupButton').addEventListener('click', signupUser);
  }
  if (document.getElementById('adminLoginBtn')) {
    document.getElementById('adminLoginBtn').addEventListener('click', adminLogin);
  }
  if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', logoutUser);
  }
  
  // Passenger features
  if (document.getElementById('requestRideBtn')) {
    document.getElementById('requestRideBtn').addEventListener('click', requestRide);
  }
  if (document.getElementById('deleteAccountBtn')) {
    document.getElementById('deleteAccountBtn').addEventListener('click', deleteAccount);
  }
  
  // Driver features
  if (document.getElementById('loadAvailableRidesBtn')) {
    document.getElementById('loadAvailableRidesBtn').addEventListener('click', loadAvailableRides);
  }
  if (document.getElementById('updateProfileBtn')) {
    document.getElementById('updateProfileBtn').addEventListener('click', updateDriverProfile); 
  }
  if (document.getElementById('loadHistoryBtn')) {
    document.getElementById('loadHistoryBtn').addEventListener('click', loadRideHistory);
  }
  
  // Admin features
  if (document.getElementById('loadUsersBtn')) {
    document.getElementById('loadUsersBtn').addEventListener('click', loadAllUsers);
  }
  if (document.getElementById('loadAllRidesBtn')) {
    document.getElementById('loadAllRidesBtn').addEventListener('click', loadAllRides);
  }
  if (document.getElementById('searchUserBtn')) {
    document.getElementById('searchUserBtn').addEventListener('click', searchUsers);
  }
  
  // New Request button event
  if (document.getElementById('newRequestBtn')) {
    document.getElementById('newRequestBtn').addEventListener('click', () => {
      document.getElementById('requestRideBtn').scrollIntoView();
      document.getElementById('newRequestBtn').style.display = 'none';
    });
  }
}

// Display username on all dashboard pages
function displayUsername() {
  const userNameElement = document.getElementById('userName');
  const greetingElement = document.getElementById('greeting');
  
  if (!userNameElement && !greetingElement) return;
  
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  if (userNameElement) {
    userNameElement.textContent = currentUser.username;
  }
  
  if (greetingElement) {
    greetingElement.textContent = `Hi, ${currentUser.username}!`;
  }
}

// Function to sign up the user
async function signupUser() {
  const username = document.getElementById('signupUsername').value;
  const password = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  
  // Get driver-specific fields
  let profile = {};
  
  if (role === 'driver') {
    profile = {
      carType: document.getElementById('carType').value,
      carColor: document.getElementById('carColor').value,
      seatsAvailable: parseInt(document.getElementById('seatsAvailable').value) || 4
    };
  }

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  // Validate driver fields
  if (role === 'driver') {
    if (!profile.carType || !profile.carColor) {
      showAlert('Please fill all car information fields', 'error');
      return;
    }
    
    if (profile.seatsAvailable < 1 || profile.seatsAvailable > 8) {
      showAlert('Seats available must be between 1 and 8', 'error');
      return;
    }
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        password, 
        role,
        profile  // Include profile data
      })
    });

    if (response.ok) {
      showAlert('Signup successful! Please login.', 'success');
      // Clear form
      document.getElementById('signupUsername').value = '';
      document.getElementById('signupPassword').value = '';
      
      // Clear driver fields if applicable
      if (role === 'driver') {
        document.getElementById('carType').value = '';
        document.getElementById('carColor').value = '';
        document.getElementById('seatsAvailable').value = '4';
      }
      
      // Redirect to login after delay
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
    } else {
      const errorData = await response.json();
      showAlert(`Signup failed: ${errorData.message || 'Something went wrong'}`, 'error');
    }
  } catch (error) {
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// Function to login the user
async function loginUser() {
  console.log('Login started');
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;
  
  console.log('Credentials:', {username, password, role});

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return;
  }

  try {
    showLoader(true);
    console.log('Sending login request');
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    
    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Login failed:', errorData);
      showAlert(`Login failed: ${errorData.message || 'Invalid credentials'}`, 'error');
      return;
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    // Use sessionStorage for regular users, localStorage for admin
    const storage = role === 'admin' ? localStorage : sessionStorage;
    storage.setItem('currentUser', JSON.stringify({
      token: data.token,
      userId: data.userId,
      username: data.username,
      role: data.role
    }));
    
    showAlert('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      if (data.role === 'driver') {
        window.location.href = 'driverDashboard.html';
      } else if (data.role === 'passenger') {
        window.location.href = 'passengerDashboard.html';
      } else if (data.role === 'admin') {
        window.location.href = 'adminDashboard.html';
      } else {
        console.error('Unknown role:', data.role);
        showAlert('Unknown user role', 'error');
      }
    }, 1000);
  } catch (error) {
    console.error('Login error:', error);
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// Admin Login
async function adminLogin() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return;
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      showAlert(`Admin login failed: ${errorData.message || 'Invalid credentials'}`, 'error');
      return;
    }
    
    const data = await response.json();
    
    localStorage.setItem('currentUser', JSON.stringify({
      token: data.token,
      userId: data.userId,
      username: data.username,
      role: 'admin'
    }));
    
    showAlert('Admin login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'adminDashboard.html';
    }, 1000);
  } catch (error) {
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// PASSENGER: Request a ride (without driverId)
async function requestRide() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const pickupLocation = document.getElementById('pickupLocation').value;
  const destination = document.getElementById('destination').value;
  const fare = document.getElementById('fare').value;

  if (!pickupLocation || !destination || !fare) {
    alert('Please fill all fields');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/passenger/requestRide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pickupLocation, destination, fare })
    });

    if (response.ok) {
      showAlert('Ride requested successfully! Waiting for driver...', 'success');
      // Clear form
      document.getElementById('pickupLocation').value = '';
      document.getElementById('destination').value = '';
      document.getElementById('fare').value = '';
    } else {
      const errorData = await response.json();
      alert(`Failed to request ride: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error requesting ride: ' + error.message);
  }
}

// PASSENGER: Check ride status
async function checkRideStatus() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch('http://localhost:3000/passenger/activeRide', {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    const rideStatusDiv = document.getElementById('rideStatus');
    
    if (response.ok) {
      const ride = await response.json();
      
      if (!ride) {
        rideStatusDiv.innerHTML = '<p>No active ride</p>';
        const newRequestBtn = document.getElementById('newRequestBtn');
        if (newRequestBtn) newRequestBtn.style.display = 'none';
        return;
      }
  
      switch(ride.status) {
        case 'requested':
          rideStatusDiv.innerHTML = '<p>Waiting for driver to accept...</p>';
          break;
        case 'driver_accepted':
          rideStatusDiv.innerHTML = `
            <p>Driver ${ride.driverId.username} accepted your request!</p>
            <p><strong>Car:</strong> ${ride.driverId.profile?.carColor || ''} ${ride.driverId.profile?.carType || ''}</p>
            <p><strong>Seats:</strong> ${ride.driverId.profile?.seatsAvailable || 4}</p>
            <button onclick="acceptDriver('${ride._id}')" class="secondary-btn">Accept Driver</button>
            <button onclick="rejectDriver('${ride._id}')" class="danger-btn">Reject Driver</button>
          `;
          break;
        case 'accepted':
        case 'in_progress':
          rideStatusDiv.innerHTML = `
            <p>Ride with ${ride.driverId.username} in progress</p>
            <p><strong>Car:</strong> ${ride.driverId.profile?.carColor || ''} ${ride.driverId.profile?.carType || ''}</p>
            <p><strong>Seats:</strong> ${ride.driverId.profile?.seatsAvailable || 4}</p>
            <p><strong>From:</strong> ${ride.pickupLocation}</p>
            <p><strong>To:</strong> ${ride.destination}</p>
            <p><strong>Fare:</strong> RM${ride.fare}</p>
          `;
          break;
        case 'completed':
          rideStatusDiv.innerHTML = '<p>Ride completed!</p>';
          break;
        case 'rejected':
          rideStatusDiv.innerHTML = `
            <p>You rejected the driver.</p>
            <p>Please create a new ride request.</p>
          `;
          const newRequestBtn = document.getElementById('newRequestBtn');
          if (newRequestBtn) newRequestBtn.style.display = 'block';
          break;
      }
    } else {
      rideStatusDiv.innerHTML = '<p>No active ride</p>';
    }
  } catch (error) {
    console.error('Error checking ride status:', error);
  }
}


// PASSENGER: Accept driver
async function acceptDriver(rideId) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:3000/passenger/acceptDriver/${rideId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (response.ok) {
      showAlert('Driver accepted! Ride confirmed.', 'success');
      checkRideStatus();
    } else {
      const errorData = await response.json();
      showAlert(`Error: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to accept driver', 'error');
  }
}

// PASSENGER: Reject driver - UPDATED TO SHOW REJECTION STATUS
async function rejectDriver(rideId) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    showLoader(true);
    const response = await fetch(`http://localhost:3000/passenger/rejectDriver/${rideId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (response.ok) {
      showAlert('Driver rejected. Please request a new ride.', 'success');
      
      // Clear form and reset UI for new request
      document.getElementById('pickupLocation').value = '';
      document.getElementById('destination').value = '';
      document.getElementById('fare').value = '';
      
      // Reset ride status display
      document.getElementById('rideStatus').innerHTML = '<p>No active ride</p>';
      
      // Hide driver preview
      const driverPreview = document.getElementById('driverPreview');
      if (driverPreview) driverPreview.style.display = 'none';
    } else {
      const errorData = await response.json();
      showAlert(`Error: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to reject driver', 'error');
  } finally {
    showLoader(false);
  }
}

// DRIVER: Load available rides
async function loadAvailableRides() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const ridesList = document.getElementById('availableRidesList');

  ridesList.innerHTML = '<li>Loading available rides...</li>';

  try {
    const response = await fetch('http://localhost:3000/driver/availableRides', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const rides = await response.json();
      
      if (rides.length === 0) {
        ridesList.innerHTML = '<li>No rides available</li>';
        return;
      }
      
      ridesList.innerHTML = '';
      rides.forEach(ride => {
        const li = document.createElement('li');
        li.innerHTML = `
          <p><strong>From:</strong> ${ride.pickupLocation}</p>
          <p><strong>To:</strong> ${ride.destination}</p>
          <p><strong>Fare:</strong> RM${ride.fare}</p>
          <button onclick="driverAcceptRide('${ride._id}')" class="secondary-btn">Accept Ride</button>
        `;
        ridesList.appendChild(li);
      });
    } else {
      const errorData = await response.json();
      alert(`Failed to load rides: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error loading rides: ' + error.message);
  }
}

// DRIVER: Accept a ride request
async function driverAcceptRide(rideId) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:3000/driver/acceptRide/${rideId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      showAlert('Ride accepted! Waiting for passenger confirmation...', 'success');
      loadAvailableRides();
    } else {
      const errorData = await response.json();
      showAlert(`Error: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to accept ride', 'error');
  }
}

// DRIVER: Check active ride status
async function checkDriverActiveRide() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser || currentUser.role !== 'driver') return;

  try {
    const response = await fetch('http://localhost:3000/driver/activeRide', {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    const rideStatusDiv = document.getElementById('currentRideStatus');
    
    if (response.ok) {
      const ride = await response.json();
      
      if (!ride) {
        rideStatusDiv.innerHTML = '<p>No active ride</p>';
        return;
      }
  
      switch(ride.status) {
        case 'driver_accepted':
          rideStatusDiv.innerHTML = `
            <p>Waiting for passenger to confirm...</p>
            <p><strong>Passenger:</strong> ${ride.passengerId.username}</p>
            <p><strong>From:</strong> ${ride.pickupLocation}</p>
            <p><strong>To:</strong> ${ride.destination}</p>
            <p><strong>Fare:</strong> RM${ride.fare}</p>
          `;
          break;
        case 'accepted':
          rideStatusDiv.innerHTML = `
            <p>Passenger has confirmed! Ready to start the ride.</p>
            <p><strong>Passenger:</strong> ${ride.passengerId.username}</p>
            <p><strong>From:</strong> ${ride.pickupLocation}</p>
            <p><strong>To:</strong> ${ride.destination}</p>
            <p><strong>Fare:</strong> RM${ride.fare}</p>
            <button onclick="startRide('${ride._id}')" class="secondary-btn">Start Ride</button>
          `;
          break;
        case 'in_progress':
          rideStatusDiv.innerHTML = `
            <p>Ride in progress</p>
            <p><strong>Passenger:</strong> ${ride.passengerId.username}</p>
            <p><strong>From:</strong> ${ride.pickupLocation}</p>
            <p><strong>To:</strong> ${ride.destination}</p>
            <p><strong>Fare:</strong> RM${ride.fare}</p>
            <button onclick="completeRide('${ride._id}')" class="secondary-btn">Complete Ride</button>
          `;
          break;
        default:
          rideStatusDiv.innerHTML = '<p>No active ride</p>';
      }
    } else {
      rideStatusDiv.innerHTML = '<p>No active ride</p>';
    }
  } catch (error) {
    console.error('Error checking active ride:', error);
  }
}

// DRIVER: Start a ride
async function startRide(rideId) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:3000/driver/startRide/${rideId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (response.ok) {
      showAlert('Ride started!', 'success');
      checkDriverActiveRide();
    } else {
      const errorData = await response.json();
      showAlert(`Error: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to start ride', 'error');
  }
}

// DRIVER: Complete a ride
async function completeRide(rideId) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:3000/driver/completeRide/${rideId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (response.ok) {
      showAlert('Ride completed successfully!', 'success');
      checkDriverActiveRide();
    } else {
      const errorData = await response.json();
      showAlert(`Error: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to complete ride', 'error');
  }
}

// Function to update driver profile
async function updateDriverProfile() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const username = document.getElementById('updateUsername').value;
  const phone = document.getElementById('updatePhone').value;
  const carType = document.getElementById('updateCarType').value;
  const carColor = document.getElementById('updateCarColor').value;
  const seatsAvailable = document.getElementById('updateSeats').value;

  // Check if at least one field has value
  if (!username && !phone && !carType && !carColor && !seatsAvailable) {
    alert('Please enter at least one field to update');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/driver/updateProfile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        username, 
        phone,
        carType,
        carColor,
        seatsAvailable
      })
    });

    if (response.ok) {
      alert('Profile updated successfully');
      
      // Update displayed username only if it exists
      if (username) {
        currentUser.username = username;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // SAFE UPDATE: Only update if element exists
        const greetingElement = document.getElementById('greeting');
        if (greetingElement) {
          greetingElement.textContent = `Hi, ${username}!`;
        }
      }
      
      // Clear form
      document.getElementById('updateUsername').value = '';
      document.getElementById('updatePhone').value = '';
      document.getElementById('updateCarType').value = '';
      document.getElementById('updateCarColor').value = '';
      document.getElementById('updateSeats').value = '';
    } else {
      const errorData = await response.json();
      alert(`Failed to update profile: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error updating profile: ' + error.message);
  }
}

// Function to delete account
async function deleteAccount() {
  if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) {
    return;
  }

  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    alert("You need to log in first!");
    return;
  }

  const token = currentUser.token;
  const endpoint = currentUser.role === 'driver' ? 
    '/driver/deleteAccount' : '/passenger/deleteAccount';

  try {
    const response = await fetch(`http://localhost:3000${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('Account deleted successfully');
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    } else {
      const errorData = await response.json();
      alert(`Failed to delete account: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error deleting account: ' + error.message);
  }
}

// Logout function
function logoutUser() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Admin Dashboard Functions
async function loadAllUsers() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    showAlert('Please log in first', 'error');
    return;
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/admin/users', {
      headers: { 
        'Authorization': `Bearer ${currentUser.token}` 
      }
    });

    if (response.ok) {
      const users = await response.json();
      populateUserTable(users);
    } else {
      const errorData = await response.json();
      showAlert(`Failed to load users: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert(`Error loading users: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

async function loadAllRides() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) {
    showAlert('Please log in first', 'error');
    return;
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/admin/rides', {
      headers: { 
        'Authorization': `Bearer ${currentUser.token}` 
      }
    });

    if (response.ok) {
      const rides = await response.json();
      populateRideTable(rides);
    } else {
      const errorData = await response.json();
      showAlert(`Failed to load rides: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert(`Error loading rides: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

async function searchUsers() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;
  
  const token = currentUser.token;
  const searchTerm = document.getElementById('userSearch').value;
  if (!token || !searchTerm) return;

  try {
    showLoader(true);
    const response = await fetch(`http://localhost:3000/admin/searchUsers?term=${searchTerm}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const users = await response.json();
      populateUserTable(users);
    } else {
      const errorData = await response.json();
      showAlert(`Search failed: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert(`Error searching users: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

function populateUserTable(users) {
  const tableBody = document.querySelector('#userTable tbody');
  tableBody.innerHTML = '';

  users.forEach(user => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${user._id.substring(18)}</td>
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>${user.active ? 'Active' : 'Inactive'}</td>
      <td>
        <button class="user-action-btn ${user.active ? 'deactivate' : 'activate'}" 
                data-userid="${user._id}" 
                data-action="${user.active ? 'deactivate' : 'activate'}">
          ${user.active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });

  // Add event listeners to action buttons
  document.querySelectorAll('.user-action-btn').forEach(btn => {
    btn.addEventListener('click', manageUserStatus);
  });
}

function populateRideTable(rides) {
  const tableBody = document.querySelector('#rideTable tbody');
  tableBody.innerHTML = '';

  rides.forEach(ride => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${ride._id.substring(18)}</td>
      <td>${ride.passengerId?.username || 'N/A'}</td>
      <td>${ride.driverId?.username || 'N/A'}</td>
      <td>${ride.status}</td>
      <td>${ride.fare || '0.00'}</td>
      <td>${new Date(ride.createdAt).toLocaleDateString()}</td>
    `;
    
    tableBody.appendChild(row);
  });
}

async function manageUserStatus(e) {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;
  
  const token = currentUser.token;
  const userId = e.target.dataset.userid;
  const action = e.target.dataset.action;
  
  if (!token || !userId || !action) return;

  try {
    showLoader(true);
    const response = await fetch(`http://localhost:3000/admin/manageUser/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    });

    if (response.ok) {
      showAlert(`User ${action}d successfully`, 'success');
      // Reload users
      setTimeout(loadAllUsers, 1000);
    } else {
      const errorData = await response.json();
      showAlert(`Failed to ${action} user: ${errorData.message}`, 'error');
    }
  } catch (error) {
    showAlert(`Error managing user: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// Show alert message
function showAlert(message, type) {
  // Remove existing alerts
  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) existingAlert.remove();
  
  const alert = document.createElement('div');
  alert.className = `custom-alert ${type}`;
  alert.textContent = message;
  
  document.body.appendChild(alert);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 300);
  }, 3000);
}

// Show loader
function showLoader(show) {
  let loader = document.getElementById('fullscreen-loader');
  
  if (show) {
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'fullscreen-loader';
      loader.innerHTML = '<div class="loader-spinner"></div>';
      document.body.appendChild(loader);
    }
    loader.style.display = 'flex';
  } else if (loader) {
    loader.style.display = 'none';
  }
}

// DRIVER: Load ride history
async function loadRideHistory() {
  // Check both storage locations
  let currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
  if (!currentUser) {
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
  }
  
  if (!currentUser) return;

  try {
    const response = await fetch('http://localhost:3000/driver/rideHistory', {
      headers: { 'Authorization': `Bearer ${currentUser.token}` }
    });

    if (response.ok) {
      const history = await response.json();
      const tableBody = document.querySelector('#historyTable tbody');
      tableBody.innerHTML = '';

      history.forEach(ride => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${ride.passengerId?.username || 'N/A'}</td>
          <td>${ride.pickupLocation}</td>
          <td>${ride.destination}</td>
          <td>RM${ride.fare}</td>
          <td>${ride.status}</td>
          <td>${new Date(ride.createdAt).toLocaleDateString()}</td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
}
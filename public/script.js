document.addEventListener("DOMContentLoaded", () => {
  // Initialize all components
  initializeEventListeners();
  
  // Display username if on dashboard
  if (window.location.pathname.includes('dashboard.html')) {
    displayUsername();
  }
});

function initializeEventListeners() {
  // Authentication
  document.getElementById('loginButton')?.addEventListener('click', loginUser);
  document.getElementById('signupButton')?.addEventListener('click', signupUser);
  document.getElementById('adminLoginBtn')?.addEventListener('click', adminLogin);
  document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);
  
  // Passenger features
  document.getElementById('requestRideBtn')?.addEventListener('click', requestRide);
  document.getElementById('viewDriverBtn')?.addEventListener('click', viewDriverInfo);
  document.getElementById('deleteAccountBtn')?.addEventListener('click', deleteAccount);
  
  // Driver features
  document.getElementById('viewPassengerBtn')?.addEventListener('click', viewPassengers);
  document.getElementById('updateProfileBtn')?.addEventListener('click', updateDriverProfile);
  document.getElementById('acceptRideBtn')?.addEventListener('click', acceptRide);

  // Admin features
  document.getElementById('loadUsersBtn')?.addEventListener('click', loadAllUsers);
  document.getElementById('loadRidesBtn')?.addEventListener('click', loadAllRides);
  document.getElementById('searchUserBtn')?.addEventListener('click', searchUsers);
}

// Display username on all dashboard pages
function displayUsername() {
  const userNameElement = document.getElementById('userName');
  const greetingElement = document.getElementById('greeting');
  
  if (!userNameElement && !greetingElement) return;
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
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

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    if (response.ok) {
      showAlert('Signup successful! Please login.', 'success');
      // Clear form
      document.getElementById('signupUsername').value = '';
      document.getElementById('signupPassword').value = '';
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
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return;
  }

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });

    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('currentUser', JSON.stringify({
        token: data.token,
        userId: data.userId,
        username: data.username,
        role: data.role
      }));
      
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.role === 'driver' ? 
          'driverDashboard.html' : 
          'passengerDashboard.html';
      }, 1000);
    } else {
      showAlert(`Login failed: ${data.message || 'Invalid credentials'}`, 'error');
    }
  } catch (error) {
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// Admin Login
async function adminLogin() {
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  console.log(`Frontend admin login: ${username}`);

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

    const data = await response.json();
    
    if (response.ok) {
      console.log('Admin login successful', data);
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
    } else {
      console.log('Admin login failed', data);
      showAlert(`Admin login failed: ${data.message || 'Invalid credentials'}`, 'error');
    }
  } catch (error) {
    console.error('Admin login error', error);
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    showLoader(false);
  }
}

// Function to request a ride
async function requestRide() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const driverId = document.getElementById('driverId').value;
  const pickupLocation = document.getElementById('pickupLocation').value;
  const destination = document.getElementById('destination').value;
  const fare = document.getElementById('fare').value;

  if (!driverId || !pickupLocation || !destination || !fare) {
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
      body: JSON.stringify({ driverId, pickupLocation, destination, fare })
    });

    if (response.ok) {
      alert('Ride requested successfully');
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

// Function to view driver information
async function viewDriverInfo() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const driverId = document.getElementById('driverId').value;

  if (!driverId) {
    alert('Please enter a driver ID');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/passenger/viewDriverInfo/${driverId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const driverInfo = await response.json();
      document.getElementById('driverInfo').textContent = JSON.stringify(driverInfo, null, 2);
    } else {
      const errorData = await response.json();
      alert(`Failed to load driver information: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error loading driver information: ' + error.message);
  }
}

// Function to view passengers (driver)
async function viewPassengers() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const passengerList = document.getElementById('passengerList');

  // Show loading
  passengerList.innerHTML = '<li>Loading passengers...</li>';

  try {
    const response = await fetch('http://localhost:3000/driver/viewPassenger', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const passengers = await response.json();
      
      if (passengers.length === 0) {
        passengerList.innerHTML = '<li>No passengers found</li>';
        return;
      }
      
      passengerList.innerHTML = '';
      passengers.forEach(passenger => {
        const li = document.createElement('li');
        li.textContent = passenger.username;
        passengerList.appendChild(li);
      });
    } else {
      const errorData = await response.json();
      alert(`Failed to load passengers: ${errorData.message}`);
    }
  } catch (error) {
    alert('Error loading passengers: ' + error.message);
  }
}

// Function to update driver profile
async function updateDriverProfile() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('Please log in first.');
    return;
  }

  const token = currentUser.token;
  const username = document.getElementById('updateUsername').value;
  const phone = document.getElementById('updatePhone').value;

  if (!username && !phone) {
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
      body: JSON.stringify({ username, phone })
    });

    if (response.ok) {
      alert('Profile updated successfully');
      
      // Update displayed username
      if (username) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        currentUser.username = username;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('userName').textContent = username;
        document.getElementById('greeting').textContent = `Hi, ${username}!`;
      }
      
      // Clear form
      document.getElementById('updateUsername').value = '';
      document.getElementById('updatePhone').value = '';
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

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
  window.location.href = 'login.html';
}

// Admin Dashboard Functions
async function loadAllUsers() {
  const token = JSON.parse(localStorage.getItem('currentUser'))?.token;
  if (!token) return;

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
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
  const token = JSON.parse(localStorage.getItem('currentUser'))?.token;
  if (!token) return;

  try {
    showLoader(true);
    const response = await fetch('http://localhost:3000/admin/rides', {
      headers: { 'Authorization': `Bearer ${token}` }
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
  const token = JSON.parse(localStorage.getItem('currentUser'))?.token;
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
  const userId = e.target.dataset.userid;
  const action = e.target.dataset.action;
  const token = JSON.parse(localStorage.getItem('currentUser'))?.token;
  
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
    setTimeout(() => alert.remove(), 300);
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

async function acceptRide() {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    showAlert('Please log in first', 'error');
    return;
  }

  const rideId = document.getElementById('rideId').value;
  if (!rideId) {
    showAlert('Please enter ride ID', 'error');
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/passenger/acceptRide/${rideId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`
      }
    });

    if (response.ok) {
      showAlert('Ride accepted successfully!', 'success');
    } else {
      const error = await response.json();
      showAlert(`Error: ${error.message}`, 'error');
    }
  } catch (error) {
    showAlert('Failed to accept ride', 'error');
  }
}
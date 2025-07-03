document.getElementById('loginButton').addEventListener('click', loginUser);
document.getElementById('signupButton').addEventListener('click', signupUser);
document.getElementById('showSignupLink').addEventListener('click', showSignupForm);
document.getElementById('showLoginLink').addEventListener('click', showLoginForm);
document.getElementById('viewPassengerBtn').addEventListener('click', viewPassengers);
document.getElementById('updateProfileBtn').addEventListener('click', updateProfile);
document.getElementById('deleteAccountBtn').addEventListener('click', deleteDriverAccount);
document.getElementById('requestRideBtn').addEventListener('click', requestRide);
document.getElementById('viewDriverInfoBtn').addEventListener('click', viewDriverInfo);
document.getElementById('acceptRideBtn').addEventListener('click', acceptRide);
document.getElementById('deletePassengerAccountBtn').addEventListener('click', deletePassengerAccount);
document.getElementById('viewAllRidesBtn').addEventListener('click', viewAllRides);
document.getElementById('manageUserBtn').addEventListener('click', manageUser);

let currentUser = null;  // Holds the logged-in user

// Function to login the user
async function loginUser() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    const response = await fetch('http://localhost:3000/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        currentUser = data.token;  // Save the token
        document.getElementById('loginSection').classList.add('hidden');
        showUserDashboard('driver');
    } else {
        alert('Login failed');
    }
}

// Function to sign up the user
async function signupUser() {
    const username = document.getElementById('signupUsername').value;
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;

    const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
    });

    if (response.ok) {
        alert('Signup successful, please login');
        showLoginForm();
    } else {
        alert('Signup failed');
    }
}

// Toggle between login and signup form
function showSignupForm() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('signupSection').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('signupSection').classList.add('hidden');
    document.getElementById('loginSection').classList.remove('hidden');
}

// Show the appropriate dashboard based on the user type
function showUserDashboard(role) {
    document.getElementById('driverDashboard').classList.add('hidden');
    document.getElementById('passengerDashboard').classList.add('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');

    if (role === 'driver') {
        document.getElementById('driverDashboard').classList.remove('hidden');
    } else if (role === 'passenger') {
        document.getElementById('passengerDashboard').classList.remove('hidden');
    } else if (role === 'admin') {
        document.getElementById('adminDashboard').classList.remove('hidden');
    }
}

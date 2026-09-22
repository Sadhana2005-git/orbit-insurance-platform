// API Configuration
// If frontend is served by Flask (http://localhost:5000/), you can use: const API_BASE_URL = '/api';
const API_BASE_URL = 'http://localhost:5000/api';

// Utility Functions
const showError = (elementId, message) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }
};

const clearError = (elementId) => {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
};

const showSuccess = (elementId, message) => {
    const successElement = document.getElementById(elementId);
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => {
            successElement.style.display = 'none';
        }, 5000);
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num);
};

const getToken = () => {
    return localStorage.getItem('orbit_token');
};

const setToken = (token) => {
    localStorage.setItem('orbit_token', token);
};

const removeToken = () => {
    localStorage.removeItem('orbit_token');
};

// Optional aliases (handy if other files use different names)
const clearToken = removeToken;

const getUser = () => {
    const userStr = localStorage.getItem('orbit_user');
    return userStr ? JSON.parse(userStr) : null;
};

const setUser = (user) => {
    localStorage.setItem('orbit_user', JSON.stringify(user));
};

const removeUser = () => {
    localStorage.removeItem('orbit_user');
};

// Optional alias
const clearUser = removeUser;

const isAuthenticated = () => {
    // You can tighten this to: return !!(getToken() && getUser());
    return !!getToken();
};

// API Helper (improved)
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        // Safer JSON parsing (some endpoints/errors might not return JSON)
        let data = null;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text ? { message: text } : {};
        }

        if (!response.ok) {
            // A stored JWT can remain after it expires or after the backend
            // secret changes. Clear it so protected dashboard pages do not
            // keep making requests with an invalid token.
            if (response.status === 401) {
                removeToken();
                removeUser();
                localStorage.removeItem('user_id');
                window.location.href = 'index.html';
            }
            throw new Error(data.error || data.message || 'Something went wrong');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Modal Functions
const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// Navigation
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Close menu when clicking on links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Update UI based on authentication status
const updateAuthUI = () => {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userName = document.getElementById('userName');

    if (isAuthenticated()) {
        const user = getUser();

        if (loginBtn) loginBtn.style.display = 'none';
        if (signupBtn) signupBtn.style.display = 'none';

        if (userProfileBtn) {
            userProfileBtn.style.display = 'flex';
            if (userName) {
                // Safe even if user is null or missing full_name
                const display = user?.full_name ? user.full_name.split(' ')[0] : (user?.email || 'User');
                userName.textContent = display;
            }
        }

        if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (signupBtn) signupBtn.style.display = 'inline-flex';
        if (userProfileBtn) userProfileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
};

// Logout
const logout = () => {
    removeToken();
    removeUser();
    updateAuthUI();
    window.location.href = 'index.html';
};

// Event Listeners for Auth Buttons
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const getStartedBtn = document.getElementById('getStartedBtn');
const learnMoreBtn = document.getElementById('learnMoreBtn');
const ctaSignupBtn = document.getElementById('ctaSignupBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        clearError('loginError');
        openModal('loginModal');
    });
}

if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        clearError('signupError');
        openModal('signupModal');
    });
}

if (ctaSignupBtn) {
    ctaSignupBtn.addEventListener('click', () => {
        if (isAuthenticated()) {
            window.location.href = 'dashboard.html';
        } else {
            clearError('signupError');
            openModal('signupModal');
        }
    });
}

if (getStartedBtn) {
    getStartedBtn.addEventListener('click', () => {
        if (isAuthenticated()) {
            window.location.href = 'dashboard.html';
        } else {
            clearError('signupError');
            openModal('signupModal');
        }
    });
}

if (learnMoreBtn) {
    learnMoreBtn.addEventListener('click', () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

if (userProfileBtn) {
    userProfileBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

// Close Modals
const closeLoginModal = document.getElementById('closeLoginModal');
const closeSignupModal = document.getElementById('closeSignupModal');

if (closeLoginModal) {
    closeLoginModal.addEventListener('click', () => closeModal('loginModal'));
}

if (closeSignupModal) {
    closeSignupModal.addEventListener('click', () => closeModal('signupModal'));
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Switch between Login and Signup
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');

if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        clearError('signupError');
        openModal('signupModal');
    });
}

if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('signupModal');
        clearError('loginError');
        openModal('loginModal');
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});



//bot 

function toggleOrbitBot() {
  const bot = document.getElementById("orbit-chat-container");

  if (bot.style.display === "block") {
    bot.style.display = "none";
  } else {
    bot.style.display = "block";
  }
}





// =========================
// LOGIN (EMAIL/PASSWORD)
// =========================
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearError('loginError');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            setToken(data.token);
            setUser(data.user);
            
            // ✅ Store user_id in localStorage for profile fetching
            if (data.user && data.user.user_id) {
                localStorage.setItem("user_id", data.user.user_id.toString());
            } else if (data.user_id) {
                // Fallback: check if user_id is in root of response
                localStorage.setItem("user_id", data.user_id.toString());
            }

            closeModal('loginModal');
            updateAuthUI();

            window.location.href = 'dashboard.html';
        } catch (error) {
            showError('loginError', error.message);
        }
    });
}


// =========================
// SIGNUP (EMAIL/PASSWORD)
// =========================
const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearError('signupError');

        const formData = {
            full_name: document.getElementById('signupFullName').value.trim(),
            email: document.getElementById('signupEmail').value.trim(),
            password: document.getElementById('signupPassword').value,
            phone: document.getElementById('signupPhone').value.trim(),
            date_of_birth: document.getElementById('signupDOB').value,
            gender: document.getElementById('signupGender').value,
            occupation: document.getElementById('signupOccupation').value.trim(),
            annual_income: document.getElementById('signupIncome').value,
            city: document.getElementById('signupCity').value.trim(),
            state: document.getElementById('signupState').value.trim(),
            pincode: document.getElementById('signupPincode').value.trim()
        };

        // Validate phone number
        const phonePattern = /^[6-9]\d{9}$/;
        if (!phonePattern.test(formData.phone)) {
            showError('signupError', 'Please enter a valid 10-digit Indian phone number');
            return;
        }

        // Validate pincode if provided
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
            showError('signupError', 'Please enter a valid 6-digit pincode');
            return;
        }

        try {
            const data = await apiRequest('/auth/signup', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            setToken(data.token);
            setUser(data.user);
            
            // ✅ Store user_id in localStorage for profile fetching
            if (data.user && data.user.user_id) {
                localStorage.setItem("user_id", data.user.user_id.toString());
            } else if (data.user_id) {
                // Fallback: check if user_id is in root of response
                localStorage.setItem("user_id", data.user_id.toString());
            }

            closeModal('signupModal');
            updateAuthUI();

            window.location.href = 'dashboard.html';
        } catch (error) {
            showError('signupError', error.message);
        }
    });
}


// =========================
// MOCK GOOGLE LOGIN / SIGNUP
// =========================
const googleLoginBtn = document.getElementById('googleLoginBtn');
const googleSignupBtn = document.getElementById('googleSignupBtn');

function makeMockGoogleId(email) {
    // stable-ish id for demo (backend also generates if you don't send)
    return "mock-" + btoa(email).replace(/=+/g, "");
}

// 1) Google Login (mock): tries to login existing user
async function handleGoogleLogin() {
    clearError('loginError');

    // Prefer the email user typed in login box, else ask
    let email = (document.getElementById('loginEmail')?.value || '').trim();
    if (!email) {
        email = prompt("Enter your Google email (demo):", "demo.user@gmail.com") || "";
        email = email.trim();
    }
    if (!email) return;

    const payload = {
        email,
        full_name: "Demo Google User",
        google_id: makeMockGoogleId(email)
    };

    try {
        const data = await apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        setToken(data.token);
        setUser(data.user);
        
        // ✅ Store user_id in localStorage for profile fetching
        if (data.user && data.user.user_id) {
            localStorage.setItem("user_id", data.user.user_id.toString());
        } else if (data.user_id) {
            // Fallback: check if user_id is in root of response
            localStorage.setItem("user_id", data.user_id.toString());
        }

        closeModal('loginModal');
        updateAuthUI();

        window.location.href = 'dashboard.html';
    } catch (error) {
        // Common case: user doesn't exist yet and backend requires phone+d.o.b
        showError(
            'loginError',
            error.message + " If this is your first time, use Google Signup (fill phone & DOB)."
        );
    }
}

// 2) Google Signup (mock): creates a new google user with required profile fields
async function handleGoogleSignup() {
    clearError('signupError');

    const full_name = (document.getElementById('signupFullName')?.value || '').trim();
    const email = (document.getElementById('signupEmail')?.value || '').trim();
    const phone = (document.getElementById('signupPhone')?.value || '').trim();
    const date_of_birth = (document.getElementById('signupDOB')?.value || '').trim();

    // Require these so your app can work later (age-based recommendations etc.)
    if (!full_name) {
        showError('signupError', 'Please enter Full Name before Google signup (demo).');
        return;
    }
    if (!email) {
        showError('signupError', 'Please enter Email before Google signup (demo).');
        return;
    }
    if (!date_of_birth) {
        showError('signupError', 'Please select Date of Birth before Google signup (demo).');
        return;
    }

    const phonePattern = /^[6-9]\d{9}$/;
    if (!phonePattern.test(phone)) {
        showError('signupError', 'Please enter a valid 10-digit Indian phone number before Google signup.');
        return;
    }

    const pincode = (document.getElementById('signupPincode')?.value || '').trim();
    if (pincode && !/^\d{6}$/.test(pincode)) {
        showError('signupError', 'Please enter a valid 6-digit pincode');
        return;
    }

    const payload = {
        full_name,
        email,
        phone,
        date_of_birth,
        gender: document.getElementById('signupGender')?.value || "",
        occupation: (document.getElementById('signupOccupation')?.value || "").trim(),
        annual_income: document.getElementById('signupIncome')?.value || "",
        city: (document.getElementById('signupCity')?.value || "").trim(),
        state: (document.getElementById('signupState')?.value || "").trim(),
        pincode: pincode || "",
        google_id: makeMockGoogleId(email)
    };

    try {
        const data = await apiRequest('/auth/google', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        setToken(data.token);
        setUser(data.user);
        
        // ✅ Store user_id in localStorage for profile fetching
        if (data.user && data.user.user_id) {
            localStorage.setItem("user_id", data.user.user_id.toString());
        } else if (data.user_id) {
            // Fallback: check if user_id is in root of response
            localStorage.setItem("user_id", data.user_id.toString());
        }

        closeModal('signupModal');
        updateAuthUI();

        window.location.href = 'dashboard.html';
    } catch (error) {
        showError('signupError', error.message);
    }
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleLogin);
}

if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', handleGoogleSignup);
}


// =========================
// PASSWORD STRENGTH (OPTIONAL)
// =========================
const signupPassword = document.getElementById('signupPassword');

if (signupPassword) {
    signupPassword.addEventListener('input', (e) => {
        const password = e.target.value;
        let strength = 0;

        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        // Add a strength UI if you want
    });
}


// =========================
// DOB LIMITS (18+)
// =========================
const dobInput = document.getElementById('signupDOB');
if (dobInput) {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());

    dobInput.max = maxDate.toISOString().split('T')[0];
    dobInput.min = minDate.toISOString().split('T')[0];
}
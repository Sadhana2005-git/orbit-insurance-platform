// ORBIT INSURANCE DASHBOARD
// Complete JavaScript with All Fixes
// ============================================

// Check authentication
if (!isAuthenticated()) {
    window.location.href = 'index.html';
}

// ============================================
// UPDATE PROFILE FUNCTION - FIXED VERSION
// ============================================
async function updateProfile() {
    try {
        // Get user_id from localStorage
        const user = getUser();
        const user_id = user?.user_id || localStorage.getItem('user_id');
        
        if (!user_id) {
            alert('User ID not found. Please log in again.');
            return;
        }
        
        // Read full_name using document.getElementById("full_name").value
        const full_name = document.getElementById("full_name").value.trim();
        
        // Validate full_name - if empty, show alert and stop request
        if (!full_name) {
            alert('Full Name is required. Please enter your full name.');
            document.getElementById('full_name').focus();
            return;
        }
        
        // Collect all profile input values from the form (excluding email)
        const profileData = {
            user_id: user_id,
            full_name: full_name, // Already validated above
            phone: document.getElementById('phone')?.value || '',
            date_of_birth: document.getElementById('dob')?.value || '',
            gender: document.getElementById('gender')?.value || '',
            occupation: document.getElementById('occupation')?.value || '',
            annual_income: document.getElementById('income')?.value || '',
            city: document.getElementById('city')?.value || '',
            state: document.getElementById('state')?.value || '',
            pincode: document.getElementById('pincode')?.value || ''
        };
        
        // Send data using fetch() with PUT method
        const response = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Show success alert
            alert('Profile updated successfully!');
            
            // Update local user data
            setUser({
                ...user,
                full_name: profileData.full_name,
                phone: profileData.phone,
                date_of_birth: profileData.date_of_birth,
                gender: profileData.gender,
                occupation: profileData.occupation,
                annual_income: profileData.annual_income,
                city: profileData.city,
                state: profileData.state,
                pincode: profileData.pincode
            });
            
            // Update welcome message if available
            const dashboardUserName = document.getElementById('dashboardUserName');
            if (dashboardUserName && profileData.full_name) {
                dashboardUserName.textContent = `Welcome, ${profileData.full_name}`;
            }
            
        } else {
            // Show error alert
            alert(result.error || 'Failed to update profile');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Network error. Please check your connection and try again.');
    }
}

// ============================================
// AUTO LOAD PROFILE DATA FROM GET /api/profile
// ============================================
async function autoLoadProfileData() {
    try {
        // Get user_id from localStorage
        const user = getUser();
        const user_id = user.user_id || localStorage.getItem('user_id');
        
        if (!user_id) {
            console.warn('No user_id found for profile auto-load');
            return;
        }
        
        // Fetch profile data from GET /api/profile
        const response = await fetch(`http://localhost:5000/api/profile?user_id=${user_id}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Profile not found for user_id:', user_id);
            } else {
                console.error('Failed to fetch profile:', response.statusText);
            }
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
            const profile = data.user;
            
            console.log('Profile auto-loaded from API:', profile);
            
            // Map backend fields to input IDs and populate form
            const fieldMappings = {
                'full_name': 'profileFullName',
                'email': 'profileEmail', 
                'phone': 'profilePhone',
                'date_of_birth': 'dob',
                'gender': 'gender',
                'occupation': 'occupation',
                'annual_income': 'income',
                'city': 'city',
                'state': 'state',
                'pincode': 'pincode'
            };
            
            // Populate each field if the element exists
            Object.entries(fieldMappings).forEach(([backendField, frontendId]) => {
                const element = document.getElementById(frontendId);
                if (element && profile[backendField] !== undefined) {
                    element.value = profile[backendField] || '';
                }
            });
            
            console.log('Profile form auto-populated successfully');
        }
        
    } catch (error) {
        console.error('Error auto-loading profile data:', error);
        // Don't show error to user - this is background auto-load
    }
}

// ============================================
// LOAD USER PROFILE DATA FROM API
// ============================================
async function loadMyProfile() {
    try {
        const res = await fetch("/api/user/profile", {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!res.ok) {
            if (res.status === 401) {
                // not logged in -> send back to home
                logout();
                return;
            }
            throw new Error('Failed to load profile');
        }

        const data = await res.json();
        const user = data.user;

        console.log('Profile data loaded:', user); // Debug
        console.log('DOB from backend:', user.date_of_birth); // Debug DOB

        // Fill profile fields
        if (document.getElementById('profileFullName')) {
            document.getElementById('profileFullName').value = user.full_name || "";
        }
        if (document.getElementById('profileEmail')) {
            document.getElementById('profileEmail').value = user.email || "";
        }
        if (document.getElementById('profilePhone')) {
            document.getElementById('profilePhone').value = user.phone || "";
        }
        
        // DOB must be "YYYY-MM-DD" for input type="date"
        if (document.getElementById('dateOfBirth')) {
            document.getElementById('dateOfBirth').value = user.date_of_birth || "";
        }
        
        if (document.getElementById('profileGender')) {
            document.getElementById('profileGender').value = user.gender || "";
        }
        if (document.getElementById('profileOccupation')) {
            document.getElementById('profileOccupation').value = user.occupation || "";
        }
        if (document.getElementById('profileIncome')) {
            document.getElementById('profileIncome').value = user.annual_income || "";
        }
        if (document.getElementById('profileCity')) {
            document.getElementById('profileCity').value = user.city || "";
        }
        if (document.getElementById('profileState')) {
            document.getElementById('profileState').value = user.state || "";
        }
        if (document.getElementById('profilePincode')) {
            document.getElementById('profilePincode').value = user.pincode || "";
        }
        
        // Update user name in header
        const dashboardUserName = document.getElementById('dashboardUserName');
        if (dashboardUserName && user.full_name) {
            dashboardUserName.textContent = `Welcome, ${user.full_name}`;
        }
        
        // Update stored user data
        setUser(user);
        
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Don't redirect on error - just log it
    }
}

// ============================================
// PROFILE AUTO-LOAD ON PAGE VISIT
// This runs every time the profile page loads
// ============================================
async function loadProfileOnPageVisit() {
    try {
        // Get user_id from localStorage
        const user = getUser();
        const user_id = user.user_id || localStorage.getItem('user_id');
        
        if (!user_id) {
            console.warn('No user_id found for profile load');
            return;
        }
        
        // Call GET /api/profile endpoint
        const response = await fetch(`http://localhost:5000/api/profile?user_id=${user_id}`);
        
        if (!response.ok) {
            console.error('Failed to fetch profile:', response.statusText);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
            const profile = data.user;
            
            console.log('Profile loaded on page visit:', profile);
            
            // ✅ Populate all profile fields with correct IDs
            const fieldMappings = [
                { backend: 'full_name', frontend: 'full_name' },
                { backend: 'email', frontend: 'email' },
                { backend: 'phone', frontend: 'phone' },
                { backend: 'date_of_birth', frontend: 'dob' },
                { backend: 'gender', frontend: 'gender' },
                { backend: 'occupation', frontend: 'occupation' },
                { backend: 'annual_income', frontend: 'income' },
                { backend: 'city', frontend: 'city' },
                { backend: 'state', frontend: 'state' },
                { backend: 'pincode', frontend: 'pincode' }
            ];
            
            // Populate each field
            fieldMappings.forEach(mapping => {
                const element = document.getElementById(mapping.frontend);
                if (element) {
                    // Ensure email field remains readonly
                    if (mapping.frontend === 'email') {
                        element.readOnly = true;
                    }
                    
                    // Set value from profile data
                    if (profile[mapping.backend] !== undefined) {
                        element.value = profile[mapping.backend] || '';
                    }
                }
            });
            
            // Update welcome message
            const dashboardUserName = document.getElementById('dashboardUserName');
            if (dashboardUserName && profile.full_name) {
                dashboardUserName.textContent = `Welcome, ${profile.full_name}`;
            }
            
            console.log('Profile loaded successfully on page visit');
        }
        
    } catch (error) {
        console.error('Error loading profile on page visit:', error);
        // Don't show error to user
    }
}

// Update user name in header (fallback)
const dashboardUserName = document.getElementById('dashboardUserName');
if (dashboardUserName) {
    const user = getUser();
    if (user.full_name) {
        dashboardUserName.textContent = `Welcome, ${user.full_name}`;
    }
}

// Logout handler
const dashboardLogoutBtn = document.getElementById('dashboardLogoutBtn');
if (dashboardLogoutBtn) {
    dashboardLogoutBtn.addEventListener('click', logout);
}

// ============================================
// CATEGORY ID MAPPING HELPER
// ============================================
const getCategoryId = (category) => {
    const idMap = {
        'Term Life': 'termLife',
        'Whole Life': 'wholeLife',
        'Endowment': 'endowment',
        'ULIP': 'ulip',
        'Health': 'health',
        'Motor': 'motor',
        'Travel': 'travel'
    };
    return idMap[category] || category.toLowerCase().replace(/\s+/g, '');
};

// ============================================
// PAGE NAVIGATION
// ============================================
const menuItems = document.querySelectorAll('.menu-item');
const dashboardPages = document.querySelectorAll('.dashboard-page');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
       
        // Update active menu item
        menuItems.forEach(mi => mi.classList.remove('active'));
        item.classList.add('active');
       
        // Update active page
        dashboardPages.forEach(p => p.classList.remove('active'));
        document.getElementById(`${page}Page`).classList.add('active');
       
        // Load page data
        loadPageData(page);
    });
});

// Quick action cards
const actionCards = document.querySelectorAll('.action-card');
actionCards.forEach(card => {
    card.addEventListener('click', () => {
        const action = card.getAttribute('data-action');
        const menuItem = document.querySelector(`.menu-item[data-page="${action}"]`);
        if (menuItem) {
            menuItem.click();
        }
    });
});

// ============================================
// LOAD PAGE DATA
// ============================================
const loadPageData = async (page) => {
    switch (page) {
        case 'overview':
            await loadOverviewData();
            break;
        case 'categories':
            await loadCategoriesPage();
            break;
        case 'recommendations':
            await loadRecommendationsPage();
            break;
        case 'compare':
            await loadComparePage();
            break;
        case 'policies':
            await loadPoliciesPage();
            break;
        case 'profile':
            await loadProfilePage();
            // ✅ Auto-load profile data when profile page is loaded
            await loadProfileOnPageVisit();
            break;
        case 'mlpredictor':
            await loadMLPredictorPage();
            break;
    }
};

// ============================================
// OVERVIEW PAGE
// ============================================
const loadOverviewData = async () => {
    try {
        // Load stats
        const stats = await apiRequest('/stats');
       
        document.getElementById('totalPolicies').textContent = stats.total_policies;
        document.getElementById('totalCoverage').textContent = formatCurrency(stats.total_coverage);
        document.getElementById('totalPremium').textContent = formatCurrency(stats.total_annual_premium);
       
        // Load recent policies
        const policies = await apiRequest('/policies');
        const recentPolicies = policies.policies.slice(0, 3);
       
        const recentPoliciesList = document.getElementById('recentPoliciesList');
        if (recentPolicies.length === 0) {
            recentPoliciesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-contract"></i>
                    <p>No policies yet. Get started by exploring recommendations!</p>
                </div>
            `;
        } else {
            recentPoliciesList.innerHTML = recentPolicies.map(policy => `
                <div class="policy-card">
                    <div class="policy-header">
                        <div>
                            <div class="policy-number">${policy.policy_number}</div>
                            <div class="plan-provider">${policy.provider_name}</div>
                        </div>
                        <span class="policy-status status-${policy.status.toLowerCase()}">${policy.status}</span>
                    </div>
                    <div class="policy-info">
                        <div class="detail-item">
                            <span class="detail-label">Plan Name</span>
                            <span class="detail-value">${policy.plan_name}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Coverage</span>
                            <span class="detail-value">${formatCurrency(policy.coverage_amount)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Premium</span>
                            <span class="detail-value">${formatCurrency(policy.premium_amount)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
       
    } catch (error) {
        console.error('Error loading overview:', error);
    }
};

// ============================================
// BROWSE CATEGORIES PAGE
// ============================================
let currentCategoryPlans = [];
let currentCategory = '';

const loadCategoriesPage = async () => {
    try {
        const data = await apiRequest('/categories');
       
        console.log('Categories loaded:', data.categories); // Debug
       
        // Update category cards with stats
        data.categories.forEach(cat => {
            const categoryId = getCategoryId(cat.category);
            const countEl = document.getElementById(`${categoryId}Count`);
            const rangeEl = document.getElementById(`${categoryId}Range`);
           
            console.log(`Category: ${cat.category}, ID: ${categoryId}, Count: ${cat.plan_count}`); // Debug
           
            if (countEl) {
                countEl.textContent = `${cat.plan_count} Plans`;
            } else {
                console.error(`Count element not found: ${categoryId}Count`);
            }
           
            if (rangeEl) {
                rangeEl.textContent = `${formatCurrency(cat.min_premium)} - ${formatCurrency(cat.max_premium)}`;
            } else {
                console.error(`Range element not found: ${categoryId}Range`);
            }
        });
       
        // Add click handlers to category cards
        document.querySelectorAll('.category-browse-btn').forEach(btn => {
            btn.onclick = async () => {
                const category = btn.getAttribute('data-category');
                await loadCategoryPlans(category);
            };
        });
       
    } catch (error) {
        console.error('Error loading categories:', error);
    }
};

// Load Plans for Specific Category (Browse Categories)
const loadCategoryPlans = async (category) => {
    try {
        currentCategory = category;
       
        // Show loading
        const categoryDisplay = document.getElementById('categoryPlansDisplay');
        const categoryList = document.getElementById('categoryPlansList');
        const categoryTitle = document.getElementById('categoryPlansTitle');
       
        categoryTitle.textContent = `${category} Insurance Plans`;
        categoryDisplay.style.display = 'block';
        categoryList.innerHTML = '<div class="category-loading"><div class="loading"></div><p>Loading plans...</p></div>';
       
        // Hide category grid
        document.querySelector('.category-grid').style.display = 'none';
        document.querySelector('.page-description').style.display = 'none';
       
        // Fetch plans
        const data = await apiRequest(`/plans/category/${encodeURIComponent(category)}`);
        currentCategoryPlans = data.plans;
       
        // Populate provider filter
        const providers = [...new Set(data.plans.map(p => p.provider_name))];
        const providerFilter = document.getElementById('categoryProviderFilter');
        providerFilter.innerHTML = '<option value="">All Providers</option>';
        providers.forEach(provider => {
            const option = document.createElement('option');
            option.value = provider;
            option.textContent = provider;
            providerFilter.appendChild(option);
        });
       
        // Display plans
        displayBrowseCategoryPlans(currentCategoryPlans);
       
        // Add filter handlers
        document.getElementById('categoryProviderFilter').onchange = filterBrowseCategoryPlans;
        document.getElementById('categorySortFilter').onchange = filterBrowseCategoryPlans;
       
    } catch (error) {
        console.error('Error loading category plans:', error);
        document.getElementById('categoryPlansList').innerHTML = `
            <div class="category-empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load plans. Please try again.</p>
            </div>
        `;
    }
};

// Display Category Plans (Browse Categories)
const displayBrowseCategoryPlans = (plans) => {
    const categoryList = document.getElementById('categoryPlansList');
   
    if (plans.length === 0) {
        categoryList.innerHTML = `
            <div class="category-empty">
                <i class="fas fa-folder-open"></i>
                <p>No plans found matching your criteria.</p>
            </div>
        `;
        return;
    }
   
    categoryList.innerHTML = `
        <div class="category-plans-grid">
            ${plans.map(plan => `
                <div class="category-plan-card">
                    <span class="plan-provider-tag">${plan.provider_name.split(' ')[0]}</span>
                    <h3 class="category-plan-title">${plan.plan_name}</h3>
                   
                    <div class="plan-highlights">
                        <div class="highlight-item">
                            <span class="highlight-label">Premium (Annual)</span>
                            <span class="highlight-value price">${formatCurrency(plan.personalized_premium)}</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Coverage</span>
                            <span class="highlight-value">${formatCurrency(plan.coverage_amount)}</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Policy Term</span>
                            <span class="highlight-value">${plan.policy_term} years</span>
                        </div>
                        <div class="highlight-item">
                            <span class="highlight-label">Age Range</span>
                            <span class="highlight-value">${plan.min_age} - ${plan.max_age} yrs</span>
                        </div>
                    </div>
                   
                    <div class="plan-rating">
                        <span class="stars">${getStarRating(plan.rating)}</span>
                        <span>${plan.rating}/5</span>
                    </div>
                   
                    <div class="csr-badge">
                        <i class="fas fa-check-circle"></i>
                        Claim Settlement: ${plan.claim_settlement_ratio}%
                    </div>
                   
                    <div class="category-plan-actions">
                        <button class="btn btn-outline" onclick="viewPlanDetails(${plan.plan_id})">
                            <i class="fas fa-info-circle"></i> Details
                        </button>
                        <button class="btn btn-primary" onclick="purchasePlan(${plan.plan_id}, ${plan.personalized_premium}, ${plan.coverage_amount})">
                            <i class="fas fa-shopping-cart"></i> Buy Now
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

// Filter Category Plans (Browse Categories)
const filterBrowseCategoryPlans = () => {
    let filteredPlans = [...currentCategoryPlans];
   
    // Provider filter
    const providerFilter = document.getElementById('categoryProviderFilter').value;
    if (providerFilter) {
        filteredPlans = filteredPlans.filter(p => p.provider_name === providerFilter);
    }
   
    // Sort filter
    const sortFilter = document.getElementById('categorySortFilter').value;
    switch (sortFilter) {
        case 'premium_asc':
            filteredPlans.sort((a, b) => a.personalized_premium - b.personalized_premium);
            break;
        case 'premium_desc':
            filteredPlans.sort((a, b) => b.personalized_premium - a.personalized_premium);
            break;
        case 'coverage_desc':
            filteredPlans.sort((a, b) => b.coverage_amount - a.coverage_amount);
            break;
        case 'rating_desc':
            filteredPlans.sort((a, b) => b.rating - a.rating);
            break;
    }
   
    displayBrowseCategoryPlans(filteredPlans);
};

// Back to Categories
document.getElementById('backToCategoriesBtn')?.addEventListener('click', () => {
    document.getElementById('categoryPlansDisplay').style.display = 'none';
    document.querySelector('.category-grid').style.display = 'grid';
    document.querySelector('.page-description').style.display = 'block';
});

// ============================================
// RECOMMENDATIONS PAGE
// ============================================
const loadRecommendationsPage = async () => {
    const recommendationForm = document.getElementById('recommendationForm');
   
    recommendationForm.onsubmit = async (e) => {
        e.preventDefault();
       
        const coveragePreference = parseInt(document.getElementById('coveragePreference').value);
        const budget = document.getElementById('budgetPreference').value;
       
        const requestData = {
            coverage_preference: coveragePreference,
            top_n: 5
        };
       
        if (budget) {
            requestData.budget = parseInt(budget);
        }
       
        try {
            const resultsDiv = document.getElementById('recommendationsResults');
            const listDiv = document.getElementById('recommendationsList');
           
            listDiv.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
            resultsDiv.style.display = 'block';
           
            const data = await apiRequest('/recommendations', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });
           
            if (data.recommendations.length === 0) {
                listDiv.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No recommendations found. Try adjusting your preferences.</p>
                    </div>
                `;
                return;
            }
           
            listDiv.innerHTML = data.recommendations.map((plan, index) => `
                <div class="plan-card">
                    <div class="plan-header">
                        <div class="plan-title">
                            <h3>${plan.plan_name}</h3>
                            <p class="plan-provider">${plan.provider_name}</p>
                        </div>
                        <div>
                            ${index === 0 ? '<span class="plan-badge badge-recommended">Best Match</span>' : ''}
                            <span class="plan-badge badge-term">${plan.plan_type}</span>
                        </div>
                    </div>
                    <div class="match-score">
                        <span>Match Score:</span>
                        <div class="score-bar">
                            <div class="score-fill" style="width: ${plan.match_score}%"></div>
                        </div>
                        <span><strong>${plan.match_score.toFixed(0)}%</strong></span>
                    </div>
                    <div class="plan-details">
                        <div class="detail-item">
                            <span class="detail-label">Premium (Annual)</span>
                            <span class="detail-value">${formatCurrency(plan.personalized_premium)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Coverage</span>
                            <span class="detail-value">${formatCurrency(plan.coverage_amount)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Policy Term</span>
                            <span class="detail-value">${plan.policy_term} years</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Claim Settlement</span>
                            <span class="detail-value">${plan.claim_settlement_ratio}%</span>
        </div>
                        <div class="detail-item">
                            <span class="detail-label">Rating</span>
                            <span class="detail-value">${plan.rating} / 5</span>
                        </div>
                    </div>
                    <div class="plan-actions">
                        <button class="btn btn-outline" onclick="viewPlanDetails(${plan.plan_id})">
                            <i class="fas fa-info-circle"></i> View Details
                        </button>
                        <button class="btn btn-primary" onclick="purchasePlan(${plan.plan_id}, ${plan.personalized_premium}, ${plan.coverage_amount})">
                            <i class="fas fa-shopping-cart"></i> Purchase Plan
                        </button>
                    </div>
                </div>
            `).join('');
           
        } catch (error) {
            console.error('Error getting recommendations:', error);
            alert('Failed to get recommendations: ' + error.message);
        }
    };
};

// ============================================
// COMPARE PLANS PAGE
// ============================================
let allGroupedPlans = {};
let selectedPlansForComparison = [];
const MAX_COMPARE_PLANS = 4;
const MIN_COMPARE_PLANS = 2;

// Load Compare Page with Categories
const loadComparePage = async () => {
    try {
        // Fetch all plans grouped by category
        const data = await apiRequest('/plans/grouped');
        allGroupedPlans = data.grouped_plans;
       
        console.log('Grouped Plans Loaded:', allGroupedPlans); // Debug
       
        // Update tab counts with proper ID mapping
        Object.keys(allGroupedPlans).forEach(category => {
            const categoryId = getCategoryId(category);
            const countElement = document.getElementById(`${categoryId}TabCount`);
           
            console.log(`Updating ${category}: ID=${categoryId}TabCount, Count=${allGroupedPlans[category].length}`); // Debug
           
            if (countElement) {
                countElement.textContent = allGroupedPlans[category].length;
            } else {
                console.error(`Count element not found: ${categoryId}TabCount`);
            }
        });
       
        // Display plans for the first category (Term Life)
        displayCompareCategoryPlans('Term Life');
       
        // Set up tab switching
        document.querySelectorAll('.compare-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                switchCompareCategory(category);
            });
        });
       
        // Set up compare button
        const compareBtn = document.getElementById('compareSelectedPlansBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => {
                if (selectedPlansForComparison.length >= MIN_COMPARE_PLANS &&
                    selectedPlansForComparison.length <= MAX_COMPARE_PLANS) {
                    performComparison();
                }
            });
        }
       
        // Set up clear selection button
        const clearBtn = document.getElementById('clearSelectionBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                clearComparisonSelection();
            });
        }
       
        // Set up back button
        const backBtn = document.getElementById('backToSelectionBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('comparisonResults').style.display = 'none';
                document.querySelector('.compare-tabs').style.display = 'flex';
                document.querySelector('.compare-selection-info').style.display = 'flex';
                document.querySelector('.compare-category-content').style.display = 'block';
            });
        }
       
    } catch (error) {
        console.error('Error loading compare page:', error);
        alert('Failed to load plans. Please try again.');
    }
};

// Switch Category Tab
const switchCompareCategory = (category) => {
    console.log('Switching to category:', category); // Debug
   
    // Update active tab
    document.querySelectorAll('.compare-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-category') === category) {
            tab.classList.add('active');
        }
    });
   
    // Update active content
    document.querySelectorAll('.compare-plans-section').forEach(section => {
        section.classList.remove('active');
        if (section.getAttribute('data-category') === category) {
            section.classList.add('active');
        }
    });
   
    // Display plans for this category
    displayCompareCategoryPlans(category);
};

// Display Plans for Category (Compare Page) - FIXED VERSION
const displayCompareCategoryPlans = (category) => {
    console.log('displayCompareCategoryPlans called for:', category);
   
    // Use the mapping helper
    const categoryId = getCategoryId(category);
    const containerElement = document.getElementById(`${categoryId}Plans`);
   
    console.log(`Looking for container: ${categoryId}Plans`); // Debug
   
    if (!containerElement) {
        console.error(`Container not found: ${categoryId}Plans`);
        return;
    }
   
    // Check if already loaded
    if (containerElement.querySelector('.compare-plan-card')) {
        console.log('Plans already loaded for:', category);
        return;
    }
   
    const plans = allGroupedPlans[category] || [];
   
    console.log(`Plans for ${category}:`, plans.length); // Debug
   
    if (plans.length === 0) {
        console.warn('No plans found for category:', category);
        containerElement.innerHTML = `
            <div class="category-empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No ${category} Plans Available</h3>
                <p>We're working on adding more plans in this category.</p>
            </div>
        `;
        return;
    }
   
    containerElement.innerHTML = plans.map(plan => `
        <div class="compare-plan-card" data-plan-id="${plan.plan_id}" data-category="${category}">
            <input type="checkbox"
                   class="compare-checkbox"
                   data-plan-id="${plan.plan_id}"
                   ${selectedPlansForComparison.some(p => p.planId === plan.plan_id) ? 'checked' : ''}
                   onchange="togglePlanSelection(${plan.plan_id}, '${category}')">
           
            <div class="compare-plan-header">
                <span class="compare-plan-provider">${plan.provider_name.split(' ')[0]}</span>
                <h3 class="compare-plan-name">${plan.plan_name}</h3>
            </div>
           
            <div class="compare-plan-details">
                <div class="compare-detail-item">
                    <span class="compare-detail-label">Premium (Annual)</span>
                    <span class="compare-detail-value premium">${formatCurrency(plan.personalized_premium)}</span>
                </div>
                <div class="compare-detail-item">
                    <span class="compare-detail-label">Coverage</span>
                    <span class="compare-detail-value">${formatCurrency(plan.coverage_amount)}</span>
                </div>
                <div class="compare-detail-item">
                    <span class="compare-detail-label">Policy Term</span>
                    <span class="compare-detail-value">${plan.policy_term} years</span>
                </div>
                <div class="compare-detail-item">
                    <span class="compare-detail-label">Age Range</span>
                    <span class="compare-detail-value">${plan.min_age}-${plan.max_age} yrs</span>
                </div>
            </div>
           
            <div class="compare-plan-rating">
                <div class="rating-stars">
                    ${getStarRating(plan.rating)} ${plan.rating}/5
                </div>
                <div class="csr-value">
                    <i class="fas fa-check-circle"></i> CSR: ${plan.claim_settlement_ratio}%
                </div>
            </div>
        </div>
    `).join('');
   
    // Add click handlers to cards
    containerElement.querySelectorAll('.compare-plan-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('compare-checkbox')) return;
            const checkbox = card.querySelector('.compare-checkbox');
            checkbox.checked = !checkbox.checked;
            const planId = parseInt(card.getAttribute('data-plan-id'));
            const category = card.getAttribute('data-category');
            togglePlanSelection(planId, category);
        });
    });
};

// Toggle Plan Selection - ALLOWS CROSS-CATEGORY
window.togglePlanSelection = (planId, category) => {
    const index = selectedPlansForComparison.findIndex(p => p.planId === planId);
   
    if (index > -1) {
        // Remove from selection
        selectedPlansForComparison.splice(index, 1);
    } else {
        // Add to selection
        if (selectedPlansForComparison.length >= MAX_COMPARE_PLANS) {
            alert(`You can compare maximum ${MAX_COMPARE_PLANS} plans at a time.`);
            // Uncheck the checkbox
            const checkbox = document.querySelector(`.compare-checkbox[data-plan-id="${planId}"]`);
            if (checkbox) checkbox.checked = false;
            return;
        }
       
        // ✅ CROSS-CATEGORY ALLOWED - No restrictions!
        selectedPlansForComparison.push({ planId, category });
    }
   
    // Update UI
    updateComparisonUI();
};

// Update Comparison UI - Enhanced for Cross-Category
const updateComparisonUI = () => {
    const count = selectedPlansForComparison.length;
    const countText = document.getElementById('selectedCountText');
    const compareBtn = document.getElementById('compareSelectedPlansBtn');
    const clearBtn = document.getElementById('clearSelectionBtn');
   
    // Get unique categories
    const uniqueCategories = [...new Set(selectedPlansForComparison.map(p => p.category))];
    const isCrossCategory = uniqueCategories.length > 1;
   
    // Update count text with category info
    if (countText) {
        let text = `${count} plan${count !== 1 ? 's' : ''} selected`;
        if (count > 0 && isCrossCategory) {
            text += ` (${uniqueCategories.length} categories)`;
        }
        countText.textContent = text;
    }
   
    // Update compare button
    if (compareBtn) {
        compareBtn.disabled = count < MIN_COMPARE_PLANS || count > MAX_COMPARE_PLANS;
    }
   
    // Show/hide clear button
    if (clearBtn) {
        clearBtn.style.display = count > 0 ? 'inline-flex' : 'none';
    }
   
    // Update card styling
    document.querySelectorAll('.compare-plan-card').forEach(card => {
        const planId = parseInt(card.getAttribute('data-plan-id'));
        const isSelected = selectedPlansForComparison.some(p => p.planId === planId);
       
        if (isSelected) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
};

// Clear Selection
const clearComparisonSelection = () => {
    selectedPlansForComparison = [];
   
    // Uncheck all checkboxes
    document.querySelectorAll('.compare-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
   
    updateComparisonUI();
};

// Perform Comparison
const performComparison = async () => {
    try {
        const planIds = selectedPlansForComparison.map(p => p.planId);
       
        const data = await apiRequest('/compare', {
            method: 'POST',
            body: JSON.stringify({ plan_ids: planIds })
        });
       
        displayEnhancedComparison(data.comparison);
       
        // Hide selection UI, show results
        document.querySelector('.compare-tabs').style.display = 'none';
        document.querySelector('.compare-selection-info').style.display = 'none';
        document.querySelector('.compare-category-content').style.display = 'none';
        document.getElementById('comparisonResults').style.display = 'block';
       
    } catch (error) {
        console.error('Error comparing plans:', error);
        alert('Failed to compare plans: ' + error.message);
    }
};

// Display Enhanced Comparison - UPDATED for Cross-Category Support
const displayEnhancedComparison = (comparison) => {
    const tableDiv = document.getElementById('comparisonTable');
    const plans = comparison.plans;
   
    // Check if comparing different categories
    const categories = [...new Set(plans.map(p => p.plan_type))];
    const isCrossCategory = categories.length > 1;
   
    // Find best values
    const lowestPremiumIndex = plans.indexOf(comparison.best_options.lowest_premium);
    const highestCoverageIndex = plans.indexOf(comparison.best_options.highest_coverage);
    const bestCSRIndex = plans.indexOf(comparison.best_options.best_csr);
    const highestRatedIndex = plans.indexOf(comparison.best_options.highest_rated);
   
    tableDiv.innerHTML = `
        ${isCrossCategory ? `
            <div class="comparison-notice">
                <i class="fas fa-info-circle"></i>
                <strong>Cross-Category Comparison:</strong> You're comparing different types of insurance plans.
                Features and benefits may vary significantly across categories.
            </div>
        ` : ''}
       
        <div class="comparison-table-wrapper">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th style="min-width: 200px;">Feature</th>
                        ${plans.map(plan => `
                            <th style="min-width: 250px;">
                                <div style="margin-bottom: 0.5rem;">${plan.plan_name}</div>
                                <div style="font-size: 0.85rem; font-weight: normal; opacity: 0.9;">
                                    ${plan.provider_name}
                                </div>
                                <div style="font-size: 0.8rem; background: rgba(255,255,255,0.2); padding: 0.25rem 0.5rem; border-radius: 4px; margin-top: 0.5rem;">
                                    ${plan.plan_type}
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Pricing & Coverage</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Premium (Annual)</strong></td>
                        ${plans.map((plan, index) => `
                            <td class="${index === lowestPremiumIndex ? 'comparison-best-value' : ''}">
                                <strong style="color: var(--success-color); font-size: 1.2rem;">
                                    ${formatCurrency(plan.personalized_premium)}
                                </strong>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Coverage Amount</strong></td>
                        ${plans.map((plan, index) => `
                            <td class="${index === highestCoverageIndex ? 'comparison-best-value' : ''}">
                                <strong style="color: var(--primary-color); font-size: 1.1rem;">
                                    ${formatCurrency(plan.coverage_amount)}
                                </strong>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Policy Term</strong></td>
                        ${plans.map(plan => `<td>${plan.policy_term} years</td>`).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Plan Category</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Insurance Type</strong></td>
                        ${plans.map(plan => `
                            <td>
                                <span class="plan-type-badge plan-type-${plan.plan_type.toLowerCase().replace(/\s+/g, '-')}">
                                    ${plan.plan_type}
                                </span>
                            </td>
                        `).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Eligibility</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Age Range</strong></td>
                        ${plans.map(plan => `<td>${plan.min_age} - ${plan.max_age} years</td>`).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Performance Metrics</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Claim Settlement Ratio</strong></td>
                        ${plans.map((plan, index) => `
                            <td class="${index === bestCSRIndex ? 'comparison-best-value' : ''}">
                                <strong style="color: var(--success-color);">${plan.claim_settlement_ratio}%</strong>
                            </td>
                        `).join('')}
                    </tr>
                    <tr>
                        <td><strong>Rating</strong></td>
                        ${plans.map((plan, index) => `
                            <td class="${index === highestRatedIndex ? 'comparison-best-value' : ''}">
                                <div class="rating-stars">${getStarRating(plan.rating)}</div>
                                <strong>${plan.rating}/5</strong>
                            </td>
                        `).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Key Features</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Features</strong></td>
                        ${plans.map(plan => `
                            <td style="font-size: 0.9rem; line-height: 1.6;">
                                ${plan.features}
                            </td>
                        `).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Benefits</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Benefits</strong></td>
                        ${plans.map(plan => `
                            <td style="font-size: 0.9rem; line-height: 1.6;">
                                ${plan.benefits}
                            </td>
                        `).join('')}
                    </tr>
                   
                    <tr class="feature-row-label">
                        <td colspan="${plans.length + 1}"><strong>Exclusions</strong></td>
                    </tr>
                    <tr>
                        <td><strong>Exclusions</strong></td>
        ${plans.map(plan => `
                            <td style="font-size: 0.9rem; line-height: 1.6; color: var(--danger-color);">
                                ${plan.exclusions}
                            </td>
                        `).join('')}
                    </tr>
                </tbody>
            </table>
        </div>
       
        <h3 style="margin-top: 2rem; color: var(--primary-color);">Best Options Summary</h3>
        <div class="stats-grid" style="margin-top: 1rem;">
            <div class="stat-card">
                <div class="stat-icon green">
                    <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="stat-info">
                    <h4>Lowest Premium</h4>
                    <p>${comparison.best_options.lowest_premium.plan_name}</p>
                    <small style="color: var(--text-light);">${comparison.best_options.lowest_premium.plan_type}</small>
                    <strong>${formatCurrency(comparison.best_options.lowest_premium.personalized_premium)}/year</strong>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <div class="stat-info">
                    <h4>Highest Coverage</h4>
                    <p>${comparison.best_options.highest_coverage.plan_name}</p>
                    <small style="color: var(--text-light);">${comparison.best_options.highest_coverage.plan_type}</small>
                    <strong>${formatCurrency(comparison.best_options.highest_coverage.coverage_amount)}</strong>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h4>Best Claim Settlement</h4>
                    <p>${comparison.best_options.best_csr.plan_name}</p>
                    <small style="color: var(--text-light);">${comparison.best_options.best_csr.plan_type}</small>
                    <strong>${comparison.best_options.best_csr.claim_settlement_ratio}%</strong>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="background: linear-gradient(135deg, #ffc107, #ff9800);">
                    <i class="fas fa-star"></i>
                </div>
                <div class="stat-info">
                    <h4>Highest Rated</h4>
                    <p>${comparison.best_options.highest_rated.plan_name}</p>
                    <small style="color: var(--text-light);">${comparison.best_options.highest_rated.plan_type}</small>
                    <strong>${comparison.best_options.highest_rated.rating}/5 ⭐</strong>
                </div>
            </div>
        </div>
       
        ${isCrossCategory ? `
            <div class="comparison-insights" style="margin-top: 2rem; padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
                <h3 style="color: white; margin-bottom: 1rem;">
                    <i class="fas fa-lightbulb"></i> Comparison Insights
                </h3>
                <p style="margin-bottom: 0.5rem;">
                    <strong>Categories Compared:</strong> ${categories.join(', ')}
                </p>
                <p style="opacity: 0.95;">
                    You're comparing different types of insurance products. Each category serves different purposes:
                </p>
                <ul style="margin-top: 0.5rem; margin-left: 1.5rem; opacity: 0.95;">
                    ${categories.includes('Term Life') ? '<li><strong>Term Life:</strong> Pure protection, lowest cost, highest coverage</li>' : ''}
                    ${categories.includes('Whole Life') ? '<li><strong>Whole Life:</strong> Life-long coverage with maturity benefits</li>' : ''}
                    ${categories.includes('Endowment') ? '<li><strong>Endowment:</strong> Insurance + Savings with guaranteed returns</li>' : ''}
                    ${categories.includes('ULIP') ? '<li><strong>ULIP:</strong> Insurance + Market-linked investment</li>' : ''}
                    ${categories.includes('Health') ? '<li><strong>Health:</strong> Medical expenses and hospitalization coverage</li>' : ''}
                    ${categories.includes('Motor') ? '<li><strong>Motor:</strong> Vehicle insurance for cars/bikes</li>' : ''}
                    ${categories.includes('Travel') ? '<li><strong>Travel:</strong> Coverage for domestic/international trips</li>' : ''}
                </ul>
            </div>
        ` : ''}
       
        <div style="text-align: center; margin-top: 2rem;">
            <button class="btn btn-primary btn-large" onclick="document.getElementById('backToSelectionBtn').click()">
                <i class="fas fa-arrow-left"></i> Select Different Plans
            </button>
        </div>
    `;
};

// ============================================
// POLICIES PAGE
// ============================================
const loadPoliciesPage = async () => {
    try {
        const data = await apiRequest('/policies');
        const policiesDiv = document.getElementById('policiesList');
       
        if (data.policies.length === 0) {
            policiesDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-contract"></i>
                    <p>You don't have any policies yet.</p>
                    <button class="btn btn-primary" onclick="document.querySelector('.menu-item[data-page=\\'recommendations\\']').click()">
                        Get Recommendations
                    </button>
                </div>
            `;
            return;
        }
       
        policiesDiv.innerHTML = data.policies.map(policy => `
            <div class="policy-card">
                <div class="policy-header">
                    <div>
                        <div class="policy-number">${policy.policy_number}</div>
                        <div class="plan-provider">${policy.provider_name} - ${policy.plan_name}</div>
                    </div>
                    <span class="policy-status status-${policy.status.toLowerCase()}">${policy.status}</span>
                </div>
                <div class="policy-info">
                    <div class="detail-item">
                        <span class="detail-label">Plan Type</span>
                        <span class="detail-value">${policy.plan_type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Coverage Amount</span>
                        <span class="detail-value">${formatCurrency(policy.coverage_amount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Premium</span>
                        <span class="detail-value">${formatCurrency(policy.premium_amount)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Payment Frequency</span>
                        <span class="detail-value">${policy.payment_frequency}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Start Date</span>
                        <span class="detail-value">${new Date(policy.start_date).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">End Date</span>
                        <span class="detail-value">${new Date(policy.end_date).toLocaleDateString('en-IN')}</span>
                    </div>
                </div>
                <div class="plan-actions">
                    <button class="btn btn-primary" onclick="downloadPolicy(${policy.policy_id})">
                        <i class="fas fa-download"></i> Download PDF
                    </button>
                </div>
            </div>
        `).join('');
       
    } catch (error) {
        console.error('Error loading policies:', error);
    }
};

// ============================================
// PROFILE PAGE
// ============================================
const loadProfilePage = async () => {
    try {
        const profileForm = document.getElementById('profileForm');
        if (!profileForm) return;

        profileForm.onsubmit = async (e) => {
            e.preventDefault();
           
            const formData = {
                full_name: document.getElementById('full_name').value.trim(),
                phone: document.getElementById('phone').value,
                date_of_birth: document.getElementById('dob').value,
                gender: document.getElementById('gender').value,
                occupation: document.getElementById('occupation').value,
                annual_income: document.getElementById('income').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value
            };
           
            try {
                await updateProfile();
               
                // Update stored user
                const currentUser = getUser();
                setUser({ ...currentUser, ...formData });
               
                showSuccess('profileSuccess', 'Profile updated successfully!');
               
            } catch (error) {
                showError('profileError', error.message);
            }
        };
       
    } catch (error) {
        console.error('Error loading profile:', error);
    }
};

// ============================================
// ML PREDICTOR PAGE (Updated for Flask API)
// ============================================
const loadMLPredictorPage = async () => {
    try {
        const mlPredictorForm = document.getElementById('mlPredictorForm');
        const predictionResults = document.getElementById('predictionResults');
        const predictPremiumBtn = document.getElementById('predictPremiumBtn');
       
        // Initialize form handler
        mlPredictorForm.onsubmit = async (e) => {
            e.preventDefault();
           
            // Show loading state
            const originalBtnText = predictPremiumBtn.innerHTML;
            predictPremiumBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Predicting...';
            predictPremiumBtn.disabled = true;
           
            try {
                // Get form data
                const formData = {
                    age: parseInt(document.getElementById('predictorAge').value),
                    gender: document.getElementById('predictorGender').value,
                    coverage_amount: parseInt(document.getElementById('predictorCoverage').value),
                    plan_type: document.getElementById('predictorPlanType').value,
                    smoker: document.getElementById('predictorSmoker').value,
                    occupation_risk: document.getElementById('predictorOccupationRisk').value,
                    existing_conditions: document.getElementById('predictorExistingConditions').value,
                    policy_term: parseInt(document.getElementById('predictorPolicyTerm').value)
                };
               
                // Make API call to Flask ML endpoint
                const data = await apiRequest('/ml/predict/premium', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
               
                // Display results
                displayPredictionResults(data);
               
                // Show results section
                predictionResults.style.display = 'block';
               
            } catch (error) {
                console.error('Error predicting premium:', error);
                showMLPredictorError('Failed to predict premium. Please try again.');
            } finally {
                // Restore button state
                predictPremiumBtn.innerHTML = originalBtnText;
                predictPremiumBtn.disabled = false;
            }
        };
       
        // Pre-fill form with user data if available
        const user = getUser();
        if (user.date_of_birth) {
            const dob = new Date(user.date_of_birth);
            const age = new Date().getFullYear() - dob.getFullYear();
            document.getElementById('predictorAge').value = age || '';
        }
        if (user.gender) {
            document.getElementById('predictorGender').value = user.gender;
        }
        if (user.occupation) {
            // Set default occupation risk based on occupation
            if (['Doctor', 'Engineer', 'Teacher', 'Accountant'].includes(user.occupation)) {
                document.getElementById('predictorOccupationRisk').value = 'Low';
            } else if (['Sales', 'Marketing', 'Business'].includes(user.occupation)) {
                document.getElementById('predictorOccupationRisk').value = 'Medium';
            } else if (['Construction', 'Mining', 'Industrial'].includes(user.occupation)) {
                document.getElementById('predictorOccupationRisk').value = 'High';
            }
        }
       
        // Load feature importance
        loadFeatureImportance();
       
    } catch (error) {
        console.error('Error loading ML predictor:', error);
    }
};

// Load feature importance visualization
const loadFeatureImportance = async () => {
    try {
        const data = await apiRequest('/ml/features');
       
        if (data.success && data.feature_importance) {
            // You can add visualization here if needed
            console.log('Feature importance loaded:', data.feature_importance);
        }
    } catch (error) {
        console.error('Error loading feature importance:', error);
    }
};

// Display Prediction Results
const displayPredictionResults = (data) => {
    const predictedPremium = document.getElementById('predictedPremium');
    const predictedMonthly = document.getElementById('predictedMonthly');
    const confidenceLevel = document.getElementById('confidenceLevel');
    const predictionInsights = document.getElementById('predictionInsights');
   
    if (!data.success) {
        showMLPredictorError(data.error || 'Prediction failed');
        return;
    }
   
    // Format currency values
    const premiumValue = data.predicted_premium || 0;
    const monthlyValue = data.monthly_premium || 0;
   
    predictedPremium.textContent = formatCurrency(premiumValue);
    predictedMonthly.textContent = formatCurrency(monthlyValue);
    confidenceLevel.textContent = `${data.confidence || 95}%`;
   
    // Display insights
    if (data.insights && data.insights.length > 0) {
        predictionInsights.innerHTML = data.insights.map(insight =>
            `<li>${insight}</li>`
        ).join('');
    } else {
        predictionInsights.innerHTML = '<li>No specific insights available for this prediction.</li>';
    }
};

// Show ML Predictor Error
const showMLPredictorError = (message) => {
    const predictionResults = document.getElementById('predictionResults');
    predictionResults.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Prediction Error</h3>
            <p>${message}</p>
            <button class="btn btn-outline" onclick="location.reload()">
                <i class="fas fa-redo"></i> Try Again
            </button>
        </div>
    `;
    predictionResults.style.display = 'block';
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// View Plan Details
window.viewPlanDetails = async (planId) => {
    try {
        const data = await apiRequest(`/plans/${planId}`);
        const plan = data.plan;
       
        const content = document.getElementById('planDetailsContent');
        content.innerHTML = `
            <h2>${plan.plan_name}</h2>
            <p class="plan-provider"><strong>${plan.provider_name}</strong></p>
            <hr>
            <div class="plan-details">
                <div class="detail-item">
                    <span class="detail-label">Plan Type</span>
                    <span class="detail-value">${plan.plan_type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Base Premium</span>
                    <span class="detail-value">${formatCurrency(plan.base_premium)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Coverage Amount</span>
                    <span class="detail-value">${formatCurrency(plan.coverage_amount)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Policy Term</span>
                    <span class="detail-value">${plan.policy_term} years</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Age Range</span>
                    <span class="detail-value">${plan.min_age} - ${plan.max_age} years</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Claim Settlement Ratio</span>
                    <span class="detail-value">${plan.claim_settlement_ratio}%</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Rating</span>
                    <span class="detail-value">${plan.rating} / 5</span>
                </div>
            </div>
            <hr>
            <h3>Key Features</h3>
            <p>${plan.features}</p>
            <h3>Benefits</h3>
            <p>${plan.benefits}</p>
            <h3>Exclusions</h3>
            <p>${plan.exclusions}</p>
        `;
       
        openModal('planDetailsModal');
       
    } catch (error) {
        console.error('Error loading plan details:', error);
        alert('Failed to load plan details');
    }
};

// Close plan details modal
const closePlanDetailsModal = document.getElementById('closePlanDetailsModal');
if (closePlanDetailsModal) {
    closePlanDetailsModal.addEventListener('click', () => closeModal('planDetailsModal'));
}

// ============================================
// FRONTEND VALIDATION FOR PURCHASE FORM
// ============================================

// Enhanced validation function for purchase form
const validatePurchaseForm = () => {
    // Get form values
    const paymentFrequency = document.getElementById('paymentFrequency').value;
    const paymentType = document.getElementById('paymentType').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentInfo = document.getElementById('paymentInfo').value.trim();
    const nomineeName = document.getElementById('nomineeName').value.trim();
    const nomineeRelationship = document.getElementById('nomineeRelationship').value.trim();
    
    // Reset all error styles
    resetValidationStyles();
    
    let isValid = true;
    let errorMessages = [];
    
    // 1. Payment Frequency validation (MUST be selected)
    if (!paymentFrequency) {
        document.getElementById('paymentFrequency').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please select a payment frequency.');
        isValid = false;
    } else {
        document.getElementById('paymentFrequency').style.borderColor = 'var(--success-color)';
    }
    
    // 2. Payment Type validation (MUST be selected and sent separately)
    if (!paymentType) {
        document.getElementById('paymentType').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please select a payment type.');
        isValid = false;
    } else {
        document.getElementById('paymentType').style.borderColor = 'var(--success-color)';
        
        // Special validation for One-Time (Full Payment) scenario
        if (paymentFrequency === "One-Time (Full Payment)" && paymentType !== "One-Time") {
            errorMessages.push('For One-Time (Full Payment) frequency, payment type must be "One-Time".');
            isValid = false;
        }
    }
    
    // 3. Payment Method validation
    if (!paymentMethod) {
        document.getElementById('paymentMethod').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please select a payment method.');
        isValid = false;
    } else {
        document.getElementById('paymentMethod').style.borderColor = 'var(--success-color)';
    }
    
    // 4. Payment Info validation (demo only)
    if (!paymentInfo) {
        document.getElementById('paymentInfo').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please enter demo payment information.');
        isValid = false;
    } else {
        document.getElementById('paymentInfo').style.borderColor = 'var(--success-color)';
    }
    
    // 5. Nominee Name validation
    if (!nomineeName) {
        document.getElementById('nomineeName').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please enter nominee name.');
        isValid = false;
    } else {
        document.getElementById('nomineeName').style.borderColor = 'var(--success-color)';
    }
    
    // 6. Nominee Relationship validation
    if (!nomineeRelationship) {
        document.getElementById('nomineeRelationship').style.borderColor = 'var(--danger-color)';
        errorMessages.push('Please enter nominee relationship.');
        isValid = false;
    } else {
        document.getElementById('nomineeRelationship').style.borderColor = 'var(--success-color)';
    }
    
    // Show error messages if any
    if (!isValid) {
        const errorMessage = errorMessages.join('\n');
        alert('Validation Errors:\n' + errorMessage);
        
        // Focus on first invalid field
        if (!paymentFrequency) {
            document.getElementById('paymentFrequency').focus();
        } else if (!paymentType) {
            document.getElementById('paymentType').focus();
        } else if (!paymentMethod) {
            document.getElementById('paymentMethod').focus();
        } else if (!paymentInfo) {
            document.getElementById('paymentInfo').focus();
        } else if (!nomineeName) {
            document.getElementById('nomineeName').focus();
        } else if (!nomineeRelationship) {
            document.getElementById('nomineeRelationship').focus();
        }
    }
    
    return isValid;
};

// Reset all validation styles
const resetValidationStyles = () => {
    const fields = [
        'paymentFrequency',
        'paymentType',
        'paymentMethod',
        'paymentInfo',
        'nomineeName',
        'nomineeRelationship'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.style.borderColor = '';
        }
    });
};

// ============================================
// PAYMENT FORM VALIDATION (College Level)
// ============================================

// Simple validation for payment method and fake input
const validatePaymentForm = () => {
    // Get payment method value
    const paymentMethod = document.getElementById('paymentMethod').value.trim();
    const paymentInfo = document.getElementById('paymentInfo').value.trim();
    
    // Basic validation - payment method must be selected
    if (!paymentMethod) {
        alert('Please select a payment method.');
        return false;
    }
    
    // Basic validation - fake payment info must not be empty
    if (!paymentInfo) {
        alert('Please enter some demo payment information.');
        return false;
    }
    
    // Optional: Show validation feedback in the UI
    showValidationFeedback();
    
    return true;
};

// Show validation feedback (college-level visual feedback)
const showValidationFeedback = () => {
    const paymentMethod = document.getElementById('paymentMethod');
    const paymentInfo = document.getElementById('paymentInfo');
    
    // Reset any previous feedback
    paymentMethod.style.borderColor = '';
    paymentInfo.style.borderColor = '';
    
    // Apply visual feedback based on validation
    if (paymentMethod.value.trim() === '') {
        paymentMethod.style.borderColor = 'var(--danger-color)';
        paymentMethod.focus();
    } else if (paymentInfo.value.trim() === '') {
        paymentInfo.style.borderColor = 'var(--danger-color)';
        paymentInfo.focus();
    } else {
        // Both fields are valid
        paymentMethod.style.borderColor = 'var(--success-color)';
        paymentInfo.style.borderColor = 'var(--success-color)';
    }
};

// Purchase Plan with Mock Payment Integration and Validation
window.purchasePlan = (planId, premium, coverage) => {
    const content = document.getElementById('purchaseFormContent');
    content.innerHTML = `
        <form id="purchaseForm">
            <div class="form-group">
                <label>Premium Amount (Annual)</label>
                <input type="text" value="${formatCurrency(premium)}" disabled>
            </div>
            <div class="form-group">
                <label>Coverage Amount</label>
                <input type="text" value="${formatCurrency(coverage)}" disabled>
            </div>
            <div class="form-group">
                <label for="paymentFrequency">Payment Frequency *</label>
                <select id="paymentFrequency" required>
                    <option value="">Select Frequency</option>
                    <option value="Yearly">Yearly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="One-Time (Full Payment)">One-Time (Full Payment)</option>
                </select>
                <small class="form-hint">Required field</small>
            </div>
            <div class="form-group">
                <label for="nomineeName">Nominee Name *</label>
                <input type="text" id="nomineeName" required>
                <small class="form-hint">Required field</small>
            </div>
            <div class="form-group">
                <label for="nomineeRelationship">Nominee Relationship *</label>
                <input type="text" id="nomineeRelationship" required>
                <small class="form-hint">Required field</small>
            </div>
            
            <!-- Mock Payment Section (College Demo Only) -->
            <div class="form-section" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                <h3 style="margin-bottom: 1rem; color: #333; font-size: 1.1rem;">
                    <i class="fas fa-credit-card"></i> Payment Method (Demo)
                </h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="paymentMethod">Select Payment Method *</label>
                        <select id="paymentMethod" name="payment_method" required>
                            <option value="">Select Method</option>
                            <option value="Card">Credit / Debit Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Wallet">Wallet</option>
                            
                        </select>
                        <small class="form-hint">Required field</small>
                    </div>
                    <div class="form-group">
                        <label for="paymentType">Payment Type *</label>
                        <select id="paymentType" name="payment_type" required>
                            <option value="">Select Type</option>
                            <option value="One-Time">One-Time Payment</option>
                            <option value="Recurring">Recurring Payment</option>
                        </select>
                        <small class="form-hint">Required field. This will be sent separately from frequency.</small>
                    </div>
                </div>
                <div class="form-group">
                    <label for="paymentInfo">Payment Information (Fake for Demo) *</label>
                    <input type="text" id="paymentInfo" name="payment_info" 
                           placeholder="Enter any demo info (not validated)">
                    <small class="form-hint" style="color: #666; font-size: 0.85rem;">
                        This is for demonstration only. No real payment processing. Required field.
                    </small>
                </div>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.5rem;">
                <i class="fas fa-check"></i> Confirm Purchase
            </button>
        </form>
    `;
   
    openModal('purchaseModal');
   
    document.getElementById('purchaseForm').onsubmit = async (e) => {
        e.preventDefault();
       
        // ============================================
        // ENHANCED VALIDATION CHECK
        // ============================================
        if (!validatePurchaseForm()) {
            return; // Stop if validation fails
        }
        
        const paymentMethod = document.getElementById('paymentMethod').value;
        const paymentInfo = document.getElementById('paymentInfo').value.trim();
        
        // ============================================
        // FIX: NORMALIZE PAYMENT FREQUENCY VALUE
        // ============================================
        const paymentFrequency = document.getElementById('paymentFrequency').value;
        const paymentType = document.getElementById('paymentType').value;
        
        // Normalize payment frequency for database ENUM compatibility
        let normalizedPaymentFrequency = paymentFrequency;
        let paymentIntent = paymentType; // Use existing payment_type field
        
        // If payment frequency is "One-Time (Full Payment)", send "Yearly" to backend
        // but indicate one-time intent via payment_type field
        if (paymentFrequency === "One-Time (Full Payment)") {
            normalizedPaymentFrequency = "Yearly";
            paymentIntent = "One-Time"; // Override payment_type to indicate one-time intent
        }
       
        const purchaseData = {
            plan_id: planId,
            premium_amount: premium,
            coverage_amount: coverage,
            payment_frequency: normalizedPaymentFrequency, // Use normalized value
            nominee_name: document.getElementById('nomineeName').value,
            nominee_relationship: document.getElementById('nomineeRelationship').value,
            payment_type: paymentIntent // Send payment intent separately
        };
       
        try {
            // Step 1: Create the policy first
            const policyData = await apiRequest('/policies', {
                method: 'POST',
                body: JSON.stringify(purchaseData)
            });
           
            const policyId = policyData.policy_id;
            const policyNumber = policyData.policy_number;
           
            // Step 2: Process mock payment
            // Payment method is already validated above
            const paymentData = {
                policy_id: policyId,
                payment_method: paymentMethod,
                payment_type: paymentIntent // Use the payment intent
            };
            
            // Call mock payment API
            const paymentResult = await apiRequest('/payments/process', {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
            
            if (!paymentResult.success) {
                throw new Error('Payment processing failed: ' + (paymentResult.error || 'Unknown error'));
            }
           
            closeModal('purchaseModal');
            
            // Show success message with payment details
            const successMessage = `
                ✅ Policy created successfully!
                
                Policy Number: ${policyNumber}
                Transaction ID: ${paymentResult.transaction_id}
                Payment Method: ${paymentResult.payment_method}
                Payment Type: ${paymentResult.payment_type}
                Payment Status: ${paymentResult.payment_status}
                Policy Status: ${paymentResult.policy_status}
                
                ✅ Mock payment processed successfully!
            `;
            
            alert(successMessage);
           
            // Step 3: Download PDF receipt (existing PDF generation logic continues)
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE_URL}/policies/${policyId}/pdf`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
               
                if (!response.ok) {
                    throw new Error('Failed to generate PDF receipt');
                }
               
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `policy_${policyNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
               
                console.log('PDF receipt downloaded successfully');
                
            } catch (pdfError) {
                console.error('Error downloading PDF:', pdfError);
                // Don't show error to user - PDF generation is secondary
            }
           
            // Redirect to policies page
            document.querySelector('.menu-item[data-page="policies"]').click();
           
        } catch (error) {
            console.error('Error in purchase flow:', error);
            alert('Failed to complete purchase: ' + error.message);
        }
    };
};

// Close purchase modal
const closePurchaseModal = document.getElementById('closePurchaseModal');
if (closePurchaseModal) {
    closePurchaseModal.addEventListener('click', () => closeModal('purchaseModal'));
}

// Download Policy PDF
window.downloadPolicy = async (policyId) => {
    try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/policies/${policyId}/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
       
        if (!response.ok) {
            throw new Error('Failed to download policy');
        }
       
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `policy_${policyId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
       
    } catch (error) {
        console.error('Error downloading policy:', error);
        alert('Failed to download policy PDF');
    }
};

// Helper: Generate Star Rating
const getStarRating = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
   
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
   
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
   
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
   
    return stars;
};

// ============================================
// PROFILE AUTO-FILL ON EVERY PAGE LOAD
// ============================================
async function autoFillProfileOnEveryVisit() {
    try {
        // Get user_id from localStorage
        const user = getUser();
        const user_id = user.user_id || localStorage.getItem('user_id');
        
        if (!user_id) {
            console.warn('No user_id found for auto-fill');
            return;
        }
        
        // Call GET /api/profile endpoint
        const response = await fetch(`http://localhost:5000/api/profile?user_id=${user_id}`);
        
        if (!response.ok) {
            console.error('Failed to fetch profile for auto-fill:', response.statusText);
            return;
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
            const profile = data.user;
            
            console.log('Profile auto-filled on page load:', profile);
            
            // Populate ALL profile fields from the API response
            // Map backend fields to frontend input IDs
            const fieldMappings = [
                { backend: 'full_name', frontend: 'profileFullName' },
                { backend: 'email', frontend: 'profileEmail' },
                { backend: 'phone', frontend: 'profilePhone' },
                { backend: 'date_of_birth', frontend: 'dateOfBirth' },
                { backend: 'gender', frontend: 'profileGender' },
                { backend: 'occupation', frontend: 'profileOccupation' },
                { backend: 'annual_income', frontend: 'profileIncome' },
                { backend: 'city', frontend: 'profileCity' },
                { backend: 'state', frontend: 'profileState' },
                { backend: 'pincode', frontend: 'profilePincode' }
            ];
            
            // Populate each field if the element exists
            fieldMappings.forEach(mapping => {
                const element = document.getElementById(mapping.frontend);
                if (element && profile[mapping.backend] !== undefined) {
                    // Ensure email, full_name, and phone are always set (even if empty string)
                    element.value = profile[mapping.backend] || '';
                }
            });
            
            // Populate the IDs used by the profile form in dashboard.html.
            const altMappings = [
                { backend: 'full_name', frontend: 'full_name' },
                { backend: 'email', frontend: 'email' },
                { backend: 'phone', frontend: 'phone' },
                { backend: 'date_of_birth', frontend: 'dob' },
                { backend: 'gender', frontend: 'gender' },
                { backend: 'occupation', frontend: 'occupation' },
                { backend: 'annual_income', frontend: 'income' },
                { backend: 'city', frontend: 'city' },
                { backend: 'state', frontend: 'state' },
                { backend: 'pincode', frontend: 'pincode' }
            ];
            
            altMappings.forEach(mapping => {
                const element = document.getElementById(mapping.frontend);
                if (element && profile[mapping.backend] !== undefined) {
                    element.value = profile[mapping.backend] || '';
                }
            });
            
            // Update welcome message
            const dashboardUserName = document.getElementById('dashboardUserName');
            if (dashboardUserName && profile.full_name) {
                dashboardUserName.textContent = `Welcome, ${profile.full_name}`;
            }
            
            console.log('Profile auto-filled successfully on page load');
        }
        
    } catch (error) {
        console.error('Error auto-filling profile on page load:', error);
        // Don't show error to user - this runs silently in background
    }
}

// ============================================
// INITIALIZE DASHBOARD
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // ✅ AUTO-FILL PROFILE ON EVERY PAGE LOAD
    autoFillProfileOnEveryVisit();
    
    // ✅ Load user profile data on page load
    // ✅ Initialize profile auto-load for profile page
    // This ensures the profile page gets fresh data every time it's loaded
    const profileMenuItem = document.querySelector('.menu-item[data-page="profile"]');
    if (profileMenuItem) {
        profileMenuItem.addEventListener('click', () => {
            // Small delay to ensure page is visible before loading
            setTimeout(() => {
                loadProfileOnPageVisit();
            }, 100);
        });
    }
    
    // Load initial overview data
    loadOverviewData();
});

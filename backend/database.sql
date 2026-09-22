-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE orbit_insurance;
USE orbit_insurance;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(15),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    occupation VARCHAR(100),
    annual_income DECIMAL(12, 2),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    auth_provider ENUM('email', 'google') DEFAULT 'email',
    google_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_google_id (google_id)
);

-- ============================================
-- INSURANCE PLANS TABLE
-- ============================================
CREATE TABLE insurance_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    provider_name VARCHAR(100) NOT NULL,
    plan_name VARCHAR(150) NOT NULL,
    plan_type ENUM('Term Life', 'Whole Life', 'Endowment', 'ULIP', 'Health', 'Motor', 'Travel') NOT NULL,
    base_premium DECIMAL(10, 2) NOT NULL,
    coverage_amount DECIMAL(12, 2) NOT NULL,
    policy_term INT NOT NULL,
    min_age INT NOT NULL,
    max_age INT NOT NULL,
    min_income DECIMAL(12, 2),
    features TEXT,
    benefits TEXT,
    exclusions TEXT,
    claim_settlement_ratio DECIMAL(5, 2),
    rating DECIMAL(3, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_provider (provider_name),
    INDEX idx_plan_type (plan_type)
);

-- ============================================
-- USER RECOMMENDATIONS TABLE
-- ============================================
CREATE TABLE user_recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    recommended_premium DECIMAL(10, 2) NOT NULL,
    match_score DECIMAL(5, 2),
    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES insurance_plans(plan_id) ON DELETE CASCADE,
    INDEX idx_user_recommendations (user_id)
);

-- ============================================
-- USER POLICIES TABLE
-- ============================================
CREATE TABLE user_policies (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    premium_amount DECIMAL(10, 2) NOT NULL,
    coverage_amount DECIMAL(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Pending', 'Expired', 'Cancelled') DEFAULT 'Pending',
    payment_frequency ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time') DEFAULT 'Yearly',
    payment_type ENUM('One-Time', 'Recurring') DEFAULT 'Recurring',
    payment_status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',  -- ✅ CORRECT ENUM VALUES
    nominee_name VARCHAR(100),
    nominee_relationship VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES insurance_plans(plan_id) ON DELETE CASCADE,
    INDEX idx_user_policies (user_id),
    INDEX idx_policy_number (policy_number)
);

-- ============================================
-- MOCK PAYMENTS TABLE (For College Demonstration)
-- ============================================
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    policy_id INT NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('Card', 'UPI', 'Wallet', 'COD') NOT NULL,
    payment_type ENUM('One-Time', 'Recurring') DEFAULT 'One-Time',
    status ENUM('Pending', 'Success', 'Failed', 'Refunded') DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (policy_id) REFERENCES user_policies(policy_id) ON DELETE CASCADE,
    INDEX idx_user_payments (user_id),
    INDEX idx_policy_payments (policy_id),
    INDEX idx_transaction_id (transaction_id),
    INDEX idx_status (status)
);

-- ============================================
-- PLAN COMPARISONS TABLE
-- ============================================
CREATE TABLE plan_comparisons (
    comparison_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_ids JSON NOT NULL,
    compared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================
-- BACKEND FIX EXAMPLE (For app.py)
-- ============================================
-- In your Flask backend code (app.py), ensure you use exact ENUM values:
-- 
-- CORRECT:
-- payment_status = "SUCCESS"  # Exact match to ENUM
-- 
-- INCORRECT:
-- payment_status = "Payment Successful"
-- payment_status = "Paid"
-- payment_status = "Completed"
-- payment_status = "success"  # Wrong case
-- payment_status = "Success"  # Wrong case

-- ============================================
-- INSERT 161 INSURANCE PLANS
-- ============================================
-- Sample insurance plans data would go here


-- ============================================
-- TERM LIFE INSURANCE PLANS (37 plans)
-- ============================================

-- LIC Term Life Plans (7 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Life Insurance Corporation of India (LIC)', 'LIC Tech Term', 'Term Life', 8500.00, 5000000.00, 20, 18, 65, 250000.00, 'Pure term insurance, Online discount, Flexible premium payment, Return of premium option', 'Death benefit up to ₹50 Lakh, Tax benefits u/s 80C & 10(10D), Accidental death benefit rider, Critical illness rider available', 'Suicide within first year, Self-inflicted injuries, War and nuclear risks, Pre-existing terminal illness', 98.50, 4.6),
('Life Insurance Corporation of India (LIC)', 'LIC Anmol Jeevan II', 'Term Life', 6500.00, 2500000.00, 15, 18, 60, 200000.00, 'Affordable term plan, Death benefit, Simple application, Quick claim settlement', 'Death benefit, Accidental death benefit, Tax savings, Nominee protection', 'Suicide in first year, Death due to intoxication, Criminal activities', 98.50, 4.5),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Amar', 'Term Life', 12000.00, 10000000.00, 30, 18, 65, 400000.00, 'High coverage term plan, Level coverage, Premium payment options, Life cover up to 1 Cr', 'High sum assured, Tax benefits, Flexible premium payment, Family protection', 'Pre-existing terminal conditions, Hazardous occupation death, Non-disclosure of facts', 98.50, 4.7),
('Life Insurance Corporation of India (LIC)', 'LIC Saral Jeevan Bima', 'Term Life', 5500.00, 1000000.00, 10, 18, 65, 150000.00, 'Simple term plan, Standard features, Easy to understand, Low premium', 'Death benefit, Simple terms, Affordable premium, Tax benefits', 'Suicide within first year, Death due to substance abuse', 98.50, 4.4),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Labh', 'Term Life', 15000.00, 15000000.00, 35, 21, 65, 500000.00, 'Premium term coverage, High sum assured, Long tenure, Comprehensive protection', 'Death benefit up to 1.5 Cr, Maturity benefit option, Tax advantages, Loan facility', 'Suicide in first year, Criminal death, Pre-existing critical illness', 98.50, 4.8),
('Life Insurance Corporation of India (LIC)', 'LIC Navjeevan Plan', 'Term Life', 11200.00, 9000000.00, 25, 18, 60, 380000.00, 'Comprehensive term insurance, Family protection, Affordable rates, Flexible terms', 'Death benefit, Accidental benefit, Tax efficiency, Nominee security', 'Self-harm, Intoxication-related death, Fraudulent claims', 98.50, 4.6),
('Life Insurance Corporation of India (LIC)', 'LIC Basic Term Shield', 'Term Life', 4500.00, 1000000.00, 10, 18, 60, 150000.00, 'Budget term plan, Basic life coverage, Simple terms, Low premium', 'Affordable life protection, Tax benefits, Simple application, Quick claim', 'Suicide within first year, Material non-disclosure, War risks', 98.50, 4.3),

-- SBI Life Term Plans (6 plans)
('SBI Life Insurance', 'SBI eShield Next', 'Term Life', 8600.00, 5000000.00, 20, 18, 65, 250000.00, 'Online term plan, Return of premium option, High coverage, Flexible premium payment', 'Death benefit up to 50L, Tax benefits u/s 80C, Return of premium option, Accidental death rider', 'Suicide in first year, Alcohol/drug abuse related death, Pre-existing terminal conditions, War risks', 96.30, 4.6),
('SBI Life Insurance', 'SBI Life Smart Shield', 'Term Life', 10200.00, 7500000.00, 25, 18, 65, 300000.00, 'Smart term insurance, Enhanced coverage, Income benefit, Critical illness', 'Life cover up to 75L, Income benefit option, Critical illness rider, Tax savings', 'Suicide within first year, Material non-disclosure, Hazardous activities, Criminal death', 96.30, 4.7),
('SBI Life Insurance', 'SBI Life Poorna Suraksha', 'Term Life', 12800.00, 10000000.00, 30, 18, 65, 400000.00, 'Complete protection, High sum assured, Multiple benefits, Comprehensive riders', 'Coverage up to 1 Cr, Return of premium variant, Tax benefits, All major riders', 'Pre-existing terminal illness, Suicide, War and terrorism, Fraud', 96.30, 4.8),
('SBI Life Insurance', 'SBI Life Shield Plus', 'Term Life', 7100.00, 3500000.00, 15, 18, 60, 200000.00, 'Basic term plan, Affordable premium, Pure protection, Simple structure', 'Life coverage, Tax advantages, Simple terms, Quick claim process', 'Suicide in first year, Death due to intoxication, Hazardous occupation', 96.30, 4.5),
('SBI Life Insurance', 'SBI Life Shield Supreme', 'Term Life', 15800.00, 15000000.00, 35, 21, 65, 500000.00, 'Supreme protection plan, Highest coverage, All benefits, Premium service', 'Coverage up to 1.5 Cr, All major riders, Tax efficiency, Priority claim settlement', 'Non-disclosure, War and riot, Terminal conditions, Suicide', 96.30, 4.8),
('SBI Life Insurance', 'SBI Budget Shield', 'Term Life', 4800.00, 1200000.00, 10, 18, 60, 160000.00, 'Budget-friendly term, Basic protection, Low premium, Tax benefits', 'Life coverage 12L, Tax advantages, Simple process, Affordable rates', 'Suicide, Material non-disclosure, War and terrorism', 96.30, 4.3),

-- HDFC Life Term Plans (7 plans)
('HDFC Life Insurance', 'HDFC Click 2 Protect Life', 'Term Life', 8200.00, 5000000.00, 20, 18, 65, 250000.00, 'Online term plan, Instant policy, Life coverage, Income benefit option', 'High sum assured, Affordable premiums, Tax benefits u/s 80C, Flexible payout options', 'Suicide within first year, Pre-existing terminal illness, Death due to adventure sports', 98.00, 4.6),
('HDFC Life Insurance', 'HDFC Click 2 Protect Plus', 'Term Life', 9800.00, 7500000.00, 25, 18, 65, 300000.00, 'Enhanced term plan, Return of premium, Increasing cover, Multiple rider options', 'Life cover up to 75L, Premium return option, Tax savings, Accidental death benefit', 'Suicide in first year, Criminal activities, War risks, Material non-disclosure', 98.00, 4.7),
('HDFC Life Insurance', 'HDFC Click 2 Protect 3D Plus', 'Term Life', 11500.00, 10000000.00, 30, 18, 65, 400000.00, 'Advanced protection, Life + Critical illness, Income benefit, Increasing cover', 'Triple benefit plan, Critical illness cover, Income benefit to family, Tax advantages', 'Pre-existing diseases (critical), Self-inflicted injuries, Hazardous activities', 98.00, 4.8),
('HDFC Life Insurance', 'HDFC Click 2 Protect Super', 'Term Life', 7500.00, 4000000.00, 15, 18, 60, 200000.00, 'Budget term plan, Pure protection, Quick issuance, Simple terms', 'Affordable life cover, Tax benefits, Online purchase discount, Fast claim settlement', 'Suicide within 12 months, Death due to illegal activities, Non-disclosure of health', 98.00, 4.5),
('HDFC Life Insurance', 'HDFC Life Pragati', 'Term Life', 6800.00, 3000000.00, 12, 18, 60, 180000.00, 'Entry-level term plan, Simple structure, Affordable premium, Easy claim', 'Basic life protection, Tax savings, Nominee benefits, Low cost coverage', 'Self-harm, Intoxication, Criminal death, Non-disclosure', 98.00, 4.4),
('HDFC Life Insurance', 'HDFC Click 2 Protect Optima', 'Term Life', 10200.00, 8500000.00, 25, 18, 65, 350000.00, 'Optimal coverage plan, Life + health, Income replacement, Flexible options', 'Comprehensive protection, Health benefits, Income continuity, Tax benefits', 'Material misrepresentation, Excluded medical conditions, War and terrorism', 98.00, 4.7),
('HDFC Life Insurance', 'HDFC Starter Term', 'Term Life', 5200.00, 1500000.00, 12, 18, 60, 180000.00, 'Starter term insurance, Entry-level coverage, Affordable premium, Simple benefits', 'Life cover 15L, Tax savings, Easy application, Low cost', 'Suicide in first year, Pre-existing conditions, War risks', 98.00, 4.4),

-- ICICI Prudential Term Plans (6 plans)
('ICICI Prudential Life Insurance', 'ICICI Pru iProtect Smart', 'Term Life', 8800.00, 5000000.00, 20, 18, 65, 250000.00, 'Smart term plan, Return of premium option, Life cover, Multiple riders', 'Life protection, Tax benefits, Return of premium variant, Accidental death benefit', 'Suicide in first year, Hazardous occupation death, Pre-existing terminal illness, War risks', 97.80, 4.6),
('ICICI Prudential Life Insurance', 'ICICI Pru iProtect Platinum', 'Term Life', 11500.00, 10000000.00, 30, 18, 65, 400000.00, 'Platinum protection, High coverage, Income benefit, Premium waiver', 'Coverage up to 1 Cr, Income benefit option, Tax advantages, Waiver of premium rider', 'Material non-disclosure, Suicide, Death in excluded zones, Criminal death', 97.80, 4.8),
('ICICI Prudential Life Insurance', 'ICICI Pru iProtect Secure', 'Term Life', 7200.00, 3500000.00, 15, 18, 60, 200000.00, 'Secure term plan, Affordable rates, Pure protection, Quick claim', 'Life coverage, Tax savings, Simple terms, Fast settlement', 'Suicide within policy start, Intoxication, Hazardous activities', 97.80, 4.5),
('ICICI Prudential Life Insurance', 'ICICI Pru iProtect Gold', 'Term Life', 9500.00, 7500000.00, 25, 18, 65, 320000.00, 'Gold term insurance, Enhanced benefits, Critical illness, Flexible tenure', 'High sum assured, Critical illness benefit, Tax efficiency, Nominee protection', 'Pre-existing diseases, Self-inflicted harm, War and terrorism, Fraud', 97.80, 4.7),
('ICICI Prudential Life Insurance', 'ICICI Pru Elite Protect', 'Term Life', 17800.00, 18000000.00, 35, 25, 65, 750000.00, 'Elite protection term, High coverage 1.8 Cr, Comprehensive riders, Premium service', 'Coverage up to 1.8 Cr, Income + life cover, Tax efficiency, Elite claim service', 'Material misrepresentation, Suicide, Excluded medical conditions, War', 97.80, 4.8),
('ICICI Prudential Life Insurance', 'ICICI Pru Easy Protect', 'Term Life', 6500.00, 2500000.00, 12, 18, 60, 180000.00, 'Easy term plan, Simple process, Low premium, Basic coverage', 'Affordable protection, Tax savings, Simple application, Quick issuance', 'Self-harm, Criminal death, Material misrepresentation', 97.80, 4.4),

-- Axis Max Life Term Plans (6 plans)
('Axis Max Life Insurance', 'Axis Max Life Smart Term Plan', 'Term Life', 9200.00, 6000000.00, 20, 18, 65, 280000.00, 'Online term plan, Life coverage, Increasing cover option, Critical illness cover', 'Affordable protection, Tax savings u/s 80C, Flexible coverage options, Rider benefits', 'Suicide within first year, Pre-existing critical conditions, War risks, Fraudulent claims', 96.50, 4.5),
('Axis Max Life Insurance', 'Axis Max Life Online Term Pro', 'Term Life', 11800.00, 8500000.00, 25, 18, 65, 350000.00, 'Professional term plan, Enhanced coverage, Return of premium, Income benefit', 'Life cover 85L, Premium return option, Tax benefits, Multiple riders', 'Material non-disclosure, Suicide, Hazardous activities, Criminal death', 96.50, 4.6),
('Axis Max Life Insurance', 'Axis Max Life Shield Secure', 'Term Life', 13500.00, 11000000.00, 30, 21, 65, 420000.00, 'Secure shield plan, High coverage, Comprehensive protection, Family income', 'Coverage up to 1.1 Cr, Income benefit option, Tax advantages, All major riders', 'Pre-existing terminal illness, Suicide, War and terrorism, Fraud', 96.50, 4.7),
('Axis Max Life Insurance', 'Axis Smart Secure Plus', 'Term Life', 8900.00, 5000000.00, 20, 18, 65, 250000.00, 'Smart term plan, Life coverage, Return of premium, Increasing cover option', 'Life protection up to 50L, Tax benefits, Flexible options, Comprehensive riders', 'Suicide in first year, Fraudulent claims, Pre-existing terminal illness, War risks', 96.50, 4.7),
('Axis Max Life Insurance', 'Axis Protect Plus', 'Term Life', 7500.00, 3500000.00, 15, 18, 60, 200000.00, 'Basic protection plan, Affordable rates, Pure term cover, Simple benefits', 'Life coverage 35L, Tax benefits, Quick claim, Simple application', 'Self-harm, Intoxication death, Material misrepresentation', 96.50, 4.5),
('Axis Max Life Insurance', 'Axis Premier Term', 'Term Life', 14800.00, 12500000.00, 30, 21, 65, 450000.00, 'Premier term insurance, Maximum coverage, All riders, Comprehensive benefits', 'Coverage up to 1.25 Cr, All risk protection, Tax efficiency, Maturity option', 'Non-disclosure, Suicide, Excluded medical conditions, War risks', 96.50, 4.8),

-- Aditya Birla Sun Life Term Plans (5 plans)
('Aditya Birla Sun Life Insurance', 'ABSLI Digi Shield Plan', 'Term Life', 8800.00, 5500000.00, 20, 18, 65, 270000.00, 'Digital term plan, Pure protection, Flexible premium options, Critical illness option', 'High sum assured, Affordable rates, Tax benefits u/s 80C, Online convenience', 'Suicide within first year, Material non-disclosure, War risks, Pre-existing diseases', 96.80, 4.5),
('Aditya Birla Sun Life Insurance', 'ABSLI Protect@Ease', 'Term Life', 10500.00, 7500000.00, 25, 18, 65, 320000.00, 'Easy protection plan, Life coverage, Return premium option, Enhanced riders', 'Life cover 75L, Premium return choice, Tax savings, Critical illness rider', 'Material misrepresentation, Suicide, Hazardous occupation, Criminal activities', 96.80, 4.6),
('Aditya Birla Sun Life Insurance', 'ABSLI Life Shield', 'Term Life', 12500.00, 10000000.00, 30, 18, 65, 400000.00, 'Comprehensive shield, High coverage, Multiple benefits, Family protection', 'Coverage up to 1 Cr, Income benefit option, Tax advantages, All riders', 'Pre-existing terminal illness, Suicide, War and terrorism, Fraud', 96.80, 4.7),
('Aditya Birla Sun Life Insurance', 'ABSLI Smart Protect', 'Term Life', 7200.00, 3500000.00, 15, 18, 60, 200000.00, 'Smart protection, Affordable term plan, Quick issuance, Simple terms', 'Life coverage 35L, Tax benefits, Fast claim settlement, Low premium', 'Suicide in first year, Death due to intoxication, Non-disclosure', 96.80, 4.4),
('Aditya Birla Sun Life Insurance', 'ABSLI Premier Term', 'Term Life', 16500.00, 15000000.00, 35, 21, 65, 500000.00, 'Premier term solution, Highest coverage, Comprehensive riders, Priority service', 'Coverage up to 1.5 Cr, All risk protection, Tax efficiency, Premium claims', 'Non-disclosure, Suicide, Terminal conditions, War risks', 96.80, 4.8);

-- ============================================
-- WHOLE LIFE INSURANCE PLANS (29 plans)
-- ============================================

-- LIC Whole Life Plans (5 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Umang', 'Whole Life', 24000.00, 5000000.00, 25, 18, 55, 400000.00, 'Whole life coverage up to 100 years, Maturity benefit, Bonus accumulation, Loan facility', 'Life coverage till 100 years, Guaranteed maturity benefit, Death benefit, Bonus accrual, Tax benefits', 'Death due to war, Nuclear weapons exposure, Pre-existing conditions not disclosed, Criminal activities', 98.50, 4.7),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Tarun', 'Whole Life', 28000.00, 7500000.00, 30, 21, 55, 500000.00, 'Long-term whole life plan, High coverage, Guaranteed additions, Wealth creation', 'Coverage till 100, Maturity benefits, Guaranteed additions, Tax advantages, Loan available', 'War risks, Material non-disclosure, Criminal death, Terminal illness', 98.50, 4.8),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Shiromani', 'Whole Life', 32000.00, 10000000.00, 35, 21, 55, 600000.00, 'Premium whole life, Maximum coverage, Comprehensive benefits, Wealth builder', 'Life-long protection, High maturity value, Bonus benefits, Tax efficiency', 'Suicide, War and terrorism, Fraudulent claims, Pre-existing critical illness', 98.50, 4.8),
('Life Insurance Corporation of India (LIC)', 'LIC Whole Life Guardian', 'Whole Life', 26000.00, 6000000.00, 25, 18, 55, 450000.00, 'Guardian whole life plan, Life coverage, Guaranteed benefits, Family security', 'Coverage till 100, Death and maturity benefits, Tax savings, Loan facility', 'Non-disclosure, War risks, Criminal activities, Terminal conditions', 98.50, 4.7),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Akshay VI', 'Whole Life', 45000.00, 5000000.00, 20, 30, 85, 300000.00, 'Senior citizen annuity, Immediate pension, Life-long income, No medical test', 'Immediate annuity, Life-long pension, Various payout options, Tax benefits', 'Death during annuity (terms apply), War risks, Material non-disclosure', 98.50, 4.7),

-- SBI Life Whole Life Plans (5 plans)
('SBI Life Insurance', 'SBI Life Shubh Nivesh', 'Whole Life', 27000.00, 7000000.00, 25, 18, 55, 480000.00, 'Auspicious investment + life cover, Guaranteed returns, Maturity benefit, Tax savings', 'Life coverage + returns, Maturity benefits, Tax advantages, Loan facility', 'Material misrepresentation, Suicide, War risks, Criminal activities', 96.30, 4.6),
('SBI Life Insurance', 'SBI Life Sampoorna Suraksha', 'Whole Life', 30000.00, 8500000.00, 30, 21, 55, 530000.00, 'Complete protection whole life, High coverage, Guaranteed benefits, Wealth creation', 'Coverage till 100, Maturity benefits, Bonus accumulation, Tax efficiency', 'Non-disclosure, War and riot, Terminal conditions, Fraud', 96.30, 4.7),
('SBI Life Insurance', 'SBI Life Retire Smart', 'Whole Life', 48000.00, 6000000.00, 25, 30, 70, 350000.00, 'Retirement planning, Pension + life cover, Guaranteed income, Tax benefits', 'Regular pension, Life coverage, Guaranteed payouts, Tax advantages', 'Non-payment of premiums, War risks, Material misrepresentation', 96.30, 4.6),
('SBI Life Insurance', 'SBI Whole Life Advantage', 'Whole Life', 29000.00, 7500000.00, 30, 18, 55, 500000.00, 'Advantageous whole life, Life coverage, Guaranteed additions, Wealth building', 'Coverage till 100, Guaranteed benefits, Tax savings, Loan available', 'Suicide, Non-disclosure, War and terrorism, Criminal acts', 96.30, 4.7),
('SBI Life Insurance', 'SBI Life Forever Secure', 'Whole Life', 33000.00, 9000000.00, 30, 21, 55, 550000.00, 'Secure whole life plan, High coverage, Maturity benefits, Comprehensive protection', 'Life-long coverage, High maturity value, Bonus benefits, Tax efficiency', 'Material misrepresentation, War risks, Terminal illness, Fraud', 96.30, 4.7),

-- HDFC Life Whole Life Plans (5 plans)
('HDFC Life Insurance', 'HDFC Sanchay Plus', 'Whole Life', 25000.00, 6000000.00, 25, 18, 55, 450000.00, 'Guaranteed returns whole life, Life coverage, Bonus benefits, Loan facility', 'Life-long coverage, Guaranteed additions, Death benefit, Maturity benefit, Tax advantages', 'Non-disclosure of material facts, Criminal acts, War risks, Suicide in first year', 98.00, 4.6),
('HDFC Life Insurance', 'HDFC Whole Life Plus', 'Whole Life', 29000.00, 8000000.00, 30, 21, 55, 520000.00, 'Enhanced whole life plan, High coverage, Guaranteed benefits, Wealth accumulation', 'Coverage till 100 years, Maturity benefits, Bonus accumulation, Tax efficiency', 'Material misrepresentation, War and riot, Terminal conditions, Criminal activities', 98.00, 4.7),
('HDFC Life Insurance', 'HDFC Life Guardian', 'Whole Life', 26500.00, 6500000.00, 25, 18, 55, 460000.00, 'Guardian whole life, Life protection, Guaranteed returns, Family security', 'Life coverage till 100, Death and maturity benefits, Tax savings, Loan available', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 98.00, 4.6),
('HDFC Life Insurance', 'HDFC Platinum Life', 'Whole Life', 34000.00, 9500000.00, 30, 21, 55, 580000.00, 'Platinum whole life, Maximum coverage, Guaranteed returns, Premium service', 'Life-long coverage, High maturity value, Guaranteed additions, Tax benefits', 'Non-disclosure, Criminal death, War and terrorism, Terminal illness', 98.00, 4.7),
('HDFC Life Insurance', 'HDFC Forever Young', 'Whole Life', 28500.00, 7500000.00, 25, 18, 55, 500000.00, 'Young whole life plan, Life-long coverage, Maturity benefit, Flexible options', 'Life coverage till 100, Death and maturity benefits, Tax savings, Premium features', 'Suicide in first year, Pre-existing critical illness, War risks, Criminal death', 98.00, 4.7),

-- ICICI Prudential Whole Life Plans (5 plans)
('ICICI Prudential Life Insurance', 'ICICI Pru Whole Life Guardian', 'Whole Life', 26500.00, 6500000.00, 25, 18, 55, 460000.00, 'Guardian whole life plan, Life-long protection, Maturity benefit, Loan available', 'Life coverage till 100, Death and maturity benefits, Tax savings, Loan facility', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 97.80, 4.6),
('ICICI Prudential Life Insurance', 'ICICI Pru Platinum Life', 'Whole Life', 31000.00, 9000000.00, 30, 21, 55, 550000.00, 'Platinum whole life, Maximum coverage, Guaranteed returns, Premium service', 'Life-long coverage, High maturity value, Guaranteed additions, Tax benefits', 'Non-disclosure, Criminal death, War and terrorism, Terminal illness', 97.80, 4.7),
('ICICI Prudential Life Insurance', 'ICICI Pru Forever Secure', 'Whole Life', 27500.00, 7000000.00, 25, 18, 55, 480000.00, 'Secure whole life, Life protection, Guaranteed benefits, Wealth accumulation', 'Coverage till 100, Maturity benefits, Tax advantages, Loan available', 'Material misrepresentation, Suicide, War risks, Criminal activities', 97.80, 4.6),
('ICICI Prudential Life Insurance', 'ICICI Pru Lifetime Advantage', 'Whole Life', 30000.00, 8500000.00, 30, 21, 55, 530000.00, 'Lifetime advantage plan, High coverage, Guaranteed additions, Premium features', 'Life-long coverage, Guaranteed returns, Bonus benefits, Tax efficiency', 'Non-disclosure, War and riot, Terminal conditions, Fraud', 97.80, 4.7),
('ICICI Prudential Life Insurance', 'ICICI Pru Whole Life Plus', 'Whole Life', 33000.00, 10000000.00, 30, 21, 55, 570000.00, 'Enhanced whole life, Maximum protection, Comprehensive benefits, Wealth builder', 'Coverage till 100, High maturity value, Guaranteed additions, Tax savings', 'Suicide, Pre-existing critical illness, War and terrorism, Criminal death', 97.80, 4.7),

-- Axis Max Life Whole Life Plans (5 plans)
('Axis Max Life Insurance', 'Axis Forever Young', 'Whole Life', 28500.00, 7500000.00, 25, 18, 55, 500000.00, 'Young whole life plan, Life-long coverage, Maturity benefit, Flexible options', 'Life coverage till 100, Death and maturity benefits, Tax savings, Premium features', 'Suicide in first year, Pre-existing critical illness, War risks, Criminal death', 96.50, 4.7),
('Axis Max Life Insurance', 'Axis Whole Life Guardian', 'Whole Life', 27000.00, 7000000.00, 25, 18, 55, 480000.00, 'Guardian whole life, Life protection, Guaranteed returns, Family security', 'Coverage till 100, Death and maturity benefits, Tax advantages, Loan facility', 'Non-disclosure, Suicide, War and terrorism, Criminal activities', 96.50, 4.6),
('Axis Max Life Insurance', 'Axis Platinum Whole Life', 'Whole Life', 32000.00, 9000000.00, 30, 21, 55, 550000.00, 'Platinum whole life, High coverage, Guaranteed benefits, Premium service', 'Life-long coverage, High maturity value, Bonus accumulation, Tax efficiency', 'Material misrepresentation, War risks, Terminal illness, Fraud', 96.50, 4.7),
('Axis Max Life Insurance', 'Axis Lifetime Secure', 'Whole Life', 29500.00, 8000000.00, 30, 18, 55, 520000.00, 'Secure lifetime plan, Life coverage, Guaranteed additions, Wealth creation', 'Coverage till 100, Guaranteed returns, Tax savings, Loan available', 'Suicide, Pre-existing diseases, War and riot, Criminal death', 96.50, 4.6),
('Axis Max Life Insurance', 'Axis Whole Life Supreme', 'Whole Life', 35000.00, 11000000.00, 35, 21, 55, 620000.00, 'Supreme whole life, Maximum coverage, All benefits, Comprehensive protection', 'Life-long protection, Highest maturity value, All benefits, Tax efficiency', 'Non-disclosure, War and terrorism, Terminal conditions, Fraudulent claims', 96.50, 4.8),

-- Aditya Birla Sun Life Whole Life Plans (4 plans)
('Aditya Birla Sun Life Insurance', 'ABSLI Whole Life Protector', 'Whole Life', 26000.00, 6500000.00, 25, 18, 55, 460000.00, 'Whole life protection, Life-long coverage, Guaranteed benefits, Family security', 'Coverage till 100, Death and maturity benefits, Tax advantages, Loan facility', 'Suicide in first year, Pre-existing diseases, War risks, Material non-disclosure', 96.80, 4.6),
('Aditya Birla Sun Life Insurance', 'ABSLI Platinum Whole Life', 'Whole Life', 30000.00, 8500000.00, 30, 21, 55, 530000.00, 'Platinum whole life, High coverage, Guaranteed returns, Wealth accumulation', 'Life-long coverage, High maturity value, Bonus benefits, Tax efficiency', 'Non-disclosure, Criminal death, War and terrorism, Terminal illness', 96.80, 4.7),
('Aditya Birla Sun Life Insurance', 'ABSLI Forever Secure', 'Whole Life', 28000.00, 7200000.00, 25, 18, 55, 490000.00, 'Secure whole life, Life protection, Guaranteed additions, Premium features', 'Coverage till 100, Maturity benefits, Tax savings, Loan available', 'Material misrepresentation, Suicide, War risks, Criminal activities', 96.80, 4.6),
('Aditya Birla Sun Life Insurance', 'ABSLI Whole Life Supreme', 'Whole Life', 34000.00, 10500000.00, 35, 21, 55, 600000.00, 'Supreme whole life, Maximum coverage, Comprehensive benefits, Wealth builder', 'Life-long protection, Highest returns, All benefits, Tax efficiency', 'Non-disclosure, War and riot, Terminal conditions, Fraudulent claims', 96.80, 4.8);

-- ============================================
-- ENDOWMENT PLANS (21 plans)
-- ============================================

-- LIC Endowment Plans (4 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Life Insurance Corporation of India (LIC)', 'LIC New Endowment Plan', 'Endowment', 18000.00, 3000000.00, 20, 18, 50, 350000.00, 'Savings + Insurance combined, Maturity benefit, Death coverage, Loan available', 'Guaranteed sum assured, Bonus addition, Death and maturity benefits, Tax savings u/s 80C & 10(10D)', 'Non-disclosure of health conditions, Criminal activities, War risks, Material misrepresentation', 98.50, 4.6),
('Life Insurance Corporation of India (LIC)', 'LIC Jeevan Lakshya', 'Endowment', 22000.00, 5000000.00, 25, 18, 50, 420000.00, 'Goal-based endowment, Income benefit, Maturity payout, Comprehensive coverage', 'Death + maturity benefits, Income benefit to family, Tax advantages, Guaranteed returns', 'Suicide in first year, Death due to war, Terminal illness, Fraud', 98.50, 4.7),
('Life Insurance Corporation of India (LIC)', 'LIC New Jeevan Anand', 'Endowment', 26000.00, 7000000.00, 30, 18, 50, 500000.00, 'Premium endowment plan, High returns, Life coverage, Wealth creation', 'Life coverage + savings, Maturity benefits, Bonus accumulation, Tax efficiency', 'Material non-disclosure, Criminal death, War and terrorism, Pre-existing conditions', 98.50, 4.8),
('Life Insurance Corporation of India (LIC)', 'LIC New Children Money Back', 'Endowment', 28000.00, 2000000.00, 20, 0, 12, 400000.00, 'Child education plan, Money back benefits, Life cover for parent, Premium waiver', 'Periodic money back, Maturity benefit, Parent life cover, Premium waiver on death', 'Non-disclosure, War risks, Criminal activities', 98.50, 4.7),

-- SBI Life Endowment Plans (4 plans)
('SBI Life Insurance', 'SBI Life Shubh Nivesh', 'Endowment', 19500.00, 3800000.00, 20, 18, 50, 360000.00, 'Auspicious investment, Guaranteed returns, Life coverage, Tax benefits', 'Death and maturity benefits, Guaranteed returns, Tax advantages, Loan facility', 'Material misrepresentation, Suicide, War risks, Criminal activities', 96.30, 4.5),
('SBI Life Insurance', 'SBI Life Smart Platina Assure', 'Endowment', 23500.00, 5500000.00, 25, 18, 50, 430000.00, 'Platinum endowment, Life + savings, Guaranteed benefits, Premium features', 'Life coverage + returns, Maturity benefits, Guaranteed additions, Tax efficiency', 'Non-disclosure, War and riot, Terminal conditions, Fraud', 96.30, 4.6),
('SBI Life Insurance', 'SBI Endowment Plus', 'Endowment', 20500.00, 4200000.00, 20, 18, 50, 380000.00, 'Enhanced endowment, Savings + protection, Maturity benefit, Tax savings', 'Death and maturity benefits, Guaranteed returns, Tax advantages, Loan available', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 96.30, 4.6),
('SBI Life Insurance', 'SBI Wealth Assure', 'Endowment', 25000.00, 6000000.00, 25, 18, 50, 460000.00, 'Wealth assurance endowment, Life coverage, High returns, Comprehensive benefits', 'Life protection + savings, High maturity value, Tax efficiency, Guaranteed additions', 'Material non-disclosure, War and terrorism, Criminal death, Terminal illness', 96.30, 4.7),

-- HDFC Life Endowment Plans (4 plans)
('HDFC Life Insurance', 'HDFC Sanchay Par Advantage', 'Endowment', 20000.00, 4000000.00, 20, 18, 55, 380000.00, 'Guaranteed returns endowment, Life coverage, Maturity benefit, Tax savings', 'Guaranteed additions, Death benefit, Maturity benefit, Tax advantages, Loan facility', 'Non-disclosure, Criminal acts, War risks, Suicide within first year', 98.00, 4.6),
('HDFC Life Insurance', 'HDFC Sampoorn Samridhi Plus', 'Endowment', 24000.00, 6000000.00, 25, 18, 55, 450000.00, 'Complete prosperity plan, Life + savings, Guaranteed returns, Wealth builder', 'Life protection + savings, Maturity benefits, Guaranteed additions, Tax efficiency', 'Material misrepresentation, War and riot, Terminal conditions, Criminal activities', 98.00, 4.7),
('HDFC Life Insurance', 'HDFC Endowment Advantage', 'Endowment', 21500.00, 4500000.00, 20, 18, 50, 400000.00, 'Advantageous endowment, Life coverage, Guaranteed benefits, Wealth creation', 'Death and maturity benefits, Guaranteed returns, Tax savings, Loan available', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 98.00, 4.6),
('HDFC Life Insurance', 'HDFC Child Future', 'Endowment', 27000.00, 5000000.00, 20, 0, 12, 450000.00, 'Child future planning, Education fund, Life cover for parent, Goal-based savings', 'Education fund creation, Parent life protection, Maturity benefits, Tax advantages', 'Material non-disclosure, War risks, Lapse consequences, Criminal activities', 98.00, 4.7),

-- ICICI Prudential Endowment Plans (3 plans)
('ICICI Prudential Life Insurance', 'ICICI Pru Endowment Plus', 'Endowment', 21000.00, 4500000.00, 20, 18, 50, 400000.00, 'Enhanced endowment, Savings + protection, Maturity benefit, Tax savings', 'Death and maturity benefits, Guaranteed returns, Tax advantages, Loan available', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 97.80, 4.6),
('ICICI Prudential Life Insurance', 'ICICI Pru Assured Savings', 'Endowment', 25000.00, 6500000.00, 25, 18, 50, 470000.00, 'Assured savings endowment, Life coverage, Guaranteed benefits, Wealth accumulation', 'Life protection, Guaranteed maturity value, Tax savings, Premium waiver option', 'Non-disclosure, Criminal death, War and terrorism, Terminal illness', 97.80, 4.7),
('ICICI Prudential Life Insurance', 'ICICI Pru Smart Kid', 'Endowment', 30000.00, 2200000.00, 18, 0, 12, 450000.00, 'Smart kid plan, Education planning, Life cover, Guaranteed benefits', 'Education fund creation, Parent life protection, Maturity benefits, Tax advantages', 'Material non-disclosure, War risks, Lapse consequences', 97.80, 4.6),

-- Axis Max Life Endowment Plans (3 plans)
('Axis Max Life Insurance', 'Axis Assured Wealth Plan', 'Endowment', 23000.00, 5500000.00, 20, 18, 50, 430000.00, 'Assured wealth endowment, Guaranteed returns, Life coverage, Tax benefits', 'Death and maturity benefits, Guaranteed additions, Tax savings, Loan facility', 'Material non-disclosure, Criminal death, War risks, Suicide in first year', 96.50, 4.6),
('Axis Max Life Insurance', 'Axis Endowment Plus', 'Endowment', 21000.00, 4800000.00, 20, 18, 50, 400000.00, 'Enhanced endowment, Life + savings, Guaranteed benefits, Wealth creation', 'Death and maturity benefits, Guaranteed returns, Tax advantages, Loan available', 'Suicide in first year, Pre-existing diseases, War risks, Fraud', 96.50, 4.5),
('Axis Max Life Insurance', 'Axis Child Secure', 'Endowment', 29000.00, 2500000.00, 18, 0, 12, 450000.00, 'Child security plan, Education fund, Parent life cover, Guaranteed benefits', 'Education goal achievement, Parent protection, Maturity benefits, Tax savings', 'Non-disclosure, War risks, Criminal activities, Lapse consequences', 96.50, 4.6),

-- Aditya Birla Sun Life Endowment Plans (3 plans)
('Aditya Birla Sun Life Insurance', 'ABSLI Vision LifeIncome Plus', 'Endowment', 21500.00, 4800000.00, 20, 18, 50, 400000.00, 'Income endowment, Guaranteed income, Life coverage, Savings plan', 'Regular income, Life cover, Maturity benefits, Tax savings u/s 80C', 'Non-disclosure, Suicide, War risks, Criminal activities', 96.80, 4.5),
('Aditya Birla Sun Life Insurance', 'ABSLI Assured Wealth', 'Endowment', 24000.00, 5800000.00, 25, 18, 50, 450000.00, 'Assured wealth endowment, Guaranteed returns, Life protection, Tax benefits', 'Death and maturity benefits, Guaranteed additions, Tax advantages, Loan facility', 'Material misrepresentation, War and terrorism, Criminal death, Terminal illness', 96.80, 4.6),
('Aditya Birla Sun Life Insurance', 'ABSLI Child Bright Future', 'Endowment', 28500.00, 2300000.00, 18, 0, 12, 450000.00, 'Child education endowment, Guaranteed maturity, Parent life cover, Premium waiver', 'Education fund, Parent protection, Guaranteed returns, Tax savings', 'Non-disclosure, War risks, Criminal activities, Policy lapse', 96.80, 4.6);

-- ============================================
-- ULIP PLANS (20 plans)
-- ============================================

-- LIC ULIP Plans (4 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Life Insurance Corporation of India (LIC)', 'LIC Market Plus', 'ULIP', 36000.00, 2500000.00, 15, 18, 60, 500000.00, 'Market-linked ULIP, Multiple fund options, Life coverage, Flexible investment', 'Market-linked growth potential, Death benefit, Tax benefits u/s 80C, Fund switching options', 'Market risks apply, Death due to adventurous sports, Suicide in first year, Material non-disclosure', 98.50, 4.5),
('Life Insurance Corporation of India (LIC)', 'LIC SIIP (Single Invest Plus)', 'ULIP', 150000.00, 3000000.00, 10, 25, 60, 600000.00, 'Single premium ULIP, Lump sum investment, Market growth, Life coverage', 'Market-linked returns, Death benefit, Tax advantages, Fund flexibility', 'Market volatility, Non-disclosure, War risks, Terminal illness', 98.50, 4.4),
('Life Insurance Corporation of India (LIC)', 'LIC New Endowment Plus ULIP', 'ULIP', 38000.00, 2800000.00, 15, 18, 60, 520000.00, 'Endowment ULIP hybrid, Market growth, Life coverage, Partial withdrawals', 'Investment growth, Life protection, Tax benefits, Flexible funds', 'Market risks, Policy lapse, Suicide, War and terrorism', 98.50, 4.5),
('Life Insurance Corporation of India (LIC)', 'LIC Nivesh Plus', 'ULIP', 40000.00, 3000000.00, 15, 18, 60, 550000.00, 'Investment plus plan, Market-linked, Life coverage, Wealth creation', 'Market growth potential, Death benefit, Tax efficiency, Fund options', 'Market fluctuations, Non-payment of premiums, War risks, Fraud', 98.50, 4.4),

-- SBI Life ULIP Plans (3 plans)
('SBI Life Insurance', 'SBI Life Smart Wealth', 'ULIP', 35000.00, 2500000.00, 15, 18, 60, 500000.00, 'Market-linked returns, Insurance + Investment, Fund switching options, Partial withdrawals', 'Market-linked growth potential, Death benefit, Tax benefits u/s 80C & 10(10D), Flexible fund options', 'Market risks apply, Death due to adventurous sports, Suicide in first year, Material non-disclosure', 96.30, 4.4),
('SBI Life Insurance', 'SBI Life Smart Wealth Builder', 'ULIP', 42000.00, 3500000.00, 20, 21, 60, 600000.00, 'Wealth creation ULIP, Multiple fund options, Systematic transfer, Top-up facility', 'Wealth growth, Life coverage, Fund flexibility, Tax advantages, Switching options', 'Market volatility, Non-payment of premiums, War risks, Fraud', 96.30, 4.5),
('SBI Life Insurance', 'SBI Life Elite Wealth', 'ULIP', 45000.00, 3800000.00, 20, 21, 60, 650000.00, 'Elite wealth ULIP, Premium investment, Life coverage, High growth funds', 'High growth potential, Life protection, Tax efficiency, Premium service', 'Market fluctuations, Non-disclosure, War risks, Terminal illness', 96.30, 4.6),

-- HDFC Life ULIP Plans (3 plans)
('HDFC Life Insurance', 'HDFC Life ProGrowth Plus', 'ULIP', 38000.00, 3000000.00, 15, 18, 60, 550000.00, 'Growth-focused ULIP, Multiple funds, Life coverage, Wealth maximization', 'Market growth potential, Life protection, Fund switching, Tax efficiency', 'Market risks, Death in excluded activities, Material non-disclosure', 98.00, 4.5),
('HDFC Life Insurance', 'HDFC Life Click 2 Invest', 'ULIP', 40000.00, 3200000.00, 18, 18, 60, 570000.00, 'Online ULIP, Lower charges, Market-linked returns, Life cover', 'Investment growth, Life coverage, Low charges, Tax benefits, Online convenience', 'Market fluctuations, Suicide, Non-disclosure, War risks', 98.00, 4.4),
('HDFC Life Insurance', 'HDFC Life Invest 4G', 'ULIP', 43000.00, 3600000.00, 20, 21, 60, 620000.00, 'Fourth generation ULIP, Advanced features, Life coverage, Maximum growth', 'High growth potential, Life protection, Tax benefits, Premium funds', 'Market volatility, Non-payment, War and terrorism, Fraud', 98.00, 4.6),

-- ICICI Prudential ULIP Plans (3 plans)
('ICICI Prudential Life Insurance', 'ICICI Pru Signature', 'ULIP', 39000.00, 3000000.00, 15, 18, 60, 560000.00, 'Premium ULIP, Multiple fund options, Wealth creation, Insurance coverage', 'Investment growth, Life cover, Fund flexibility, Tax efficiency, Premium service', 'Market volatility, Non-payment of premiums, Criminal death', 97.80, 4.5),
('ICICI Prudential Life Insurance', 'ICICI Pru Wealth Builder II', 'ULIP', 44000.00, 3800000.00, 20, 21, 60, 620000.00, 'Wealth building ULIP, Long-term growth, Life coverage, Flexible funds', 'Market-linked returns, Life protection, Tax advantages, Systematic investment', 'Market risks, Policy lapse, War and terrorism', 97.80, 4.6),
('ICICI Prudential Life Insurance', 'ICICI Pru Future Perfect', 'ULIP', 41000.00, 3400000.00, 18, 18, 60, 590000.00, 'Future planning ULIP, Market-linked, Life coverage, Goal-based investment', 'Market growth potential, Life protection, Tax efficiency, Flexible options', 'Market risks, Policy lapse, War and terrorism, Criminal death', 97.80, 4.5),

-- Axis Max Life ULIP Plans (4 plans)
('Axis Max Life Insurance', 'Axis Future Stars', 'ULIP', 37000.00, 2800000.00, 15, 18, 60, 540000.00, 'Future-focused ULIP, Child education planning, Life coverage, Flexible funds', 'Investment growth, Life protection, Goal-based saving, Tax efficiency', 'Market risks, Policy lapse, Non-payment, War risks', 96.50, 4.4),
('Axis Max Life Insurance', 'Axis Wealth Aspire', 'ULIP', 39500.00, 3100000.00, 18, 18, 60, 570000.00, 'Wealth aspiration ULIP, Multiple funds, Life coverage, Systematic planning', 'Market-linked returns, Life protection, Fund switching, Tax benefits', 'Market volatility, Lapse consequences, Material non-disclosure', 96.50, 4.5),
('Axis Max Life Insurance', 'Axis Smart Invest', 'ULIP', 38000.00, 2900000.00, 15, 18, 60, 550000.00, 'Smart investment ULIP, Market growth, Life coverage, Fund flexibility', 'Investment growth, Life protection, Tax advantages, Multiple fund options', 'Market risks, Policy lapse, Suicide, War and terrorism', 96.50, 4.4),
('Axis Max Life Insurance', 'Axis Elite Wealth', 'ULIP', 42000.00, 3500000.00, 20, 21, 60, 610000.00, 'Elite wealth ULIP, Premium investment, High growth, Life coverage', 'High market growth, Life protection, Tax benefits, Premium service', 'Market fluctuations, Non-payment, War risks, Criminal death', 96.50, 4.6),

-- Aditya Birla Sun Life ULIP Plans (3 plans)
('Aditya Birla Sun Life Insurance', 'ABSLI Wealth Aspire', 'ULIP', 39500.00, 3100000.00, 18, 18, 60, 570000.00, 'Wealth aspiration ULIP, Multiple funds, Life coverage, Systematic planning', 'Market-linked returns, Life protection, Fund switching, Tax benefits', 'Market volatility, Lapse consequences, Material non-disclosure', 96.80, 4.5),
('Aditya Birla Sun Life Insurance', 'ABSLI Invest Assure', 'ULIP', 36000.00, 2700000.00, 15, 18, 60, 530000.00, 'Investment assurance ULIP, Market growth, Life protection, Fund management', 'Investment growth, Life coverage, Tax benefits, Multiple fund options', 'Market risks, Policy lapse, Suicide, War and terrorism', 96.80, 4.4),
('Aditya Birla Sun Life Insurance', 'ABSLI Smart Wealth', 'ULIP', 40000.00, 3200000.00, 18, 18, 60, 580000.00, 'Smart wealth ULIP, Market-linked returns, Life coverage, Flexible investment', 'Market growth potential, Life protection, Tax efficiency, Fund flexibility', 'Market fluctuations, Non-payment of premiums, War risks, Fraud', 96.80, 4.5);

-- ============================================
-- HEALTH INSURANCE PLANS (25 plans)
-- ============================================

-- Reliance General Health Plans (5 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Reliance General Insurance', 'Reliance Health Infinity', 'Health', 8500.00, 500000.00, 1, 18, 65, 200000.00, 'Comprehensive health cover, Cashless treatment network, No claim bonus up to 100%, Restoration benefit', 'Hospitalization coverage, Pre/post hospitalization 60/90 days, Day care procedures, Annual health checkup', 'Pre-existing diseases (first 4 years), Cosmetic surgery, Self-inflicted injuries, War risks', 89.20, 4.4),
('Reliance General Insurance', 'Reliance Complete Health', 'Health', 12000.00, 1000000.00, 1, 18, 70, 300000.00, 'Enhanced health protection, Unlimited restoration, OPD cover option, Wellness benefits', 'High coverage up to 10L, Unlimited e-consultation, No room rent capping, Wellness rewards', 'Intentional self-injury, War and nuclear risks, Pre-existing for initial period, Cosmetic treatments', 89.20, 4.6),
('Reliance General Insurance', 'Reliance Health Shield', 'Health', 15000.00, 1500000.00, 1, 18, 75, 400000.00, 'Premium health shield, Family floater, Critical illness add-on, Global coverage', 'Coverage up to 15L, Critical illness benefit, Worldwide emergency cover, No claim bonus', 'Pre-existing conditions (waiting period), Dental unless accidental, Infertility treatment', 89.20, 4.7),
('Reliance General Insurance', 'Reliance Health Gain', 'Health', 9500.00, 750000.00, 1, 18, 65, 250000.00, 'Health gain plan, Hospitalization cover, Cashless facility, No claim bonus', 'Medical expense coverage, Cashless treatment, NCB benefits, Tax advantages', 'Pre-existing diseases (waiting period), Cosmetic procedures, Self-harm, War risks', 89.20, 4.5),
('Reliance General Insurance', 'Reliance Critical Care', 'Health', 11000.00, 1200000.00, 1, 21, 65, 320000.00, 'Critical illness coverage, Major illnesses covered, Lump sum benefit, Tax savings', 'Coverage for cancer, heart attack, stroke, kidney failure, Tax benefits', 'Pre-existing critical conditions, Minor illnesses, Waiting period of 90 days', 89.20, 4.5),

-- Tata AIG General Health Plans (4 plans)
('Tata AIG General Insurance', 'Tata AIG MediCare', 'Health', 8900.00, 600000.00, 1, 18, 65, 220000.00, 'MediCare health plan, Hospitalization cover, Cashless network, Health checkup', 'Medical expenses coverage, Cashless facility, Annual checkup, Tax benefits', 'Pre-existing diseases (first 3 years), Cosmetic surgery, Self-inflicted harm', 87.30, 4.4),
('Tata AIG General Insurance', 'Tata AIG Medicare Premier', 'Health', 13000.00, 1200000.00, 1, 18, 70, 350000.00, 'Premier medicare, Enhanced coverage, Family floater, OPD benefits', 'High coverage 12L, OPD expenses, Family floater option, Tax advantages', 'Pre-existing conditions (waiting period), Dental care, Cosmetic procedures', 87.30, 4.6),
('Tata AIG General Insurance', 'Tata AIG Health Secure', 'Health', 10200.00, 800000.00, 1, 18, 65, 270000.00, 'Health security plan, Comprehensive coverage, Cashless treatment, Wellness', 'Hospitalization coverage, Cashless network, Wellness benefits, Tax savings', 'Pre-existing diseases (waiting period), Cosmetic surgery, War risks', 87.30, 4.4),
('Tata AIG General Insurance', 'Tata AIG Critical Illness Plus', 'Health', 12500.00, 1500000.00, 1, 21, 65, 360000.00, 'Critical illness plus, 40+ illnesses, Lump sum payout, Tax benefits', 'Major critical illness cover, Early stage benefit, Tax advantages', 'Pre-existing critical conditions, Minor health issues, Waiting period applicable', 87.30, 4.5),

-- Bajaj Allianz General Health Plans (4 plans)
('Bajaj Allianz General Insurance', 'Bajaj Allianz Health Guard', 'Health', 10500.00, 1000000.00, 1, 18, 70, 280000.00, 'Comprehensive health guard, Family floater option, Cashless facility, No claim bonus', 'Hospitalization coverage, Cashless treatment, Annual checkup, Tax benefits', 'Pre-existing conditions (first 4 years), Dental care, Cosmetic surgery', 85.20, 4.3),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Health Care Supreme', 'Health', 14500.00, 1500000.00, 1, 18, 70, 380000.00, 'Supreme health care, Enhanced coverage, Critical illness, Maternity cover', 'High coverage 15L, Critical illness add-on, Maternity benefit, Tax advantages', 'Pre-existing conditions (waiting period), Dental unless accidental, Infertility', 85.20, 4.6),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Extra Care', 'Health', 9200.00, 700000.00, 1, 18, 65, 240000.00, 'Extra care health, Hospitalization cover, Cashless network, Wellness benefits', 'Medical expense coverage, Cashless treatment, Health checkup, Tax savings', 'Pre-existing diseases (waiting period), Cosmetic procedures, War risks', 85.20, 4.4),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Critical Illness', 'Health', 11800.00, 1300000.00, 1, 21, 65, 330000.00, 'Critical illness plan, Major diseases, Lump sum benefit, Tax advantages', 'Coverage for critical illnesses, Lump sum payout, Tax benefits', 'Pre-existing critical conditions, Waiting period, Minor illnesses', 85.20, 4.5),

-- New India Assurance Health Plans (4 plans)
('New India Assurance Company Ltd', 'New India Mediclaim Policy', 'Health', 7800.00, 500000.00, 1, 18, 65, 200000.00, 'Traditional mediclaim, Hospitalization cover, Cashless facility, Tax benefits', 'Medical expense coverage, Cashless treatment, Pre/post hospitalization, Tax savings', 'Pre-existing diseases (first 4 years), Cosmetic surgery, Self-inflicted injuries', 88.50, 4.3),
('New India Assurance Company Ltd', 'New India Health Plus', 'Health', 11500.00, 1000000.00, 1, 18, 70, 300000.00, 'Health plus plan, Enhanced coverage, Family floater, Critical illness option', 'High coverage 10L, Family floater, Critical illness add-on, Tax advantages', 'Pre-existing conditions (waiting period), Dental care, Cosmetic treatments', 88.50, 4.5),
('New India Assurance Company Ltd', 'New India Premier Mediclaim', 'Health', 13200.00, 1200000.00, 1, 18, 70, 340000.00, 'Premier mediclaim, Comprehensive coverage, Cashless network, OPD cover', 'Hospitalization coverage, OPD expenses, Cashless facility, Tax benefits', 'Pre-existing diseases (waiting period), Cosmetic procedures, War risks', 88.50, 4.5),
('New India Assurance Company Ltd', 'New India Critical Protect', 'Health', 10800.00, 1500000.00, 1, 21, 65, 310000.00, 'Critical illness protection, Major illnesses, Lump sum benefit, Tax savings', 'Critical illness coverage, Lump sum payout, Tax advantages', 'Pre-existing critical conditions, Minor health issues, Waiting period', 88.50, 4.4),

-- National Insurance Health Plans (4 plans)
('National Insurance Company Ltd', 'National Mediclaim Policy', 'Health', 7500.00, 400000.00, 1, 18, 65, 180000.00, 'Basic mediclaim, Hospitalization cover, Cashless facility, Tax benefits', 'Medical expense coverage, Cashless treatment, Tax savings', 'Pre-existing diseases (first 4 years), Cosmetic surgery, Self-inflicted injuries', 86.80, 4.2),
('National Insurance Company Ltd', 'National Health Premier', 'Health', 10800.00, 900000.00, 1, 18, 70, 280000.00, 'Premier health plan, Enhanced coverage, Family floater option, Health checkup', 'High coverage 9L, Family floater, Annual checkup, Tax advantages', 'Pre-existing conditions (waiting period), Dental care, Cosmetic treatments', 86.80, 4.4),
('National Insurance Company Ltd', 'National Health Shield', 'Health', 12500.00, 1100000.00, 1, 18, 70, 330000.00, 'Health shield plan, Comprehensive coverage, Cashless network, OPD benefits', 'Hospitalization coverage, OPD expenses, Cashless facility, Tax benefits', 'Pre-existing diseases (waiting period), Cosmetic procedures, War risks', 86.80, 4.5),
('National Insurance Company Ltd', 'National Critical Care', 'Health', 9800.00, 1200000.00, 1, 21, 65, 290000.00, 'Critical care plan, Major illnesses, Lump sum payout, Tax savings', 'Critical illness coverage, Lump sum benefit, Tax advantages', 'Pre-existing critical conditions, Minor illnesses, Waiting period', 86.80, 4.3),

-- Royal Sundaram General Health Plans (4 plans)
('Royal Sundaram General Insurance', 'Royal Sundaram Health Shield', 'Health', 8200.00, 550000.00, 1, 18, 65, 210000.00, 'Health shield plan, Comprehensive coverage, Cashless network, No claim bonus', 'Hospitalization coverage, Cashless treatment, Pre/post hospitalization, NCB', 'Pre-existing diseases (first 4 years), Cosmetic surgery, Self-inflicted injuries', 87.50, 4.3),
('Royal Sundaram General Insurance', 'Royal Sundaram Premier Health', 'Health', 12200.00, 1100000.00, 1, 18, 70, 320000.00, 'Premier health plan, Enhanced coverage, Family floater, Critical illness option', 'High coverage 11L, Family floater, Critical illness add-on, Tax benefits', 'Pre-existing conditions (waiting period), Dental care, Cosmetic treatments', 87.50, 4.5),
('Royal Sundaram General Insurance', 'Royal Sundaram Complete Health', 'Health', 14000.00, 1400000.00, 1, 18, 70, 370000.00, 'Complete health coverage, OPD benefits, Maternity cover, Wellness program', 'Comprehensive coverage, OPD expenses, Maternity benefit, Annual checkup', 'Pre-existing diseases (waiting period), Cosmetic procedures, War risks', 87.50, 4.6),
('Royal Sundaram General Insurance', 'Royal Sundaram Critical Care', 'Health', 11200.00, 1300000.00, 1, 21, 65, 330000.00, 'Critical illness coverage, Major diseases, Lump sum benefit, Tax advantages', 'Critical illness coverage, Lump sum payout, Tax savings', 'Pre-existing critical conditions, Minor illnesses, Waiting period', 87.50, 4.4);

-- ============================================
-- MOTOR INSURANCE PLANS (17 plans)
-- ============================================

-- Reliance General Motor Plans (3 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Reliance General Insurance', 'Reliance Car Comprehensive', 'Motor', 12500.00, 1000000.00, 1, 18, 75, 300000.00, 'Comprehensive car coverage, Own damage + Third party, Cashless garage network, Zero depreciation add-on', 'Own damage cover, Third party liability, Personal accident cover, Roadside assistance, NCB up to 50%', 'Normal wear and tear, Driving without valid license, Drunk driving, Consequential losses', 87.50, 4.5),
('Reliance General Insurance', 'Reliance Two Wheeler Insurance', 'Motor', 2500.00, 100000.00, 1, 18, 75, 150000.00, 'Bike insurance, Comprehensive cover, Cashless claims, Personal accident cover', 'Own damage + third party, PA cover ₹15L, Roadside assistance, Helmet cover', 'Wear and tear, Unlicensed driving, Racing, Modifications not declared', 87.50, 4.3),
('Reliance General Insurance', 'Reliance Car Zero Dep', 'Motor', 15000.00, 1200000.00, 1, 18, 75, 350000.00, 'Zero depreciation car insurance, Full coverage, Engine protection, Consumables', 'Own damage + TP, Zero dep cover, Engine protection, Consumables included', 'License violations, Drunk driving, Commercial use, War risks', 87.50, 4.6),

-- Tata AIG General Motor Plans (3 plans)
('Tata AIG General Insurance', 'Tata AIG Car Secure', 'Motor', 11500.00, 900000.00, 1, 18, 75, 290000.00, 'Car security insurance, Comprehensive coverage, Roadside assistance, NCB', 'Own damage + TP, Personal accident, Roadside help, NCB up to 50%', 'Wear and tear, License violations, Intoxication, War', 87.30, 4.3),
('Tata AIG General Insurance', 'Tata AIG Car Premium', 'Motor', 14000.00, 1100000.00, 1, 18, 75, 330000.00, 'Premium car insurance, Zero depreciation, Engine cover, Consumables', 'Own damage + TP, Zero dep add-on, Engine protection, Consumables cover', 'Normal depreciation (without add-on), Unlicensed driving, Drunk driving', 87.30, 4.5),
('Tata AIG General Insurance', 'Tata AIG Bike Insurance', 'Motor', 2800.00, 120000.00, 1, 18, 75, 150000.00, 'Bike comprehensive, Own damage + TP, Personal accident, Helmet protection', 'Comprehensive coverage, PA cover, Roadside assistance, Helmet cover', 'Normal wear, Unlicensed driving, Racing, Modifications', 87.30, 4.3),

-- Bajaj Allianz General Motor Plans (3 plans)
('Bajaj Allianz General Insurance', 'Bajaj Allianz Car Comprehensive', 'Motor', 12800.00, 1100000.00, 1, 18, 75, 310000.00, 'Comprehensive car insurance, Zero depreciation, Engine protection, Wide network', 'Own damage + third party, Zero dep add-on, Engine cover, Consumables', 'Normal wear and tear, Unlicensed driving, Drunk driving, Modifications', 85.20, 4.4),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Two Wheeler', 'Motor', 2700.00, 110000.00, 1, 18, 75, 150000.00, 'Two wheeler insurance, Comprehensive coverage, Cashless claims, PA cover', 'Own damage + TP, Personal accident, Roadside assistance, Accessories cover', 'Wear and tear, Unlicensed driving, Racing, Commercial use', 85.20, 4.2),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Car Premium', 'Motor', 14500.00, 1300000.00, 1, 18, 75, 340000.00, 'Premium car insurance, Complete protection, Zero dep, Engine cover', 'Own damage + TP, Zero depreciation, Engine protection, Consumables included', 'License violations, Drunk driving, War risks, Normal wear', 85.20, 4.5),

-- New India Assurance Motor Plans (3 plans)
('New India Assurance Company Ltd', 'New India Car Insurance', 'Motor', 11800.00, 950000.00, 1, 18, 75, 280000.00, 'Car insurance comprehensive, Own damage + TP, Cashless network, NCB', 'Own damage cover, Third party liability, Personal accident, NCB benefits', 'Normal wear and tear, License violations, Drunk driving, War risks', 88.50, 4.3),
('New India Assurance Company Ltd', 'New India Two Wheeler', 'Motor', 2400.00, 90000.00, 1, 18, 75, 150000.00, 'Two wheeler comprehensive, Own damage + TP, PA cover, Roadside help', 'Comprehensive coverage, Personal accident, Roadside assistance', 'Wear and tear, Unlicensed driving, Racing, Modifications', 88.50, 4.2),
('New India Assurance Company Ltd', 'New India Car Premium', 'Motor', 13800.00, 1150000.00, 1, 18, 75, 320000.00, 'Premium car coverage, Zero depreciation, Engine protection, Wide network', 'Own damage + TP, Zero dep cover, Engine protection, Consumables', 'Normal depreciation (without add-on), License violations, Drunk driving', 88.50, 4.4),

-- National Insurance Motor Plans (3 plans)
('National Insurance Company Ltd', 'National Car Insurance', 'Motor', 11200.00, 900000.00, 1, 18, 75, 270000.00, 'Car insurance comprehensive, Own damage + TP, Cashless facility, NCB', 'Own damage cover, Third party liability, Personal accident, NCB up to 50%', 'Normal wear and tear, License violations, Drunk driving, War risks', 86.80, 4.2),
('National Insurance Company Ltd', 'National Two Wheeler', 'Motor', 2300.00, 85000.00, 1, 18, 75, 150000.00, 'Two wheeler insurance, Comprehensive coverage, PA cover, Cashless claims', 'Own damage + TP, Personal accident cover, Roadside assistance', 'Wear and tear, Unlicensed driving, Racing, Modifications', 86.80, 4.1),
('National Insurance Company Ltd', 'National Car Premium', 'Motor', 13200.00, 1050000.00, 1, 18, 75, 310000.00, 'Premium car insurance, Zero depreciation option, Engine cover, Wide network', 'Own damage + TP, Zero dep add-on, Engine protection, Roadside assistance', 'Normal depreciation (without add-on), License violations, Intoxication', 86.80, 4.3),

-- Royal Sundaram General Motor Plans (2 plans)
('Royal Sundaram General Insurance', 'Royal Sundaram Car Comprehensive', 'Motor', 12200.00, 1000000.00, 1, 18, 75, 295000.00, 'Comprehensive car insurance, Own damage + TP, Cashless network, NCB benefits', 'Own damage cover, Third party liability, Personal accident, Roadside assistance', 'Normal wear and tear, License violations, Drunk driving, War risks', 87.50, 4.4),
('Royal Sundaram General Insurance', 'Royal Sundaram Two Wheeler', 'Motor', 2600.00, 105000.00, 1, 18, 75, 150000.00, 'Two wheeler comprehensive, Own damage + TP, PA cover, Cashless claims', 'Comprehensive coverage, Personal accident, Roadside assistance, Helmet cover', 'Wear and tear, Unlicensed driving, Racing, Modifications', 87.50, 4.2);

-- ============================================
-- TRAVEL INSURANCE PLANS (12 plans)
-- ============================================

-- Reliance General Travel Plans (2 plans)
INSERT INTO insurance_plans (provider_name, plan_name, plan_type, base_premium, coverage_amount, policy_term, min_age, max_age, min_income, features, benefits, exclusions, claim_settlement_ratio, rating) VALUES
('Reliance General Insurance', 'Reliance Travel Shield', 'Travel', 1500.00, 1000000.00, 1, 18, 75, 0.00, 'International travel insurance, Medical emergency cover, Trip cancellation, Baggage loss protection', 'Medical expenses up to $100K, Trip cancellation/delay, Lost baggage, Personal accident, 24/7 assistance', 'Pre-existing conditions, Adventure sports (unless covered), War zones, Suicide', 89.20, 4.5),
('Reliance General Insurance', 'Reliance Global Travel', 'Travel', 1850.00, 1200000.00, 1, 18, 75, 0.00, 'Global travel insurance, Comprehensive coverage, Medical emergency, Trip benefits', 'Medical expenses, Trip cancellation/delay, Lost baggage, Personal liability, Emergency help', 'Pre-existing conditions, Extreme sports, Intentional injury, War zones', 89.20, 4.5),

-- Tata AIG General Travel Plans (2 plans)
('Tata AIG General Insurance', 'Tata AIG International Travel', 'Travel', 1750.00, 1200000.00, 1, 18, 75, 0.00, 'International travel insurance, Comprehensive coverage, Medical emergency, Trip benefits', 'Medical expenses, Trip cancellation/delay, Baggage loss, Personal liability', 'Pre-existing diseases, Adventure sports, Intentional injury, War', 87.30, 4.5),
('Tata AIG General Insurance', 'Tata AIG Domestic Travel', 'Travel', 550.00, 250000.00, 1, 18, 75, 0.00, 'Domestic travel insurance, Medical cover, Trip delay, Baggage protection', 'Medical expenses, Trip delay compensation, Baggage loss, Personal accident', 'Pre-existing diseases, Adventure activities, Self-harm, Riots', 87.30, 4.3),

-- Bajaj Allianz General Travel Plans (2 plans)
('Bajaj Allianz General Insurance', 'Bajaj Allianz Travel Guard', 'Travel', 1400.00, 800000.00, 1, 18, 70, 0.00, 'Travel guard insurance, Medical cover, Trip protection, Baggage security', 'Medical emergency, Trip cancellation, Lost baggage, Personal accident', 'Pre-existing conditions, Extreme activities, Self-harm, War risks', 85.20, 4.3),
('Bajaj Allianz General Insurance', 'Bajaj Allianz Global Travel', 'Travel', 1650.00, 1000000.00, 1, 18, 75, 0.00, 'Global travel insurance, International coverage, Medical emergency, Trip benefits', 'Medical expenses, Trip delay/cancellation, Baggage protection, Personal liability', 'Pre-existing diseases, High-risk sports, Intentional injury, War zones', 85.20, 4.4),

-- New India Assurance Travel Plans (2 plans)
('New India Assurance Company Ltd', 'New India Overseas Travel', 'Travel', 1600.00, 1000000.00, 1, 18, 75, 0.00, 'Overseas travel protection, Medical cover, Trip cancellation, Emergency assistance', 'Medical emergency, Trip cancellation, Lost baggage, Personal accident, 24/7 help', 'Pre-existing conditions, High-risk sports, War zones, Suicide', 88.50, 4.4),
('New India Assurance Company Ltd', 'New India Domestic Travel', 'Travel', 480.00, 200000.00, 1, 18, 75, 0.00, 'Domestic travel insurance, Medical cover, Trip delay, Baggage protection', 'Medical expenses, Trip delay, Baggage loss, Personal accident', 'Pre-existing diseases, Adventure activities, Self-harm, Riots', 88.50, 4.2),

-- National Insurance Travel Plans (2 plans)
('National Insurance Company Ltd', 'National Overseas Travel', 'Travel', 1550.00, 950000.00, 1, 18, 75, 0.00, 'Overseas travel insurance, International cover, Medical emergency, Trip benefits', 'Medical coverage, Trip delay/cancellation, Baggage loss, PA cover', 'Pre-existing diseases, High-risk activities, Suicide, War', 86.80, 4.3),
('National Insurance Company Ltd', 'National Global Travel', 'Travel', 1700.00, 1100000.00, 1, 18, 75, 0.00, 'Global travel insurance, Comprehensive coverage, Medical emergency, Trip protection', 'Medical expenses, Trip cancellation, Lost baggage, Personal liability, Emergency help', 'Pre-existing conditions, Extreme sports, Intentional injury, War zones', 86.80, 4.4),

-- Royal Sundaram General Travel Plans (2 plans)
('Royal Sundaram General Insurance', 'Royal Sundaram International Travel', 'Travel', 1650.00, 1050000.00, 1, 18, 75, 0.00, 'International travel insurance, Medical emergency, Trip cancellation, Baggage cover', 'Medical expenses, Trip benefits, Lost baggage, Personal accident, Emergency assistance', 'Pre-existing conditions, Adventure sports, Intentional injury, War zones', 87.50, 4.4),
('Royal Sundaram General Insurance', 'Royal Sundaram Global Travel', 'Travel', 1800.00, 1250000.00, 1, 18, 75, 0.00, 'Global travel protection, Comprehensive coverage, Medical emergency, Trip benefits', 'Medical expenses, Trip cancellation/delay, Baggage protection, Personal liability', 'Pre-existing diseases, High-risk sports, Self-harm, War risks', 87.50, 4.5);


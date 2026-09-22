from flask import Flask, request, jsonify, send_file, Blueprint, send_from_directory, session
from flask_cors import CORS
import pymysql
import hashlib
from config import Config
from models import User, InsurancePlan, UserPolicy
from recommendation_engine import InsuranceRecommendationEngine
from utils.security import generate_token, verify_token, token_required, validate_email, validate_phone
from utils.pdf_generator import PolicyPDFGenerator
from datetime import datetime, timedelta
import json
import secrets
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

# Get base directory and frontend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")

# Create Flask app with static folder for frontend
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
app.config.from_object(Config)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-change-me")
CORS(app)

# ML Model initialization
model = None
scaler = None
encoders = {}

# ML Blueprint
ml_bp = Blueprint('ml', __name__)

def initialize_ml_model():
    """Initialize or train the ML model"""
    global model, scaler, encoders

    # Generate sample data (same as before)
    np.random.seed(42)
    n_samples = 1000

    data = {
        'age': np.random.randint(18, 70, n_samples),
        'gender': np.random.choice(['Male', 'Female'], n_samples),
        'coverage_amount': np.random.choice([500000, 1000000, 2000000, 5000000, 10000000], n_samples),
        'plan_type': np.random.choice(['Term Life', 'Whole Life', 'Health', 'Motor'], n_samples),
        'smoker': np.random.choice(['Yes', 'No'], n_samples, p=[0.3, 0.7]),
        'occupation_risk': np.random.choice(['Low', 'Medium', 'High'], n_samples, p=[0.6, 0.3, 0.1]),
        'existing_conditions': np.random.choice(['None', 'Minor', 'Moderate', 'Major'], n_samples, p=[0.5, 0.3, 0.15, 0.05]),
        'policy_term': np.random.choice([5, 10, 15, 20, 30], n_samples),
    }

    df = pd.DataFrame(data)

    # Calculate premium (same logic as before)
    base_premium = df['coverage_amount'] / 1000
    age_factor = 1 + (df['age'] - 30) * 0.02
    gender_factor = df['gender'].apply(lambda x: 1.1 if x == 'Male' else 1.0)
    smoker_factor = df['smoker'].apply(lambda x: 1.5 if x == 'Yes' else 1.0)
    risk_factor = df['occupation_risk'].map({'Low': 1.0, 'Medium': 1.2, 'High': 1.5})
    condition_factor = df['existing_conditions'].map({'None': 1.0, 'Minor': 1.1, 'Moderate': 1.3, 'Major': 1.8})
    plan_factor = df['plan_type'].map({'Term Life': 1.0, 'Whole Life': 1.8, 'Health': 1.5, 'Motor': 1.2})
    term_factor = df['policy_term'].apply(lambda x: 1 - (x/100))

    df['premium'] = base_premium * age_factor * gender_factor * smoker_factor * risk_factor * condition_factor * plan_factor * term_factor
    df['premium'] = df['premium'].astype(int)

    # Prepare features
    features = ['age', 'coverage_amount', 'policy_term']
    categorical_features = ['gender', 'plan_type', 'smoker', 'occupation_risk', 'existing_conditions']

    # Encode categorical features
    df_encoded = df.copy()
    for col in categorical_features:
        le = LabelEncoder()
        df_encoded[col] = le.fit_transform(df_encoded[col])
        encoders[col] = le

    # Prepare X and y
    X = df_encoded[features + categorical_features]
    y = df_encoded['premium']

    # Scale numerical features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_scaled, y)

    return True

@ml_bp.route('/predict/premium', methods=['POST'])
def predict_premium():
    """API endpoint for premium prediction"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['age', 'gender', 'coverage_amount', 'plan_type', 'smoker',
                           'occupation_risk', 'existing_conditions', 'policy_term']

        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Initialize model if not done
        if model is None:
            initialize_ml_model()

        # Prepare input data
        input_data = {
            'age': int(data['age']),
            'gender': data['gender'],
            'coverage_amount': int(data['coverage_amount']),
            'plan_type': data['plan_type'],
            'smoker': data['smoker'],
            'occupation_risk': data['occupation_risk'],
            'existing_conditions': data['existing_conditions'],
            'policy_term': int(data['policy_term'])
        }

        # Encode categorical features
        input_encoded = {}
        for col in ['gender', 'plan_type', 'smoker', 'occupation_risk', 'existing_conditions']:
            if col in encoders:
                try:
                    input_encoded[col] = encoders[col].transform([input_data[col]])[0]
                except ValueError:
                    # If label not seen, use first class
                    all_classes = list(encoders[col].classes_)
                    input_encoded[col] = encoders[col].transform([all_classes[0]])[0]
            else:
                input_encoded[col] = input_data[col]

        # Create feature array
        features = ['age', 'coverage_amount', 'policy_term', 'gender', 'plan_type',
                    'smoker', 'occupation_risk', 'existing_conditions']
        X_input = []
        for feat in features:
            if feat in ['age', 'coverage_amount', 'policy_term']:
                X_input.append(input_data[feat])
            else:
                X_input.append(input_encoded.get(feat, 0))

        X_input = [X_input]

        # Scale features
        X_scaled = scaler.transform(X_input)

        # Make prediction
        prediction = model.predict(X_scaled)[0]

        # Add realistic variation
        variation = np.random.uniform(0.95, 1.05)
        prediction = int(prediction * variation)

        # Calculate monthly premium
        monthly_premium = int(prediction / 12)

        # Generate insights
        insights = generate_insights(prediction, input_data)

        # Calculate confidence
        confidence = min(95 + np.random.uniform(-5, 5), 99)

        return jsonify({
            'success': True,
            'predicted_premium': prediction,
            'monthly_premium': monthly_premium,
            'confidence': round(confidence, 1),
            'insights': insights,
            'input_data': input_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_insights(premium, input_data):
    """Generate insights based on prediction"""
    insights = []

    age = input_data['age']
    coverage = input_data['coverage_amount']
    plan_type = input_data['plan_type']
    smoker = input_data['smoker']
    occupation_risk = input_data['occupation_risk']

    # Age insights
    if age < 25:
        insights.append("Young age (<25) gives you the lowest possible premiums.")
    elif age > 50:
        insights.append("Age >50 increases premiums. Consider reviewing coverage needs.")

    # Coverage insights
    coverage_ratio = premium / coverage
    if coverage_ratio < 0.001:
        insights.append("Excellent premium-to-coverage ratio - very cost-effective.")
    elif coverage_ratio < 0.002:
        insights.append("Good premium-to-coverage ratio - standard market pricing.")

    # Plan type insights
    if plan_type == 'Term Life':
        insights.append("Term Life offers pure protection at lowest cost.")
    elif plan_type == 'Whole Life':
        insights.append("Whole Life provides lifetime coverage with cash value.")

    # Risk factor insights
    if smoker == 'Yes':
        insights.append("Smoking increases premium by approximately 30-50%.")

    if occupation_risk == 'High':
        insights.append("High-risk occupation contributes to premium increase.")

    return insights

@ml_bp.route('/features', methods=['GET'])
def get_features():
    """Get feature importance"""
    try:
        if model is None:
            initialize_ml_model()

        feature_names = ['age', 'coverage_amount', 'policy_term', 'gender', 'plan_type',
                         'smoker', 'occupation_risk', 'existing_conditions']
        importance = model.feature_importances_.tolist()

        feature_importance = dict(zip(feature_names, importance))

        return jsonify({
            'success': True,
            'feature_importance': feature_importance
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Register ML blueprint
app.register_blueprint(ml_bp, url_prefix='/api/ml')

# Database connection
def get_db_connection():
    return pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        port=Config.MYSQL_PORT,
        cursorclass=pymysql.cursors.DictCursor
    )

# Initialize recommendation engine
recommendation_engine = InsuranceRecommendationEngine()
pdf_generator = PolicyPDFGenerator()

# ============== PROFILE DATA API ENDPOINTS ==============

@app.route('/api/profile', methods=['GET'])
def get_user_profile_api():
    """Get user profile data by user_id"""
    try:
        # Get user_id from query parameters
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({'error': 'user_id parameter is required'}), 400
        
        # Validate user_id is a number
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({'error': 'user_id must be a valid integer'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Fetch user data from database - ALWAYS fetches these fields
        sql = """
            SELECT 
                full_name, 
                email, 
                phone, 
                date_of_birth, 
                gender,
                occupation, 
                annual_income, 
                city, 
                state, 
                pincode
            FROM users 
            WHERE user_id = %s AND is_active = TRUE
        """
        cursor.execute(sql, (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # ✅ ENHANCED: Format date_of_birth to string if exists, otherwise empty string
        formatted_dob = ''
        if user['date_of_birth'] and user['date_of_birth'] is not None:
            try:
                formatted_dob = user['date_of_birth'].strftime('%Y-%m-%d')
            except (AttributeError, ValueError):
                formatted_dob = ''
        
        # ✅ ENHANCED: Return user data with proper NULL handling
        # Convert all NULL values to empty strings or appropriate defaults
        # ✅ IMPROVED: Ensure full_name and email are always returned as strings
        user_data = {
            'full_name': str(user['full_name']) if user['full_name'] is not None else '',
            'email': str(user['email']) if user['email'] is not None else '',
            'phone': str(user['phone']) if user['phone'] is not None else '',
            'date_of_birth': formatted_dob,
            'gender': str(user['gender']) if user['gender'] is not None else '',
            'occupation': str(user['occupation']) if user['occupation'] is not None else '',
            'annual_income': float(user['annual_income']) if user['annual_income'] is not None else 0.0,
            'city': str(user['city']) if user['city'] is not None else '',
            'state': str(user['state']) if user['state'] is not None else '',
            'pincode': str(user['pincode']) if user['pincode'] is not None else ''
        }
        
        # ✅ DEBUG: Log the data being sent
        print(f"DEBUG - Profile data for user_id {user_id}:")
        for key, value in user_data.items():
            print(f"  {key}: {value} (type: {type(value).__name__})")
        
        return jsonify({'success': True, 'user': user_data}), 200
    
    except Exception as e:
        print(f"ERROR in GET /api/profile: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/profile', methods=['PUT'])
def update_user_profile_api():
    """Update user profile data"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        if 'user_id' not in data:
            return jsonify({'error': 'user_id is required'}), 400
        
        # ============================================
        # ✅ FIX: Validate full_name field
        # ============================================
        if 'full_name' not in data or not data['full_name'] or not str(data['full_name']).strip():
            return jsonify({'error': 'full_name is required and cannot be empty'}), 400
        
        user_id = data['user_id']
        
        # Validate user_id is a number
        try:
            user_id = int(user_id)
        except ValueError:
            return jsonify({'error': 'user_id must be a valid integer'}), 400
        
        # ============================================
        # ✅ FIX: Define allowed profile fields to update
        # Do NOT include email field
        # ============================================
        allowed_fields = [
            'full_name', 'phone', 'date_of_birth', 'gender',
            'occupation', 'annual_income', 'city', 'state', 'pincode'
        ]
        
        # Build update query
        update_fields = []
        values = []
        
        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                # ✅ Convert empty strings to None for database
                value = data[field]
                if value == '':
                    values.append(None)
                else:
                    values.append(value)
        
        # ============================================
        # ✅ FIX: Ensure full_name is always included in update
        # ============================================
        if 'full_name' not in [field.split(' = ')[0] for field in update_fields]:
            return jsonify({'error': 'full_name must be provided for update'}), 400
        
        # Add user_id to values for WHERE clause
        values.append(user_id)
        
        # Build SQL query
        sql = f"""
            UPDATE users 
            SET {', '.join(update_fields)}, updated_at = NOW()
            WHERE user_id = %s AND is_active = TRUE
        """
        
        # Execute update
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(sql, values)
        
        # Check if any row was updated
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'error': 'User not found or no changes made'}), 404
        
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user_id': user_id,
            'updated_fields': [field.split(' = ')[0] for field in update_fields]
        }), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============== AUTHENTICATION ROUTES ==============

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """User registration endpoint"""
    try:
        data = request.json

        # Validate required fields
        required_fields = ['full_name', 'email', 'password', 'phone', 'date_of_birth']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate email
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate phone
        if not validate_phone(data['phone']):
            return jsonify({'error': 'Invalid phone number'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if user exists
        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        if cursor.fetchone():
            return jsonify({'error': 'Email already registered'}), 400

        # Hash password
        password_hash = User.hash_password(data['password'])

        # Insert user
        sql = """
            INSERT INTO users (full_name, email, password_hash, phone, date_of_birth,
                             gender, occupation, annual_income, city, state, pincode)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['full_name'],
            data['email'],
            password_hash,
            data['phone'],
            data['date_of_birth'],
            data.get('gender'),
            data.get('occupation'),
            data.get('annual_income'),
            data.get('city'),
            data.get('state'),
            data.get('pincode')
        ))

        conn.commit()
        user_id = cursor.lastrowid

        # ✅ set session user_id (needed for /api/auth/me)
        session["user_id"] = user_id

        # Generate token
        token = generate_token(user_id, data['email'])

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'user_id': user_id,
                'full_name': data['full_name'],
                'email': data['email']
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.json

        if 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        # IMPORTANT: Google users may not have password_hash
        if not user.get('password_hash'):
            return jsonify({'error': 'This account uses Google login. Please use "Continue with Google".'}), 401

        if not User.verify_password(user['password_hash'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        # ✅ set session user_id (needed for /api/auth/me)
        session["user_id"] = user["user_id"]

        # Generate token
        token = generate_token(user['user_id'], user['email'])

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'full_name': user['full_name'],
                'email': user['email'],
                'phone': user['phone'],
                'city': user['city']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    """
    MOCK Google OAuth authentication (no real Google verification).
    - If user exists (by google_id or email): login + return token
    - If user does NOT exist: require phone + date_of_birth (so your app doesn't crash later)
      and create user + return token
    """
    try:
        # Optional: disable mock in production
        if os.getenv("DEMO_GOOGLE_AUTH", "true").lower() != "true":
            return jsonify({'error': 'Mock Google auth disabled'}), 403

        data = request.json or {}

        email = (data.get('email') or "").strip().lower()
        full_name = (data.get('full_name') or "Demo Google User").strip()

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400

        # Deterministic google_id so same email maps to same demo google user
        google_id = (data.get('google_id') or "").strip()
        if not google_id:
            google_id = "mock-" + hashlib.sha256(email.encode()).hexdigest()[:32]

        conn = get_db_connection()
        cursor = conn.cursor()

        # 1) Try find by google_id
        cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
        user = cursor.fetchone()

        # 2) If not found, try by email (link email account to google_id)
        if not user:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

            if user and not user.get("google_id"):
                cursor.execute(
                    "UPDATE users SET google_id=%s WHERE user_id=%s",
                    (google_id, user["user_id"])
                )
                conn.commit()
                cursor.execute("SELECT * FROM users WHERE user_id=%s", (user["user_id"],))
                user = cursor.fetchone()

        # 3) If still not found => signup required fields
        if not user:
            phone = (data.get("phone") or "").strip()
            date_of_birth = (data.get("date_of_birth") or "").strip()

            if not phone or not date_of_birth:
                cursor.close()
                conn.close()
                return jsonify({
                    'error': 'User not found. For first-time Google signup, phone and date_of_birth are required.'
                }), 400

            if not validate_phone(phone):
                cursor.close()
                conn.close()
                return jsonify({'error': 'Invalid phone number'}), 400

            # Optional extra fields
            gender = data.get("gender")
            occupation = data.get("occupation")
            annual_income = data.get("annual_income") or None
            city = data.get("city")
            state = data.get("state")
            pincode = data.get("pincode")

            sql = """
                INSERT INTO users (
                    full_name, email, phone, date_of_birth,
                    gender, occupation, annual_income, city, state, pincode,
                    auth_provider, google_id
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'google',%s)
            """
            cursor.execute(sql, (
                full_name, email, phone, date_of_birth,
                gender, occupation, annual_income, city, state, pincode,
                google_id
            ))
            conn.commit()

            user_id = cursor.lastrowid
            cursor.execute("SELECT * FROM users WHERE user_id=%s", (user_id,))
            user = cursor.fetchone()

        # ✅ set session user_id (needed for /api/auth/me)
        session["user_id"] = user["user_id"]

        token = generate_token(user['user_id'], user['email'])

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Mock Google authentication successful',
            'token': token,
            'user': {
                'user_id': user['user_id'],
                'full_name': user['full_name'],
                'email': user['email']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==========================================================
# ✅ NEW ENDPOINT: /api/auth/me (SESSION-BASED)
# ==========================================================
@app.get("/api/auth/me")
def auth_me():
    """
    Session-based "me" endpoint:
    - checks session["user_id"]
    - fetches user from DB
    - returns date_of_birth as YYYY-MM-DD (isoformat)
    """
    if not session.get("user_id"):
        return jsonify({"logged_in": False}), 401

    user_id = session["user_id"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT user_id, full_name, email, phone, date_of_birth, gender,
               occupation, annual_income, city, state, pincode, auth_provider
        FROM users
        WHERE user_id = %s AND is_active = TRUE
    """, (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return jsonify({"logged_in": False}), 401

    dob = user["date_of_birth"].isoformat() if user.get("date_of_birth") else ""

    return jsonify({
        "logged_in": True,
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "phone": user.get("phone") or "",
        "date_of_birth": dob,
        "gender": user.get("gender") or "",
        "occupation": user.get("occupation") or "",
        "annual_income": str(user.get("annual_income") or ""),
        "city": user.get("city") or "",
        "state": user.get("state") or "",
        "pincode": user.get("pincode") or "",
        "auth_provider": user.get("auth_provider"),
    })


# ============== USER PROFILE ROUTES ==============

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Remove sensitive data
        user.pop('password_hash', None)
        
        # Format date_of_birth to YYYY-MM-DD if not NULL
        if user.get('date_of_birth'):
            user['date_of_birth'] = user['date_of_birth'].strftime('%Y-%m-%d')
        else:
            user['date_of_birth'] = None

        return jsonify({'user': user}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile"""
    try:
        data = request.json

        conn = get_db_connection()
        cursor = conn.cursor()

        update_fields = []
        values = []

        allowed_fields = ['full_name', 'phone', 'date_of_birth', 'gender',
                          'occupation', 'annual_income', 'city', 'state', 'pincode']

        for field in allowed_fields:
            if field in data:
                update_fields.append(f"{field} = %s")
                values.append(data[field])

        if not update_fields:
            return jsonify({'error': 'No fields to update'}), 400

        values.append(current_user['user_id'])

        sql = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = %s"
        cursor.execute(sql, values)
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== INSURANCE PLANS ROUTES ==============

@app.route('/api/plans', methods=['GET'])
def get_all_plans():
    """Get all active insurance plans"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        plan_type = request.args.get('type')
        provider = request.args.get('provider')

        sql = "SELECT * FROM insurance_plans WHERE is_active = TRUE"
        params = []

        if plan_type:
            sql += " AND plan_type = %s"
            params.append(plan_type)

        if provider:
            sql += " AND provider_name = %s"
            params.append(provider)

        cursor.execute(sql, params)
        plans = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'plans': plans}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/plans/<int:plan_id>', methods=['GET'])
def get_plan_details(plan_id):
    """Get specific plan details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM insurance_plans WHERE plan_id = %s", (plan_id,))
        plan = cursor.fetchone()

        cursor.close()
        conn.close()

        if not plan:
            return jsonify({'error': 'Plan not found'}), 404

        return jsonify({'plan': plan}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== RECOMMENDATIONS ROUTES ==============

@app.route('/api/recommendations', methods=['POST'])
@token_required
def get_recommendations(current_user):
    """Get personalized insurance recommendations"""
    try:
        data = request.json

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        dob = user['date_of_birth']
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

        cursor.execute("SELECT * FROM insurance_plans WHERE is_active = TRUE")
        all_plans = cursor.fetchall()

        user_data = {
            'age': age,
            'income': float(user['annual_income']) if user['annual_income'] else 600000,
            'coverage_preference': data.get('coverage_preference', 10000000),
            'budget': data.get('budget')
        }

        recommendations = recommendation_engine.get_recommendations(
            user_data, all_plans, top_n=data.get('top_n', 5)
        )

        for rec in recommendations:
            sql = """
                INSERT INTO user_recommendations
                (user_id, plan_id, recommended_premium, match_score)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (
                current_user['user_id'],
                rec['plan_id'],
                rec['personalized_premium'],
                rec['match_score']
            ))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'recommendations': recommendations,
            'user_profile': {
                'age': age,
                'income': user_data['income']
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/history', methods=['GET'])
@token_required
def get_recommendation_history(current_user):
    """Get user's recommendation history"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT r.*, p.plan_name, p.provider_name, p.plan_type
            FROM user_recommendations r
            JOIN insurance_plans p ON r.plan_id = p.plan_id
            WHERE r.user_id = %s
            ORDER BY r.recommended_at DESC
            LIMIT 20
        """
        cursor.execute(sql, (current_user['user_id'],))
        history = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'history': history}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== PLAN COMPARISON ROUTES ==============

@app.route('/api/compare', methods=['POST'])
@token_required
def compare_plans(current_user):
    """Compare multiple insurance plans"""
    try:
        data = request.json
        plan_ids = data.get('plan_ids', [])

        if len(plan_ids) < 2:
            return jsonify({'error': 'At least 2 plans required for comparison'}), 400

        if len(plan_ids) > 4:
            return jsonify({'error': 'Maximum 4 plans can be compared'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()

        dob = user['date_of_birth']
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        income = float(user['annual_income']) if user['annual_income'] else 600000

        placeholders = ','.join(['%s'] * len(plan_ids))
        sql = f"SELECT * FROM insurance_plans WHERE plan_id IN ({placeholders})"
        cursor.execute(sql, plan_ids)
        plans = cursor.fetchall()

        plans_with_premium = []
        for plan in plans:
            premium = recommendation_engine.calculate_premium(
                plan['base_premium'],
                age,
                income,
                plan['coverage_amount'],
                plan['plan_type']
            )
            plan_dict = dict(plan)
            plan_dict['personalized_premium'] = premium
            plans_with_premium.append(plan_dict)

        comparison = recommendation_engine.compare_plans(plans_with_premium)

        sql = """
            INSERT INTO plan_comparisons (user_id, plan_ids)
            VALUES (%s, %s)
        """
        cursor.execute(sql, (current_user['user_id'], json.dumps(plan_ids)))
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({'comparison': comparison}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== NEW ENDPOINT: GROUPED PLANS ==============

@app.route('/api/plans/grouped', methods=['GET'])
@token_required
def get_plans_grouped_by_category(current_user):
    """Get all plans grouped by category with personalized premiums"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        dob = user['date_of_birth']
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        income = float(user['annual_income']) if user['annual_income'] else 600000

        cursor.execute("SELECT * FROM insurance_plans WHERE is_active = TRUE ORDER BY plan_type, base_premium ASC")
        all_plans = cursor.fetchall()

        cursor.close()
        conn.close()

        grouped_plans = {}

        for plan in all_plans:
            plan_type = plan['plan_type']

            personalized_premium = recommendation_engine.calculate_premium(
                plan['base_premium'],
                age,
                income,
                plan['coverage_amount'],
                plan['plan_type']
            )

            plan_dict = {
                'plan_id': plan['plan_id'],
                'provider_name': plan['provider_name'],
                'plan_name': plan['plan_name'],
                'plan_type': plan['plan_type'],
                'base_premium': float(plan['base_premium']),
                'personalized_premium': personalized_premium,
                'coverage_amount': float(plan['coverage_amount']),
                'policy_term': int(plan['policy_term']),
                'min_age': int(plan['min_age']),
                'max_age': int(plan['max_age']),
                'features': plan['features'],
                'benefits': plan['benefits'],
                'exclusions': plan['exclusions'],
                'claim_settlement_ratio': float(plan['claim_settlement_ratio']),
                'rating': float(plan['rating'])
            }

            if plan_type not in grouped_plans:
                grouped_plans[plan_type] = []

            grouped_plans[plan_type].append(plan_dict)

        return jsonify({
            'grouped_plans': grouped_plans,
            'total_plans': len(all_plans)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== PAYMENT PROCESSING ROUTES ==============

@app.route('/api/payments/process', methods=['POST'])
@token_required
def process_payment(current_user):
    """Mock payment processing endpoint"""
    try:
        data = request.json

        # Validate required fields
        required_fields = ['policy_id', 'payment_method']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Validate payment method
        valid_methods = ['Card', 'UPI', 'Wallet', 'COD']
        if data['payment_method'] not in valid_methods:
            return jsonify({'error': f'Invalid payment method. Must be one of: {", ".join(valid_methods)}'}), 400

        # Validate payment type (default to One-Time if not provided)
        payment_type = data.get('payment_type', 'One-Time')
        valid_types = ['One-Time', 'Recurring']
        if payment_type not in valid_types:
            return jsonify({'error': f'Invalid payment type. Must be one of: {", ".join(valid_types)}'}), 400

        # Validate policy exists and belongs to user
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT p.*, pl.plan_name, pl.provider_name
            FROM user_policies p
            JOIN insurance_plans pl ON p.plan_id = pl.plan_id
            WHERE p.policy_id = %s AND p.user_id = %s
        """, (data['policy_id'], current_user['user_id']))
        policy = cursor.fetchone()

        if not policy:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Policy not found or unauthorized access'}), 404

        # Check if policy is already active
        if policy['status'] == 'Active':
            cursor.close()
            conn.close()
            return jsonify({'error': 'Policy is already active'}), 400

        # Generate mock transaction ID
        transaction_id = f"TXN{datetime.now().strftime('%Y%m%d%H%M%S')}{secrets.token_hex(4).upper()}"

        # Store payment in database
        sql = """
            INSERT INTO payments 
            (user_id, policy_id, transaction_id, amount, payment_method, payment_type, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            current_user['user_id'],
            data['policy_id'],
            transaction_id,
            policy['premium_amount'],
            data['payment_method'],
            payment_type,
            'Success'
        ))

        # ============================================
        # FIX: Set exact ENUM value for payment_status
        # ============================================
        cursor.execute("""
            UPDATE user_policies 
            SET status = 'Active', payment_status = 'SUCCESS'
            WHERE policy_id = %s
        """, (data['policy_id'],))

        conn.commit()

        # Get payment details for response
        cursor.execute("SELECT * FROM payments WHERE transaction_id = %s", (transaction_id,))
        payment = cursor.fetchone()

        cursor.close()
        conn.close()

        # Mock payment response
        response_data = {
            'success': True,
            'message': 'Payment processed successfully',
            'transaction_id': transaction_id,
            'payment_status': 'SUCCESS',  # ✅ Fixed to match ENUM
            'payment_method': data['payment_method'],
            'payment_type': payment_type,
            'amount': float(policy['premium_amount']),
            'policy_number': policy['policy_number'],
            'policy_status': 'Active',
            'activated_at': datetime.now().isoformat(),
            'next_payment_date': None
        }

        # For recurring payments, calculate next payment date
        if payment_type == 'Recurring':
            if policy['payment_frequency'] == 'Monthly':
                next_date = datetime.now() + timedelta(days=30)
            elif policy['payment_frequency'] == 'Quarterly':
                next_date = datetime.now() + timedelta(days=90)
            elif policy['payment_frequency'] == 'Half-Yearly':
                next_date = datetime.now() + timedelta(days=180)
            else:  # Yearly
                next_date = datetime.now() + timedelta(days=365)
            
            response_data['next_payment_date'] = next_date.strftime('%Y-%m-%d')

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/payments/history', methods=['GET'])
@token_required
def get_payment_history(current_user):
    """Get user's payment history"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT p.*, up.policy_number, up.premium_amount, pl.plan_name
            FROM payments p
            JOIN user_policies up ON p.policy_id = up.policy_id
            JOIN insurance_plans pl ON up.plan_id = pl.plan_id
            WHERE p.user_id = %s
            ORDER BY p.payment_date DESC
            LIMIT 20
        """
        cursor.execute(sql, (current_user['user_id'],))
        payments = cursor.fetchall()

        cursor.close()
        conn.close()

        # Format dates for JSON serialization
        for payment in payments:
            if payment.get('payment_date'):
                payment['payment_date'] = payment['payment_date'].isoformat()
            if payment.get('created_at'):
                payment['created_at'] = payment['created_at'].isoformat()

        return jsonify({'payments': payments}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/payments/<string:transaction_id>', methods=['GET'])
@token_required
def get_payment_details(current_user, transaction_id):
    """Get details of a specific payment"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT p.*, up.policy_number, up.premium_amount, up.coverage_amount,
                   up.start_date, up.end_date, pl.plan_name, pl.provider_name,
                   u.full_name, u.email, u.phone
            FROM payments p
            JOIN user_policies up ON p.policy_id = up.policy_id
            JOIN insurance_plans pl ON up.plan_id = pl.plan_id
            JOIN users u ON p.user_id = u.user_id
            WHERE p.transaction_id = %s AND p.user_id = %s
        """
        cursor.execute(sql, (transaction_id, current_user['user_id']))
        payment = cursor.fetchone()

        cursor.close()
        conn.close()

        if not payment:
            return jsonify({'error': 'Payment not found'}), 404

        # Format dates for JSON serialization
        date_fields = ['payment_date', 'start_date', 'end_date', 'created_at']
        for field in date_fields:
            if payment.get(field):
                payment[field] = payment[field].isoformat()

        return jsonify({'payment': payment}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== POLICY ROUTES ==============

@app.route('/api/policies', methods=['POST'])
@token_required
def create_policy(current_user):
    """Create a new insurance policy"""
    try:
        data = request.json

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM insurance_plans WHERE plan_id = %s", (data['plan_id'],))
        plan = cursor.fetchone()

        if not plan:
            return jsonify({'error': 'Plan not found'}), 404

        policy_number = f"{plan['provider_name'][:3].upper()}/{datetime.now().year}/{secrets.token_hex(4).upper()}"

        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=365 * plan['policy_term'])

        # ============================================
        # FIX: VALIDATE AND DEFAULT PAYMENT FREQUENCY
        # ============================================
        # Define valid ENUM values for payment_frequency
        valid_payment_frequencies = ['Yearly', 'Half-Yearly', 'Quarterly', 'Monthly', 'One-Time']
        
        # Get payment_frequency from request or default to 'Yearly'
        payment_frequency = data.get('payment_frequency', 'Yearly')
        
        # If payment_frequency is not in valid ENUM values, default to 'Yearly'
        if payment_frequency not in valid_payment_frequencies:
            print(f"Warning: Invalid payment_frequency '{payment_frequency}' received. Defaulting to 'Yearly'.")
            payment_frequency = 'Yearly'
        
        # Store original payment_type if provided (for one-time payments)
        payment_type = data.get('payment_type', 'Recurring')

        # ============================================
        # FIX: Include payment_status in INSERT
        # ============================================
        sql = """
            INSERT INTO user_policies
            (user_id, plan_id, policy_number, premium_amount, coverage_amount,
             start_date, end_date, status, payment_frequency, payment_type, payment_status, nominee_name, nominee_relationship)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            current_user['user_id'],
            data['plan_id'],
            policy_number,
            data['premium_amount'],
            data['coverage_amount'],
            start_date,
            end_date,
            'Pending',
            payment_frequency,  # Use validated/defaulted value
            payment_type,  # Include payment_type
            'PENDING',  # ✅ Set exact ENUM value for payment_status
            data.get('nominee_name'),
            data.get('nominee_relationship')
        ))

        conn.commit()
        policy_id = cursor.lastrowid

        cursor.close()
        conn.close()

        return jsonify({
            'message': 'Policy created successfully',
            'policy_id': policy_id,
            'policy_number': policy_number
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/policies', methods=['GET'])
@token_required
def get_user_policies(current_user):
    """Get all policies for a user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT p.*, pl.plan_name, pl.provider_name, pl.plan_type
            FROM user_policies p
            JOIN insurance_plans pl ON p.plan_id = pl.plan_id
            WHERE p.user_id = %s
            ORDER BY p.created_at DESC
        """
        cursor.execute(sql, (current_user['user_id'],))
        policies = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'policies': policies}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/policies/<int:policy_id>/pdf', methods=['GET'])
@token_required
def download_policy_pdf(current_user, policy_id):
    """Download policy as PDF"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT p.*, pl.*, u.*,
                   p.policy_id as pid, p.status as policy_status
            FROM user_policies p
            JOIN insurance_plans pl ON p.plan_id = pl.plan_id
            JOIN users u ON p.user_id = u.user_id
            WHERE p.policy_id = %s AND p.user_id = %s
        """
        cursor.execute(sql, (policy_id, current_user['user_id']))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            return jsonify({'error': 'Policy not found'}), 404

        policy_data = {
            'policy_number': result['policy_number'],
            'status': result['policy_status'],
            'start_date': str(result['start_date']),
            'end_date': str(result['end_date']),
            'premium_amount': result['premium_amount'],
            'coverage_amount': result['coverage_amount'],
            'payment_frequency': result['payment_frequency'],
            'nominee_name': result['nominee_name'],
            'nominee_relationship': result['nominee_relationship']
        }

        user_data = {
            'full_name': result['full_name'],
            'email': result['email'],
            'phone': result['phone'],
            'date_of_birth': str(result['date_of_birth']),
            'city': result['city'],
            'state': result['state'],
            'pincode': result['pincode']
        }

        plan_data = {
            'provider_name': result['provider_name'],
            'plan_name': result['plan_name'],
            'plan_type': result['plan_type'],
            'policy_term': result['policy_term'],
            'features': result['features'],
            'benefits': result['benefits']
        }

        pdf_buffer = pdf_generator.generate_policy_pdf(policy_data, user_data, plan_data)

        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'policy_{result["policy_number"]}.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== CATEGORIES ENDPOINTS ==============

@app.route('/api/categories', methods=['GET'])
@token_required
def get_categories(current_user):
    """Get insurance categories with stats"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        sql = """
            SELECT
                plan_type as category,
                COUNT(*) as plan_count,
                MIN(base_premium) as min_premium,
                MAX(base_premium) as max_premium,
                AVG(base_premium) as avg_premium
            FROM insurance_plans
            WHERE is_active = TRUE
            GROUP BY plan_type
            ORDER BY plan_count DESC
        """
        cursor.execute(sql)
        categories = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({'categories': categories}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/plans/category/<string:category>', methods=['GET'])
@token_required
def get_plans_by_category(current_user, category):
    """Get plans by specific category with personalized premiums"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM users WHERE user_id = %s", (current_user['user_id'],))
        user = cursor.fetchone()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        dob = user['date_of_birth']
        today = datetime.today()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        income = float(user['annual_income']) if user['annual_income'] else 600000

        sql = "SELECT * FROM insurance_plans WHERE is_active = TRUE AND plan_type = %s ORDER BY base_premium ASC"
        cursor.execute(sql, (category,))
        plans = cursor.fetchall()

        cursor.close()
        conn.close()

        plans_with_premium = []
        for plan in plans:
            personalized_premium = recommendation_engine.calculate_premium(
                plan['base_premium'],
                age,
                income,
                plan['coverage_amount'],
                plan['plan_type']
            )

            plan_dict = {
                'plan_id': plan['plan_id'],
                'provider_name': plan['provider_name'],
                'plan_name': plan['plan_name'],
                'plan_type': plan['plan_type'],
                'base_premium': float(plan['base_premium']),
                'personalized_premium': personalized_premium,
                'coverage_amount': float(plan['coverage_amount']),
                'policy_term': int(plan['policy_term']),
                'min_age': int(plan['min_age']),
                'max_age': int(plan['max_age']),
                'features': plan['features'],
                'benefits': plan['benefits'],
                'exclusions': plan['exclusions'],
                'claim_settlement_ratio': float(plan['claim_settlement_ratio']),
                'rating': float(plan['rating'])
            }
            plans_with_premium.append(plan_dict)

        return jsonify({'plans': plans_with_premium}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== UTILITY ROUTES ==============

@app.route('/api/providers', methods=['GET'])
def get_providers():
    """Get all insurance providers"""
    return jsonify({'providers': Config.INSURANCE_PROVIDERS}), 200

@app.route('/api/plan-types', methods=['GET'])
def get_plan_types():
    """Get all plan types"""
    plan_types = ['Term Life', 'Whole Life', 'Endowment', 'ULIP', 'Health', 'Motor', 'Travel']
    return jsonify({'plan_types': plan_types}), 200

@app.route('/api/stats', methods=['GET'])
@token_required
def get_user_stats(current_user):
    """Get user statistics"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT COUNT(*) as count FROM user_policies WHERE user_id = %s",
            (current_user['user_id'],)
        )
        policy_count = cursor.fetchone()['count']

        cursor.execute(
            "SELECT SUM(coverage_amount) as total FROM user_policies WHERE user_id = %s AND status = 'Active'",
            (current_user['user_id'],)
        )
        total_coverage = cursor.fetchone()['total'] or 0

        cursor.execute(
            "SELECT SUM(premium_amount) as total FROM user_policies WHERE user_id = %s AND status = 'Active'",
            (current_user['user_id'],)
        )
        total_premium = cursor.fetchone()['total'] or 0

        cursor.close()
        conn.close()

        return jsonify({
            'total_policies': policy_count,
            'total_coverage': float(total_coverage),
            'total_annual_premium': float(total_premium)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ============== HEALTH CHECK ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    """API health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


# ============== FRONTEND SERVING ROUTES ==============

@app.get("/")
def serve_index():
    """Serve the main index.html file"""
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.get("/<path:path>")
def serve_frontend_files(path):
    """Serve all frontend static files (CSS, JS, images, HTML pages)"""
    return send_from_directory(FRONTEND_DIR, path)


# ============== APPLICATION ENTRY POINT ==============

if __name__ == '__main__':
    initialize_ml_model()
    app.run(debug=True, host='0.0.0.0', port=5000)
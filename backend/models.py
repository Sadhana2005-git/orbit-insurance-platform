from datetime import datetime
import bcrypt

class User:
    def __init__(self, user_id=None, full_name=None, email=None, password_hash=None,
                 phone=None, date_of_birth=None, gender=None, occupation=None,
                 annual_income=None, city=None, state=None, pincode=None,
                 auth_provider='email', google_id=None):
        self.user_id = user_id
        self.full_name = full_name
        self.email = email
        self.password_hash = password_hash
        self.phone = phone
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.occupation = occupation
        self.annual_income = annual_income
        self.city = city
        self.state = state
        self.pincode = pincode
        self.auth_provider = auth_provider
        self.google_id = google_id
       
    @staticmethod
    def hash_password(password):
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
   
    @staticmethod
    def verify_password(password_hash, password):
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
   
    def get_age(self):
        if self.date_of_birth:
            today = datetime.today()
            dob = datetime.strptime(str(self.date_of_birth), '%Y-%m-%d')
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None

class InsurancePlan:
    def __init__(self, plan_id=None, provider_name=None, plan_name=None, plan_type=None,
                 base_premium=None, coverage_amount=None, policy_term=None,
                 min_age=None, max_age=None, min_income=None, features=None,
                 benefits=None, exclusions=None, claim_settlement_ratio=None, rating=None):
        self.plan_id = plan_id
        self.provider_name = provider_name
        self.plan_name = plan_name
        self.plan_type = plan_type
        self.base_premium = base_premium
        self.coverage_amount = coverage_amount
        self.policy_term = policy_term
        self.min_age = min_age
        self.max_age = max_age
        self.min_income = min_income
        self.features = features
        self.benefits = benefits
        self.exclusions = exclusions
        self.claim_settlement_ratio = claim_settlement_ratio
        self.rating = rating

class UserPolicy:
    def __init__(self, policy_id=None, user_id=None, plan_id=None, policy_number=None,
                 premium_amount=None, coverage_amount=None, start_date=None,
                 end_date=None, status='Pending', payment_frequency='Yearly',
                 nominee_name=None, nominee_relationship=None):
        self.policy_id = policy_id
        self.user_id = user_id
        self.plan_id = plan_id
        self.policy_number = policy_number
        self.premium_amount = premium_amount
        self.coverage_amount = coverage_amount
        self.start_date = start_date
        self.end_date = end_date
        self.status = status
        self.payment_frequency = payment_frequency
        self.nominee_name = nominee_name
        self.nominee_relationship = nominee_relationship

class Payment:
    def __init__(self, payment_id=None, user_id=None, policy_id=None, payment_method=None,
                 payment_type=None, amount=None, payment_status=None, transaction_ref=None,
                 paid_at=None):
        self.payment_id = payment_id
        self.user_id = user_id
        self.policy_id = policy_id
        self.payment_method = payment_method
        self.payment_type = payment_type
        self.amount = amount
        self.payment_status = payment_status
        self.transaction_ref = transaction_ref
        self.paid_at = paid_at if paid_at else datetime.now()
    
    def to_dict(self):
        """Convert payment object to dictionary for JSON serialization"""
        return {
            'payment_id': self.payment_id,
            'user_id': self.user_id,
            'policy_id': self.policy_id,
            'payment_method': self.payment_method,
            'payment_type': self.payment_type,
            'amount': float(self.amount) if self.amount else None,
            'payment_status': self.payment_status,
            'transaction_ref': self.transaction_ref,
            'paid_at': self.paid_at.isoformat() if isinstance(self.paid_at, datetime) else self.paid_at
        }
    
    @staticmethod
    def generate_transaction_ref(prefix='PAY'):
        """Generate a unique transaction reference for demonstration"""
        import secrets
        import time
        timestamp = int(time.time())
        random_part = secrets.token_hex(4).upper()
        return f"{prefix}{timestamp}{random_part}"
    
    def is_successful(self):
        """Check if payment was successful"""
        return self.payment_status == 'Completed'
    
    def get_formatted_amount(self):
        """Get formatted amount for receipts"""
        if self.amount:
            return f"₹{float(self.amount):,.2f}"
        return "₹0.00"
    
    def get_formatted_date(self):
        """Get formatted date for receipts"""
        if isinstance(self.paid_at, datetime):
            return self.paid_at.strftime("%d %B %Y, %I:%M %p")
        return "Not Available"
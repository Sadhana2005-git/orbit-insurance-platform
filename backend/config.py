import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'orbit-insurance-secret-key-2024'
   
    # Database Configuration - UPDATED FOR PyMySQL
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or 'password'
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'orbit_insurance'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
   
    # SQLAlchemy Database URI
    SQLALCHEMY_DATABASE_URI = f'mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
   
    # Google OAuth Configuration
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
    GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
   
    # Application Configuration
    UPLOAD_FOLDER = 'uploads'
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
   
    # Insurance Providers
    INSURANCE_PROVIDERS = [
        'Life Insurance Corporation of India (LIC)',
        'SBI Life Insurance',
        'HDFC Life Insurance',
        'ICICI Prudential Life Insurance',
        'Axis Max Life Insurance',
        'Aditya Birla Sun Life Insurance',
        'Reliance General Insurance',
        'Tata AIG General Insurance',
        'Bajaj Allianz General Insurance',
        'New India Assurance Company Ltd',
        'National Insurance Company Ltd',
        'Royal Sundaram General Insurance'
    ]
   
    # Currency
    CURRENCY = '₹'
    CURRENCY_CODE = 'INR'

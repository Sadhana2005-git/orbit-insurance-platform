import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import json

class InsuranceRecommendationEngine:
    def __init__(self):
        self.scaler = StandardScaler()
       
    def calculate_premium(self, base_premium, age, income, coverage, plan_type):
        """
        Calculate personalized premium based on user profile
        """
        # Convert Decimal to float
        base_premium = float(base_premium) if base_premium else 0
        income = float(income) if income else 0
        coverage = float(coverage) if coverage else 0
       
        # Age factor
        if age < 25:
            age_factor = 0.8
        elif age < 35:
            age_factor = 0.9
        elif age < 45:
            age_factor = 1.0
        elif age < 55:
            age_factor = 1.2
        else:
            age_factor = 1.5
           
        # Income factor
        if income < 500000:
            income_factor = 0.9
        elif income < 1000000:
            income_factor = 1.0
        elif income < 2000000:
            income_factor = 1.1
        else:
            income_factor = 1.2
           
        # Coverage factor
        coverage_factor = coverage / 10000000  # Normalized to 1 crore
       
        # Plan type factor
        plan_type_factors = {
            'Term Life': 1.0,
            'Whole Life': 1.3,
            'Endowment': 1.5,
            'ULIP': 1.6,
            'Health': 0.8
        }
        plan_factor = plan_type_factors.get(plan_type, 1.0)
       
        calculated_premium = base_premium * age_factor * income_factor * plan_factor
       
        return round(calculated_premium, 2)
   
    def get_recommendations(self, user_data, all_plans, top_n=5):
        """
        Get personalized insurance recommendations
        user_data: dict with keys: age, income, coverage_preference
        all_plans: list of plan dictionaries
        """
        age = user_data.get('age')
        income = float(user_data.get('income', 0))
        coverage_preference = float(user_data.get('coverage_preference', 10000000))
        budget = float(user_data.get('budget')) if user_data.get('budget') else None
       
        recommendations = []
       
        for plan in all_plans:
            # Convert plan values to float
            min_age = int(plan['min_age']) if plan['min_age'] else 0
            max_age = int(plan['max_age']) if plan['max_age'] else 100
            min_income = float(plan['min_income']) if plan['min_income'] else 0
           
            # Check eligibility
            if age < min_age or age > max_age:
                continue
               
            if min_income > 0 and income < min_income:
                continue
           
            # Calculate personalized premium
            personalized_premium = self.calculate_premium(
                plan['base_premium'],
                age,
                income,
                plan['coverage_amount'],
                plan['plan_type']
            )
           
            # Check budget constraint
            if budget and personalized_premium > budget:
                continue
           
            # Calculate match score
            match_score = self._calculate_match_score(
                user_data, plan, personalized_premium
            )
           
            recommendations.append({
                'plan_id': plan['plan_id'],
                'provider_name': plan['provider_name'],
                'plan_name': plan['plan_name'],
                'plan_type': plan['plan_type'],
                'base_premium': float(plan['base_premium']),
                'personalized_premium': personalized_premium,
                'coverage_amount': float(plan['coverage_amount']),
                'policy_term': int(plan['policy_term']),
                'features': plan['features'],
                'benefits': plan['benefits'],
                'exclusions': plan['exclusions'],
                'claim_settlement_ratio': float(plan['claim_settlement_ratio']),
                'rating': float(plan['rating']),
                'match_score': match_score
            })
       
        # Sort by match score
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
       
        return recommendations[:top_n]
   
    def _calculate_match_score(self, user_data, plan, personalized_premium):
        """
        Calculate how well a plan matches user requirements
        Score: 0-100
        """
        score = 0
       
        # Convert to float
        personalized_premium = float(personalized_premium)
        coverage_pref = float(user_data.get('coverage_preference', 10000000))
        income = float(user_data.get('income', 0))
       
        # Budget alignment (30 points)
        if user_data.get('budget'):
            budget = float(user_data['budget'])
            if personalized_premium <= budget * 0.7:
                score += 30
            elif personalized_premium <= budget * 0.9:
                score += 20
            elif personalized_premium <= budget:
                score += 10
        else:
            score += 15  # Neutral score if no budget specified
       
        # Coverage alignment (25 points)
        plan_coverage = float(plan['coverage_amount'])
        coverage_ratio = plan_coverage / coverage_pref
        if 0.8 <= coverage_ratio <= 1.2:
            score += 25
        elif 0.6 <= coverage_ratio <= 1.5:
            score += 15
        else:
            score += 5
       
        # Claim settlement ratio (20 points)
        csr = float(plan['claim_settlement_ratio'])
        if csr >= 98:
            score += 20
        elif csr >= 96:
            score += 15
        elif csr >= 94:
            score += 10
        else:
            score += 5
       
        # Rating (15 points)
        rating = float(plan['rating'])
        score += (rating / 5) * 15
       
        # Income-based affordability (10 points)
        if income > 0:
            premium_to_income_ratio = (personalized_premium * 12) / income
            if premium_to_income_ratio <= 0.05:
                score += 10
            elif premium_to_income_ratio <= 0.10:
                score += 7
            elif premium_to_income_ratio <= 0.15:
                score += 4
            else:
                score += 1
        else:
            score += 5  # Neutral score
       
        return round(score, 2)
   
    def compare_plans(self, plans):
        """
        Generate detailed comparison of multiple plans
        """
        if not plans or len(plans) < 2:
            return None
       
        # Convert all decimal values to float
        for plan in plans:
            plan['personalized_premium'] = float(plan['personalized_premium'])
            plan['coverage_amount'] = float(plan['coverage_amount'])
            plan['policy_term'] = int(plan['policy_term'])
            plan['claim_settlement_ratio'] = float(plan['claim_settlement_ratio'])
            plan['rating'] = float(plan['rating'])
       
        comparison = {
            'plans': plans,
            'comparison_matrix': {
                'premium': [p['personalized_premium'] for p in plans],
                'coverage': [p['coverage_amount'] for p in plans],
                'term': [p['policy_term'] for p in plans],
                'csr': [p['claim_settlement_ratio'] for p in plans],
                'rating': [p['rating'] for p in plans]
            },
            'best_options': {
                'lowest_premium': min(plans, key=lambda x: x['personalized_premium']),
                'highest_coverage': max(plans, key=lambda x: x['coverage_amount']),
                'best_csr': max(plans, key=lambda x: x['claim_settlement_ratio']),
                'highest_rated': max(plans, key=lambda x: x['rating'])
            }
        }
       
        return comparison

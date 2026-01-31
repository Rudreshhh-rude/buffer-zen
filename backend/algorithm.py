import pandas as pd
import calendar
import os
from datetime import datetime
from typing import Dict, Union
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

# Configuration
RISK_MULTIPLIERS = {
    "Conservative": 0.5,  # Spend 50% of disposable (Save 50% buffer)
    "Moderate": 0.7,      # Spend 70% of disposable (Save 30% buffer)
    "Aggressive": 0.9     # Spend 90% of disposable (Save 10% buffer)
}

# Initialize Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def calculate_budget_metrics(
    fixed_monthly_costs: float = 6500.0, 
    risk_level: str = "Moderate"
) -> Dict[str, Union[float, int, str, bool]]:
    
    # 1. Fetch Data from Supabase
    try:
        response = supabase.table("transactions").select("*").execute()
        if not response.data:
            return {"success": False, "error": "No transaction data found in database", "data": None}
        
        df = pd.DataFrame(response.data)
        df['date'] = pd.to_datetime(df['date'])
    except Exception as e:
        return {"success": False, "error": f"Database Connection Error: {str(e)}", "data": None}

    # 2. Input Validation
    if fixed_monthly_costs < 0:
        return {"success": False, "error": "Fixed costs cannot be negative", "data": None}
    if risk_level not in RISK_MULTIPLIERS:
        return {"success": False, "error": "Invalid risk level", "data": None}

    # 3. Aggregation & Volatility (CV)
    monthly_income = (
        df[df['type'] == 'Income']
        .groupby(pd.Grouper(key='date', freq='ME'))['amount']
        .sum()
    )

    if monthly_income.empty or monthly_income.mean() == 0:
        return {"success": False, "error": "Insufficient income history", "data": None}

    avg_monthly_income = monthly_income.mean()
    cv = (monthly_income.std() or 0) / avg_monthly_income
    volatility_penalty = 0.1 if cv > 0.3 else 0

    # 4. Correct Balance Calculation
    income_total = df[df['type'] == 'Income']['amount'].sum()
    expense_total = df[df['type'] == 'Expense']['amount'].sum()
    current_balance = income_total - expense_total

    # 5. Safe-to-Spend Logic
    confidence_factor = RISK_MULTIPLIERS[risk_level] - volatility_penalty
    total_disposable = (avg_monthly_income - fixed_monthly_costs) * confidence_factor
    
    now = datetime.now()
    days_in_month = calendar.monthrange(now.year, now.month)[1]
    daily_safe_limit = max(0, total_disposable / days_in_month)

    # 6. Survival Horizon
    daily_fixed_burn = fixed_monthly_costs / days_in_month
    if current_balance <= 0:
        survival_days = 0 
    else:
        survival_days = current_balance / daily_fixed_burn if daily_fixed_burn > 0 else 365

    return {
        "success": True,
        "error": None,
        "data": {
            "daily_limit": round(daily_safe_limit, 2),
            "monthly_avg": round(avg_monthly_income, 2),
            "volatility_score": "High" if volatility_penalty > 0 else "Low",
            "survival_horizon": round(survival_days),
            "current_balance": round(current_balance, 2)
        }
    }  
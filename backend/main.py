import os
import re
import io
import calendar
import logging
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import FastAPI, Query, HTTPException, APIRouter, File, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path
from PIL import Image
import pytesseract

# --- LOGGING ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- TESSERACT (Windows only) ---
if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- CONFIG ---
load_dotenv(dotenv_path=Path('.') / '.env')

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env")

supabase = create_client(url, key)

# --- FASTAPI SETUP ---
app = FastAPI(title="BufferZen Multi-User API", version="2.0.0")
v1_router = APIRouter(prefix="/api/v1")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# --- PYDANTIC MODELS ---
class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    type: str = Field(..., pattern="^(Income|Expense)$")
    description: str = Field(..., min_length=1, max_length=200)
    user_id: str = Field(..., min_length=1)  # Required for multi-user
    category: Optional[str] = None  # Optional - will auto-categorize if not provided

# --- SMART CATEGORIZATION ---
def smart_categorize(description: str) -> str:
    """
    Automatically categorize transactions based on description keywords.
    """
    desc = description.lower()
    
    category_mapping = {
        "Investment": ["zerodha", "groww", "stocks", "sip", "mutual fund", "etf"],
        "Food": ["chai", "zomato", "swiggy", "mess", "canteen", "restaurant", "cafe"],
        "Fixed": ["rent", "fees", "hostel", "electricity", "internet", "subscription"],
        "Transport": ["uber", "ola", "metro", "bus", "fuel", "petrol"],
        "Shopping": ["amazon", "flipkart", "myntra", "shopping", "clothes"],
        "Entertainment": ["netflix", "spotify", "movie", "theatre", "game"]
    }
    
    for category, keywords in category_mapping.items():
        if any(keyword in desc for keyword in keywords):
            return category
    
    return "Variable"

# --- CORE CALCULATION ENGINE ---
def calculate_metrics(df_data: list, fixed_costs: float) -> Dict:
    """
    Calculate budget metrics for a user based on their transaction history.
    """
    if not df_data:
        logger.warning("No transaction data provided")
        return {
            "daily_limit": 0,
            "survival_horizon": 0,
            "current_balance": 0,
            "daily_avg": 0,
            "burn_rate": 0,
            "resilience_score": 0,
            "volatility_score": "N/A",
            "monthly_avg": 0
        }
    
    df = pd.DataFrame(df_data)
    df['date'] = pd.to_datetime(df['date'])
    
    # 1. BALANCE
    income_total = df[df['type'] == 'Income']['amount'].sum()
    expense_total = df[df['type'] == 'Expense']['amount'].sum()
    current_balance = income_total - expense_total
    
    # 2. DAILY AVERAGE & BURN RATE
    expenses_df = df[df['type'] == 'Expense']
    
    if not expenses_df.empty:
        date_range = (expenses_df['date'].max() - expenses_df['date'].min()).days + 1
        daily_avg = expense_total / max(date_range, 1)
        
        # Burn rate (last 7 vs previous 7 days)
        seven_days_ago = datetime.now() - timedelta(days=7)
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        
        last_week = expenses_df[expenses_df['date'] >= seven_days_ago]['amount'].sum()
        prev_week = expenses_df[
            (expenses_df['date'] >= fourteen_days_ago) & 
            (expenses_df['date'] < seven_days_ago)
        ]['amount'].sum()
        
        burn_rate = ((last_week - prev_week) / prev_week * 100) if prev_week > 0 else 0
    else:
        daily_avg = 0
        burn_rate = 0
    
    # 3. MONTHLY INCOME & VOLATILITY
    monthly_income = df[df['type'] == 'Income']\
        .groupby(pd.Grouper(key='date', freq='M'))['amount']\
        .sum()
    
    avg_monthly_income = monthly_income.mean() if not monthly_income.empty else 0
    income_volatility = monthly_income.std() if not monthly_income.empty else 0
    
    cv = (income_volatility / avg_monthly_income) if avg_monthly_income > 0 else 0
    volatility_score = "High" if cv > 0.3 else "Low"
    
    # 4. SAFE-TO-SPEND
    days_in_month = calendar.monthrange(datetime.now().year, datetime.now().month)[1]
    
    # Simple formula: (Balance - Fixed Costs) / Days Remaining
    disposable = current_balance - fixed_costs
    daily_safe_limit = max(0, disposable / days_in_month)
    
    # 5. SURVIVAL HORIZON
    daily_fixed_burn = fixed_costs / days_in_month
    survival_days = (current_balance / daily_fixed_burn) if daily_fixed_burn > 0 and current_balance > 0 else 0
    
    # 6. RESILIENCE SCORE (0-100)
    # Formula: Based on survival days + balance ratio
    resilience_score = int(min(100, (survival_days * 2) + (20 if current_balance > fixed_costs else 0)))
    
    return {
        "daily_limit": round(daily_safe_limit, 2),
        "survival_horizon": int(survival_days),
        "current_balance": round(current_balance, 2),
        "daily_avg": round(daily_avg, 2),
        "burn_rate": round(burn_rate, 1),
        "resilience_score": resilience_score,
        "volatility_score": volatility_score,
        "monthly_avg": round(avg_monthly_income, 2)
    }

# --- API ENDPOINTS ---

@v1_router.get("/budget")
def get_budget(
    user_id: str = Query(..., min_length=1),
    fixed_costs: float = Query(..., ge=0, le=1000000)
):
    """
    Get budget metrics for a specific user.
    Requires user_id to filter transactions.
    """
    logger.info(f"Budget request for user: {user_id}, fixed_costs: {fixed_costs}")
    
    try:
        # Fetch last 6 months of user's transactions
        six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        response = supabase.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .gte("date", six_months_ago)\
            .order("date", desc=True)\
            .execute()
        
        data = calculate_metrics(response.data or [], fixed_costs)
        
        if not response.data:
            logger.warning(f"No transactions found for user: {user_id}")
        
        return {"success": True, "data": data}
        
    except Exception as e:
        logger.error(f"Budget calculation error: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Failed to calculate budget")


@v1_router.get("/analytics")
def get_analytics(user_id: str = Query(..., min_length=1)):
    """
    Get 7-day spending analytics for a specific user.
    """
    try:
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        response = supabase.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .gte("date", thirty_days_ago)\
            .execute()
        
        if not response.data:
            return {
                "success": True,
                "labels": [],
                "values": [],
                "stats": {"daily_avg": 0, "burn_rate": 0}
            }
        
        df = pd.DataFrame(response.data)
        df['date'] = pd.to_datetime(df['date'])
        
        # Get last 7 days
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent = df[(df['type'] == 'Expense') & (df['date'] >= seven_days_ago)]
        
        daily_spending = recent.groupby(recent['date'].dt.strftime('%Y-%m-%d'))['amount'].sum()
        
        # Generate labels for last 7 days
        last_7_days = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') 
                       for i in range(6, -1, -1)]
        
        values = [daily_spending.get(day, 0) for day in last_7_days]
        
        # Calculate stats
        all_expenses = df[df['type'] == 'Expense']
        total_expenses = all_expenses['amount'].sum()
        days_count = (df['date'].max() - df['date'].min()).days + 1
        daily_avg = total_expenses / max(days_count, 1)
        
        # Burn rate
        fourteen_days_ago = datetime.now() - timedelta(days=14)
        last_week = all_expenses[all_expenses['date'] >= seven_days_ago]['amount'].sum()
        prev_week = all_expenses[
            (all_expenses['date'] >= fourteen_days_ago) & 
            (all_expenses['date'] < seven_days_ago)
        ]['amount'].sum()
        
        burn_rate = ((last_week - prev_week) / prev_week * 100) if prev_week > 0 else 0
        
        return {
            "success": True,
            "labels": last_7_days,
            "values": [round(v, 2) for v in values],
            "stats": {
                "daily_avg": round(daily_avg, 2),
                "burn_rate": round(burn_rate, 1)
            }
        }
        
    except Exception as e:
        logger.error(f"Analytics error: {e}", exc_info=True)
        return {
            "success": False,
            "labels": [],
            "values": [],
            "stats": {"daily_avg": 0, "burn_rate": 0}
        }


@v1_router.get("/transactions/recent")
def get_recent_transactions(user_id: str = Query(..., min_length=1)):
    """
    Get last 10 transactions for a specific user.
    """
    try:
        response = supabase.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("date", desc=True)\
            .limit(10)\
            .execute()
        
        return {"success": True, "data": response.data or []}
        
    except Exception as e:
        logger.error(f"Recent transactions error: {e}", exc_info=True)
        return {"success": False, "data": []}


@v1_router.post("/transactions")
def add_transaction(item: TransactionCreate):
    """
    Add a new transaction for a user with smart categorization.
    """
    logger.info(f"Adding transaction for user: {item.user_id}, {item.type} ₹{item.amount}")
    
    # Auto-categorize if not provided
    category = item.category if item.category else smart_categorize(item.description)
    
    new_row = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "type": item.type,
        "category": category,
        "amount": item.amount,
        "description": item.description,
        "user_id": item.user_id
    }
    
    try:
        response = supabase.table("transactions").insert(new_row).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Insert failed")
        
        logger.info(f"Transaction added successfully, category: {category}")
        return {"success": True, "data": response.data[0]}
        
    except Exception as e:
        logger.error(f"Insert error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add transaction")


@v1_router.post("/predict-transaction")
async def predict_from_image(file: UploadFile = File(...)):
    """Extract amount from receipt using OCR."""
    allowed_types = ["image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    try:
        content = await file.read()
        
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        img = Image.open(io.BytesIO(content))
        text = pytesseract.image_to_string(img)
        
        match = re.search(r'(?:₹|INR|RS|Rs\.?)\s?(\d+(?:,\d{3})*(?:\.\d{1,2})?)', text, re.I)
        amount = float(match.group(1).replace(',', '')) if match else 0.0
        
        return {"success": True, "amount": amount}
        
    except (IOError, OSError):
        raise HTTPException(status_code=400, detail="Invalid image")
    except Exception as e:
        logger.error(f"OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OCR failed")


@v1_router.post("/upload-statement")
async def upload_statement(
    file: UploadFile = File(...),
    user_id: str = Query(..., min_length=1)
):
    """
    Upload CSV bank statement and import transactions for a specific user.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload CSV")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        logger.info(f"CSV uploaded for user {user_id}: {len(df)} rows")
        
        # Normalize columns
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        
        # Find columns
        date_col = next((c for c in df.columns if 'date' in c), None)
        amount_col = next((c for c in df.columns if any(x in c for x in ['amount', 'debit', 'credit'])), None)
        desc_col = next((c for c in df.columns if any(x in c for x in ['description', 'narration', 'details'])), None)
        type_col = next((c for c in df.columns if any(x in c for x in ['type', 'cr/dr'])), None)
        
        if not all([date_col, amount_col]):
            raise HTTPException(status_code=400, detail=f"Missing columns. Found: {list(df.columns)}")
        
        # Clean data
        cleaned_data = []
        for _, row in df.iterrows():
            try:
                date_str = pd.to_datetime(row[date_col]).strftime("%Y-%m-%d")
                amount = abs(float(str(row[amount_col]).replace(',', '').replace('₹', '').strip()))
                
                description = str(row[desc_col])[:200] if desc_col else "Imported"
                description = re.sub(r'\d{10,}', '', description).strip()
                
                if type_col:
                    type_str = str(row[type_col]).lower()
                    trans_type = "Income" if any(x in type_str for x in ['cr', 'credit']) else "Expense"
                else:
                    trans_type = "Expense"
                
                # Smart categorize
                category = smart_categorize(description)
                
                cleaned_data.append({
                    "date": date_str,
                    "amount": amount,
                    "type": trans_type,
                    "description": description,
                    "category": category,
                    "user_id": user_id  # Attach to user
                })
                
            except Exception:
                continue
        
        if not cleaned_data:
            raise HTTPException(status_code=400, detail="No valid transactions")
        
        # Bulk insert
        supabase.table("transactions").insert(cleaned_data).execute()
        
        logger.info(f"Imported {len(cleaned_data)} transactions for user {user_id}")
        return {
            "success": True,
            "count": len(cleaned_data),
            "message": f"Imported {len(cleaned_data)} transactions"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CSV import error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@app.get("/")
def health_check():
    """API health check."""
    return {
        "status": "BufferZen Multi-User API running",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }


app.include_router(v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
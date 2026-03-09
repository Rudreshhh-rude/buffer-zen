import os
import re
import io
import calendar
import logging
import sqlite3
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import FastAPI, Query, HTTPException, APIRouter, File, UploadFile, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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

# --- SQLITE DATABASE SETUP ---
DB_FILE = "bufferzen.db"

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Returns rows as dictionaries
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT NOT NULL,
            user_id TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
    logger.info("SQLite database initialized successfully.")

init_db()

# --- FASTAPI SETUP ---
app = FastAPI(title="BufferZen Multi-User API - SQLite Edition", version="2.4.0")
v1_router = APIRouter(prefix="/api/v1")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# --- PYDANTIC MODELS ---
class TransactionCreate(BaseModel):
    amount: float = Field(..., gt=0)
    type: str = Field(..., pattern="^(Income|Expense)$")
    description: str = Field(..., min_length=1, max_length=200)
    user_id: str = Field(..., min_length=1)
    category: Optional[str] = None

# --- SMART CATEGORIZATION ---
def smart_categorize(description: str) -> str:
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
    if not df_data:
        return {
            "daily_limit": 0,
            "survival_horizon": 0,
            "current_balance": 0,
            "daily_avg": 0,
            "burn_rate": 0,
            "resilience_score": 0,
            "volatility_score": "N/A",
            "monthly_avg": 0,
            "limit_change_pct": 0.0,
            "horizon_change": 0,
            "resilience_change_pct": 0.0
        }
    
    df = pd.DataFrame(df_data)
    df['date'] = pd.to_datetime(df['date'])
    
    income_total = df[df['type'] == 'Income']['amount'].sum()
    expense_total = df[df['type'] == 'Expense']['amount'].sum()
    current_balance = income_total - expense_total
    
    expenses_df = df[df['type'] == 'Expense']
    
    if not expenses_df.empty:
        date_range = (expenses_df['date'].max() - expenses_df['date'].min()).days + 1
        daily_avg = expense_total / max(date_range, 1)
        
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
    
    monthly_income = df[df['type'] == 'Income']\
        .groupby(pd.Grouper(key='date', freq='ME'))['amount']\
        .sum()
    
    avg_monthly_income = monthly_income.mean() if not monthly_income.empty else 0
    income_volatility = monthly_income.std() if not monthly_income.empty else 0
    
    cv = (income_volatility / avg_monthly_income) if avg_monthly_income > 0 else 0
    volatility_score = "High" if cv > 0.3 else "Low"
    
    days_in_month = calendar.monthrange(datetime.now().year, datetime.now().month)[1]
    
    disposable = current_balance - fixed_costs
    daily_safe_limit = max(0, disposable / days_in_month)
    
    daily_fixed_burn = fixed_costs / days_in_month
    survival_days = (current_balance / daily_fixed_burn) if daily_fixed_burn > 0 and current_balance > 0 else 0
    
    resilience_score = int(min(100, (survival_days * 2) + (20 if current_balance > fixed_costs else 0)))
    
    # --- MOMENTUM CALCULATIONS (Last 30 days vs Previous 30 days) ---
    thirty_days_ago = datetime.now() - timedelta(days=30)
    sixty_days_ago = datetime.now() - timedelta(days=60)
    
    # Current 30 days stats
    current_30_df = df[df['date'] >= thirty_days_ago]
    current_income = current_30_df[current_30_df['type'] == 'Income']['amount'].sum()
    current_expense = current_30_df[current_30_df['type'] == 'Expense']['amount'].sum()
    current_bal_30 = current_income - current_expense
    current_limit_30 = max(0, (current_bal_30 - fixed_costs) / days_in_month)
    current_horizon_30 = (current_bal_30 / daily_fixed_burn) if daily_fixed_burn > 0 and current_bal_30 > 0 else 0
    current_resilience_30 = int(min(100, (current_horizon_30 * 2) + (20 if current_bal_30 > fixed_costs else 0)))
    
    # Previous 30 days stats
    prev_30_df = df[(df['date'] >= sixty_days_ago) & (df['date'] < thirty_days_ago)]
    prev_income = prev_30_df[prev_30_df['type'] == 'Income']['amount'].sum()
    prev_expense = prev_30_df[prev_30_df['type'] == 'Expense']['amount'].sum()
    prev_bal_30 = prev_income - prev_expense
    prev_limit_30 = max(0, (prev_bal_30 - fixed_costs) / days_in_month)
    prev_horizon_30 = (prev_bal_30 / daily_fixed_burn) if daily_fixed_burn > 0 and prev_bal_30 > 0 else 0
    prev_resilience_30 = int(min(100, (prev_horizon_30 * 2) + (20 if prev_bal_30 > fixed_costs else 0)))
    
    # Deltas
    limit_change_pct = ((current_limit_30 - prev_limit_30) / prev_limit_30 * 100) if prev_limit_30 > 0 else (100.0 if current_limit_30 > 0 else 0.0)
    horizon_change = int(current_horizon_30 - prev_horizon_30)
    resilience_change_pct = ((current_resilience_30 - prev_resilience_30) / prev_resilience_30 * 100) if prev_resilience_30 > 0 else (100.0 if current_resilience_30 > 0 else 0.0)

    
    return {
        "daily_limit": round(daily_safe_limit, 2),
        "survival_horizon": int(survival_days),
        "current_balance": round(current_balance, 2),
        "daily_avg": round(daily_avg, 2),
        "burn_rate": round(burn_rate, 1),
        "resilience_score": max(0, resilience_score),
        "volatility_score": volatility_score,
        "monthly_avg": round(avg_monthly_income, 2),
        "limit_change_pct": round(limit_change_pct, 1),
        "horizon_change": horizon_change,
        "resilience_change_pct": round(resilience_change_pct, 1)
    }

# --- API ENDPOINTS ---

@v1_router.get("/budget")
def get_budget(
    user_id: str = Query(..., min_length=1),
    fixed_costs: float = Query(..., ge=0, le=1000000)
):
    try:
        six_months_ago = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM transactions WHERE user_id = ? AND date >= ? ORDER BY date DESC",
            (user_id, six_months_ago)
        )
        rows = cursor.fetchall()
        conn.close()
        
        data = calculate_metrics([dict(r) for r in rows], fixed_costs)
        return {"success": True, "data": data}
        
    except Exception as e:
        logger.error(f"Budget calculation error: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Failed to calculate budget")

@v1_router.get("/analytics")
def get_analytics(user_id: str = Query(..., min_length=1)):
    try:
        thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT * FROM transactions WHERE user_id = ? AND date >= ?",
            (user_id, thirty_days_ago)
        )
        rows = cursor.fetchall()
        conn.close()
        
        df_data = [dict(r) for r in rows]
        
        if not df_data:
            return {
                "success": True,
                "labels": [],
                "values": [],
                "stats": {"daily_avg": 0, "burn_rate": 0}
            }
        
        df = pd.DataFrame(df_data)
        df['date'] = pd.to_datetime(df['date'])
        
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent = df[(df['type'] == 'Expense') & (df['date'] >= seven_days_ago)]
        
        daily_spending = recent.groupby(recent['date'].dt.strftime('%Y-%m-%d'))['amount'].sum()
        
        last_7_days = [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d') 
                       for i in range(6, -1, -1)]
        
        values = [daily_spending.get(day, 0) for day in last_7_days]
        
        all_expenses = df[df['type'] == 'Expense']
        total_expenses = all_expenses['amount'].sum()
        days_count = (df['date'].max() - df['date'].min()).days + 1
        daily_avg = total_expenses / max(days_count, 1)
        
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
        return {"success": False, "labels": [], "values": [], "stats": {"daily_avg": 0, "burn_rate": 0}}

@v1_router.get("/transactions/recent")
def get_recent_transactions(user_id: str = Query(..., min_length=1)):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, id DESC LIMIT 10",
            (user_id,)
        )
        rows = cursor.fetchall()
        conn.close()
        return {"success": True, "data": [dict(r) for r in rows]}
    except Exception as e:
        logger.error(f"Recent transactions error: {e}", exc_info=True)
        return {"success": False, "data": []}

@v1_router.post("/transactions")
def add_transaction(item: TransactionCreate):
    category = item.category if item.category else smart_categorize(item.description)
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO transactions (date, type, category, amount, description, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            (date_str, item.type, category, item.amount, item.description, item.user_id)
        )
        new_id = cursor.lastrowid
        conn.commit()
        
        cursor.execute("SELECT * FROM transactions WHERE id = ?", (new_id,))
        new_row = dict(cursor.fetchone())
        conn.close()
        
        return {"success": True, "data": new_row}
    except Exception as e:
        logger.error(f"Insert error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to add transaction")

@v1_router.post("/predict-transaction")
async def predict_from_image(file: UploadFile = File(...)):
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
    except Exception as e:
        logger.error(f"OCR error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="OCR failed")

@v1_router.post("/upload-statement")
async def upload_statement(file: UploadFile = File(...), user_id: str = Query(..., min_length=1)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Please upload CSV")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        df.columns = [c.strip().lower().replace(' ', '_') for c in df.columns]
        
        date_col = next((c for c in df.columns if 'date' in c), None)
        amount_col = next((c for c in df.columns if any(x in c for x in ['amount', 'debit', 'credit'])), None)
        desc_col = next((c for c in df.columns if any(x in c for x in ['description', 'narration', 'details'])), None)
        type_col = next((c for c in df.columns if any(x in c for x in ['type', 'cr/dr'])), None)
        
        if not all([date_col, amount_col]):
            raise HTTPException(status_code=400, detail=f"Missing columns. Found: {list(df.columns)}")
        
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
                
                category = smart_categorize(description)
                
                cleaned_data.append((date_str, trans_type, category, amount, description, user_id))
            except Exception:
                continue
        
        if not cleaned_data:
            raise HTTPException(status_code=400, detail="No valid transactions")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.executemany(
            "INSERT INTO transactions (date, type, category, amount, description, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            cleaned_data
        )
        conn.commit()
        conn.close()
        
        return {"success": True, "count": len(cleaned_data), "message": f"Imported {len(cleaned_data)} transactions"}
    except Exception as e:
        logger.error(f"CSV import error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "BufferZen Local DB API running", "version": "2.1.0", "timestamp": datetime.now().isoformat()}

app.include_router(v1_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
import pandas as pd
from faker import Faker
import random
from datetime import datetime, timedelta

fake = Faker()

def generate_student_gig_data(months=12):
    data = []
    # Start the data from 1 year ago
    start_date = datetime.now() - timedelta(days=months*30)
    
    for i in range(months * 30):
        current_date = start_date + timedelta(days=i)
        
        # 1. SIMULATE INCOME (The "Lumpy" Signal)
        # 5% chance of getting a freelance payment on any given day
        if random.random() < 0.05: 
            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "category": "Freelance",
                "type": "Income",
                "amount": random.choice([4000, 7500, 12000, 18000]),
                "description": random.choice(["Video Edit", "Logo Design", "Web Bug Fix", "Social Media Mgmt"])
            })

        # 2. SIMULATE FIXED EXPENSES
        # Rent/Mess Fee on the 1st of every month
        if current_date.day == 1:
            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "category": "Fixed",
                "type": "Expense",
                "amount": 6500,
                "description": "Hostel/Mess Fee"
            })

        # 3. SIMULATE VARIABLE EXPENSES (The "Noise")
        # 70% chance of spending small amounts daily
        if random.random() < 0.7:
            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "category": "Lifestyle",
                "type": "Expense",
                "amount": random.randint(40, 600),
                "description": random.choice(["Tea/Coffee", "Zomato", "Auto Rickshaw", "Stationery", "Movie"])
            })

    df = pd.DataFrame(data)
    # Save the file in the backend folder
    df.to_csv("synthetic_transactions.csv", index=False)
    print(f"✅ Success! Generated {len(df)} transactions in 'synthetic_transactions.csv'")

if __name__ == "__main__":
    generate_student_gig_data()
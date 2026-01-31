import pandas as pd
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

def migrate():
    df = pd.read_csv("synthetic_transactions.csv")
    supabase.table("transactions").insert(df.to_dict("records")).execute()
    print("✅ Migration complete")

if __name__ == "__main__":
    migrate()

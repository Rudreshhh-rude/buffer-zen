# BufferZen 🧘‍♂️🛡️

> **"Don't just track your spending. Measure your survival."**

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/frontend-React_18-61DAFB.svg) ![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg) ![Tailwind](https://img.shields.io/badge/style-Tailwind_CSS-38B2AC.svg)

**BufferZen** is not a typical budgeting app. It is a **Financial Resilience Dashboard** designed to shift your mindset from "Backward Budgeting" (tracking where money went) to **"Forward Runway"** (knowing how long you can survive).

It answers the one question that actually matters: ***If everything goes wrong today, how long until the lights go out?***

---

## ✨ Unique Features

### ⚡ Chaos Mode (Stress Testing)
Most apps assume life is linear. BufferZen knows it isn't.
-   **Simulator**: Toggle "Job Loss", "Market Crash", or "High Inflation" scenarios.
-   **Instant Feedback**: Watch your "Survival Horizon" shrink in real-time.
-   **Actionable Advice**: Get immediate cues on how to adapt (e.g., "Cut Discretionary Spend by 30%").

### 🛡️ The "True" Horizon
-   Translates your bank balance and liquid assets into **Days of Freedom**.
-   Dynamic calculation based on your actual *burn rate*, not just your income.

### ⚓ Smart Anchor
-   Automatically separates your **Cost of Existing** (Rent, EMI, Subscriptions) from your **Lifestyle Cost**.
-   Helps you understand your "Baseline" vs. your "Choices".

### 🥕 Freedom Goals
-   Gamifies your savings. Set a target (e.g., "Sabbatical").
-   Calculates the **"Daily Sacrifice"**: *How much less do I need to spend today to be free in 6 months?*

### 🗿 Zen Design (Stone Theme)
-   A calm, "Stone Grey" aesthetic designed to reduce financial anxiety.
-   No clutter, no ads, no "buy this credit card" popups. Just your data.

---

## 🛠️ The Tech Stack

This project uses a modern, high-performance stack:

*   **Frontend**:
    *   [React](https://react.dev/) (Vite)
    *   [Tailwind CSS](https://tailwindcss.com/) (v4 with PostCSS)
    *   [Framer Motion](https://www.framer.com/motion/) (Animations)
    *   [Lucide React](https://lucide.dev/) (Iconography)
*   **Backend**:
    *   [Python](https://www.python.org/) (3.12+)
    *   [FastAPI](https://fastapi.tiangolo.com/) (High-performance API)
    *   [Pandas](https://pandas.pydata.org/) (Data Analysis)

---

## 🚀 Getting Started

Follow these steps to run BufferZen locally.

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/buffer-zen.git
cd buffer-zen
```

### 2. Backend Setup (The Brain)
```bash
cd backend
# Create virtual environment (Optional but recommended)
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```
*The backend runs on `http://localhost:8000`*

### 3. Frontend Setup (The Face)
Open a new terminal window:
```bash
cd frontend
# Install dependencies
npm install

# Run the development server
npm run dev
```
*The app runs on `http://localhost:5173`*

---

## 🔮 Roadmap

- [ ] **Real-Time Markets**: Integrate WebSocket for live stock/crypto ticker.
- [ ] **Auth 2.0**: Replace demo login with Supabase/Auth0.
- [ ] **Mobile Port**: React Native version for "Pulse Check" on the go.
- [ ] **AI Insights**: LLM-powered suggestions based on spending patterns.

## 🤝 Contributing

This is a personal portfolio project, but contributions are welcome!
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with 🖤 and ☕ by <b>Your Name</b>
</p>

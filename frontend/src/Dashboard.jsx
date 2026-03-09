import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    // Clean imports after refactor (removed unused icons)
    Shield,
    CheckCircle,
    AlertCircle,
    LogOut,
    Zap,
    Anchor,
    Briefcase,
    Bell,
    Settings,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';
import Ticker from './Ticker';
import Topbar from './components/Topbar';
import SpendingGraph from './components/SpendingGraph';
import ChaosControl from './components/ChaosControl';
import GoalSetter from './components/GoalSetter';
import ActionZone from './components/ActionZone';
import HistoryList from './components/HistoryList';
import { getResilienceLabel, calculateStressMetrics } from './utils/financeHelpers';

const API = "/api/v1";

// --- MAIN DASHBOARD ---
export default function Dashboard({ user, onSignOut, currentView, onViewChange }) {
    const [data, setData] = useState({
        daily_limit: 0, survival_horizon: 0, current_balance: 0, daily_avg: 0,
        burn_rate: 0, resilience_score: 0, limit_change_pct: 0, horizon_change: 0, resilience_change_pct: 0
    });
    const [investments, setInvestments] = useState(() => {
        const saved = localStorage.getItem('buffer_investments_v2');
        return saved ? Number(saved) : '';
    });
    const [graphData, setGraphData] = useState({ labels: [], values: [] });
    const [history, setHistory] = useState([]);
    const [anchor, setAnchor] = useState(() => {
        const saved = localStorage.getItem('buffer_anchor_v2');
        return saved ? Number(saved) : '';
    });
    const [form, setForm] = useState({ amount: '', description: '', type: 'Expense', is_fixed: false });

    // Smart Anchor Logic
    const suggestedAnchor = useMemo(() => {
        if (!history.length) return 0;
        const subscriptionKeywords = /#fixed|rent|subscription|netflix|spotify|gym|internet|broadband/i;
        const fixedExpenses = history.filter(h =>
            h.is_fixed ||
            (h.description && subscriptionKeywords.test(h.description))
        );
        const total = fixedExpenses.reduce((sum, h) => sum + Number(h.amount), 0);
        return total;
    }, [history]);

    // Chaos Mode State
    const [scenarios, setScenarios] = useState({ job_loss: false, inflation: false, market_crash: false });

    // Derived Stress Metrics
    const stressData = useCallback(() => {
        return calculateStressMetrics(data, investments, scenarios);
    }, [data, investments, scenarios])();

    const isStressed = Object.values(scenarios).some(Boolean);
    const displayHorizon = isStressed ? stressData.horizon_stress : (data.daily_avg > 0 ? Math.round((data.current_balance + (Number(investments) || 0)) / data.daily_avg) : data.survival_horizon);
    const displayResilience = isStressed ? Math.max(0, data.resilience_score - (scenarios.market_crash ? 20 : 0) - (scenarios.inflation ? 15 : 0) - (scenarios.job_loss ? 40 : 0)) : data.resilience_score;

    // Persist local settings
    useEffect(() => {
        if (investments !== '') localStorage.setItem('buffer_investments_v2', investments);
        if (anchor !== '') localStorage.setItem('buffer_anchor_v2', anchor);
    }, [investments, anchor]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const budgetParams = new URLSearchParams({ user_id: user.id, fixed_costs: String(Number(anchor) || 0) });
            const budgetRes = await fetch(`${API}/budget?${budgetParams}`);
            const budgetJson = await budgetRes.json();
            if (budgetJson.success) setData(budgetJson.data);

            const analyticsRes = await fetch(`${API}/analytics?user_id=${user.id}`);
            const analyticsJson = await analyticsRes.json();
            if (analyticsJson.success) setGraphData({ labels: analyticsJson.labels || [], values: analyticsJson.values || [] });

            const historyRes = await fetch(`${API}/transactions/recent?user_id=${user.id}`);
            const historyJson = await historyRes.json();
            if (historyJson.success) setHistory(historyJson.data || []);
        } catch (err) {
            setError("Backend Offline: Ensure FastAPI is running.");
        }
    }, [user, anchor]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleManualLog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, amount: Number(form.amount), user_id: user.id }),
            });
            if (res.ok) {
                setForm({ amount: '', description: '', type: 'Expense', is_fixed: false });
                fetchData();
            }
        } finally { setLoading(false); }
    };

    const handleBulkUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setLoading(true);
        try {
            const res = await fetch(`${API}/upload-statement?user_id=${user.id}`, { method: 'POST', body: formData });
            if (res.ok) {
                setUploadSuccess("Imported Successfully");
                fetchData();
                setTimeout(() => setUploadSuccess(null), 3000);
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-buf-bg text-stone-100 font-sans">
            <Topbar
                currentView={currentView}
                onViewChange={onViewChange}
                onSignOut={onSignOut}
                error={error}
                uploadSuccess={uploadSuccess}
                isStressed={isStressed}
                onToggleChaos={() => setScenarios(prev => ({ ...prev, show: !prev.show }))}
            />
            <div className="p-6 md:p-8">

                {/* TOP METRICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* Safe-to-Spend Limit */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 rounded-xl flex flex-col justify-between group hover:border-buf-cyan/30 transition-all cursor-default relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-2">Safe-to-Spend Limit</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tighter">₹{data.daily_limit}</span>
                                    <span className={`text-[10px] font-black tracking-wider ${data.limit_change_pct >= 0 ? "text-buf-green" : "text-buf-red"}`}>
                                        {data.limit_change_pct > 0 ? "+" : ""}{data.limit_change_pct}%~
                                    </span>
                                </div>
                            </div>
                            <div className="text-stone-700/50 group-hover:text-stone-600/50 transition-colors">
                                <svg width="48" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
                            </div>
                        </div>
                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-2">Adjusted for Projected Volatility</p>
                    </motion.div>

                    {/* Survival Horizon */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6 rounded-xl flex flex-col justify-between group hover:border-buf-cyan/30 transition-all cursor-default relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-[10px] text-buf-cyan font-bold uppercase tracking-widest mb-2">Survival Horizon</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tighter">{displayHorizon}</span>
                                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest whitespace-nowrap">Days</span>
                                    <span className={`text-[10px] font-black tracking-wider ${data.horizon_change >= 0 ? "text-buf-green" : "text-buf-red"}`}>
                                        {data.horizon_change > 0 ? "+" : ""}{data.horizon_change}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2">
                            {/* Progress Bar styled component */}
                            <div className="h-1.5 w-full bg-stone-900 rounded-full overflow-hidden flex">
                                <div className="h-full bg-buf-cyan" style={{ width: `${Math.min(100, Math.max(10, (displayHorizon / 365) * 100))}%` }}></div>
                            </div>
                            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-3">Estimated Runway Until Zero</p>
                        </div>
                    </motion.div>

                    {/* Resilience Score */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-panel p-6 rounded-xl flex flex-col justify-between group hover:border-buf-cyan/30 transition-all cursor-default relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-[10px] text-buf-cyan font-bold uppercase tracking-widest mb-2">Resilience Score</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white tracking-tighter">{displayResilience}</span>
                                    <span className="text-[12px] text-stone-500 font-bold tracking-widest">/100</span>
                                    <span className={`text-[10px] font-black tracking-wider ${data.resilience_change_pct >= 0 ? "text-buf-green" : "text-buf-red"}`}>
                                        {data.resilience_change_pct > 0 ? "+" : ""}{data.resilience_change_pct}%~
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2">
                            {/* Progress Steps component */}
                            <div className="flex gap-1 h-1.5 w-full">
                                {[1, 2, 3, 4, 5].map((step) => (
                                    <div key={step} className={`flex-1 rounded-sm ${step * 20 <= displayResilience ? 'bg-buf-green' : 'bg-stone-800'}`}></div>
                                ))}
                            </div>
                            <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-3">Financial Antifragility Index</p>
                        </div>
                    </motion.div>
                </div>

                {/* MIDDLE SECTION: 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Left Column: Chaos Control */}
                    <div className="lg:col-span-1">
                        <ChaosControl
                            anchor={anchor}
                            setAnchor={setAnchor}
                            investments={investments}
                            setInvestments={setInvestments}
                            onCommit={fetchData}
                            loading={loading}
                        />
                    </div>

                    {/* Right Column: 7-Day Momentum Analytics */}
                    <div className="lg:col-span-2 glass-panel rounded-xl flex flex-col relative overflow-hidden">
                        <div className="p-6 border-b border-stone-800/50 flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-black text-white tracking-widest mb-1">7-Day Momentum Analytics</h3>
                                <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Daily burn rates vs. historical average</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-buf-cyan"></div>
                                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Stable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-buf-red"></div>
                                    <span className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Volatility</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 p-6 relative min-h-[200px]">
                            {/* Fake average line */}
                            <div className="absolute top-1/2 left-6 right-6 border-t border-dashed border-stone-700/50 flex justify-start items-center">
                                <span className="bg-buf-bg pr-2 text-[9px] text-stone-500 font-bold tracking-widest mt-[-14px]">AVG. ${data.daily_avg}</span>
                            </div>
                            <div className="h-full w-full">
                                <SpendingGraph labels={graphData.labels} values={graphData.values} />
                            </div>
                        </div>

                        {/* Bottom Data Row */}
                        <div className="grid grid-cols-2 border-t border-stone-800/50">
                            <div className="p-4 border-r border-stone-800/50 bg-stone-900/20 flex flex-col gap-1 hover:bg-stone-900/40 transition-colors">
                                <span className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">Weekly Median</span>
                                <span className="text-xl font-black text-white tracking-tighter">₹{data.daily_avg}</span>
                            </div>
                            <div className="p-4 bg-buf-red/5 flex flex-col gap-1 hover:bg-buf-red/10 transition-colors">
                                <span className="text-[9px] text-buf-red font-bold uppercase tracking-widest">Peak Volatility</span>
                                <span className="text-xl font-black text-buf-red tracking-tighter">+{data.burn_rate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ZONE 4: LIVE HISTORY & BULK UPLOAD */}
                <HistoryList history={history} onUpload={handleBulkUpload} loading={loading} />
            </div>
        </div>
    );
}

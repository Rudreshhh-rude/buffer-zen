import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    // Clean imports after refactor (removed unused icons)
    Shield,
    CheckCircle,
    AlertCircle,
    LogOut,
    Zap,
    Anchor,
    Briefcase
} from 'lucide-react';
import { motion } from 'framer-motion';
import Ticker from './Ticker';
import SpendingGraph from './components/SpendingGraph';
import ChaosControl from './components/ChaosControl';
import GoalSetter from './components/GoalSetter';
import ActionZone from './components/ActionZone';
import HistoryList from './components/HistoryList';
import { getResilienceLabel, calculateStressMetrics } from './utils/financeHelpers';

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// --- MAIN DASHBOARD ---
export default function Dashboard({ user, onSignOut }) {
    const [data, setData] = useState({
        daily_limit: 0, survival_horizon: 0, current_balance: 0, daily_avg: 0, burn_rate: 0, resilience_score: 0
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
        <div className="min-h-screen bg-stone-950 text-stone-100 p-6 md:p-8 font-sans">
            {/* HEADER */}
            <header className="flex justify-between items-center py-4">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-2xl font-black text-white tracking-tighter italic">BUFFER<span className="text-emerald-500">ZEN</span></h1>
                    <p className="text-stone-600 text-xs mt-1">{user.email}</p>
                </motion.div>
                <div className="flex items-center gap-3">
                    {error && <div className="text-red-400 text-[10px] font-black uppercase"><AlertCircle size={12} className="inline mr-1" /> {error}</div>}
                    {uploadSuccess && <div className="text-emerald-400 text-[10px] font-black uppercase"><CheckCircle size={12} className="inline mr-1" /> {uploadSuccess}</div>}
                    <button
                        onClick={() => setScenarios(prev => ({ ...prev, show: !prev.show }))}
                        className={`p-2 px-3 rounded-lg transition-all flex items-center gap-2 ${isStressed || scenarios.show ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-stone-900 border border-stone-800 text-stone-500 hover:text-white'}`}
                        title="Toggle Chaos Mode"
                    >
                        <Zap size={14} className={isStressed ? 'fill-current animate-pulse' : ''} />
                        <span className="text-xs font-bold uppercase tracking-wider">Chaos Mode</span>
                    </button>
                    <button onClick={onSignOut} className="p-2 bg-stone-900 border border-stone-800 rounded-lg hover:bg-stone-800 transition-colors">
                        <LogOut size={16} className="text-stone-400" />
                    </button>
                </div>
            </header>

            {/* CHAOS CONTROL (Collapsible) */}
            <motion.div
                initial={false}
                animate={{ height: scenarios.show ? 'auto' : 0, opacity: scenarios.show ? 1 : 0 }}
                className="overflow-hidden mb-4"
            >
                <ChaosControl activeScenarios={scenarios} onToggle={(id) => setScenarios(prev => ({ ...prev, [id]: !prev[id] }))} />
            </motion.div>

            {/* ZONE 0: FINANCIAL CONFIGURATION (Always Visible) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Anchor Input */}
                <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800 flex items-center justify-between group hover:border-stone-700 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <Anchor size={16} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Monthly Fixed Costs</p>
                            <p className="text-xs text-emerald-500/50 font-mono">Real Anchor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-black">₹</span>
                        <input
                            type="number"
                            value={anchor}
                            onChange={(e) => setAnchor(e.target.value)}
                            placeholder="0"
                            className="bg-transparent text-lg font-black text-white w-24 outline-none text-right font-mono"
                        />
                        {suggestedAnchor > 0 && Math.abs(suggestedAnchor - anchor) > 100 && (
                            <button
                                onClick={() => setAnchor(suggestedAnchor)}
                                className="ml-2 bg-yellow-500 text-black p-1 rounded-md shadow-lg hover:bg-yellow-400 transition-all animate-bounce"
                                title={`Detected Fixed Costs: ₹${suggestedAnchor}`}
                            >
                                <Zap size={14} fill="currentColor" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Assets Input */}
                <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800 flex items-center justify-between group hover:border-stone-700 transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <Briefcase size={16} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Liquid Assets</p>
                            <p className="text-xs text-blue-500/50 font-mono">Safety Net</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-stone-500 font-black">+</span>
                        <input
                            type="number"
                            value={investments}
                            onChange={(e) => setInvestments(e.target.value)}
                            placeholder="0"
                            className="bg-transparent text-lg font-black text-white w-24 outline-none text-right font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* ZONE 1: PRIMARY METRICS (Safe-to-Spend & Resilience) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className={`lg:col-span-2 p-8 rounded-[2.5rem] border shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${isStressed ? 'bg-red-950/30 border-red-500/30' : 'bg-stone-900/40 border-stone-800/60'}`}>
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${isStressed ? 'red' : 'emerald'}-500/20 to-transparent opacity-50`}></div>


                    <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Safe-to-Spend Today</p>
                    <h2 className="text-6xl font-black text-white tracking-tighter">₹{data.daily_limit}</h2>

                    {/* Dynamic Resilience Label */}
                    <div className={`mt-4 px-4 py-1.5 bg-stone-950 border rounded-full flex items-center gap-2 ${isStressed ? 'border-red-500/40' : 'border-stone-800/60'}`}>
                        <div className={`w-2 h-2 rounded-full ${getResilienceLabel(displayResilience).color.replace('text-', 'bg-')}`}></div>
                        <span className={`text-xs font-black uppercase tracking-wider ${getResilienceLabel(displayResilience).color}`}>
                            {isStressed ? 'Simulating: ' : ''}{getResilienceLabel(displayResilience).label} • {displayResilience}%
                        </span>
                    </div>
                    {/* Chaos Advice */}
                    {isStressed && (
                        <p className="text-[9px] text-red-300 mt-2 font-mono uppercase tracking-tight animate-pulse">
                            Action Advice: Cut Discretionary Spend by 30% immediately.
                        </p>
                    )}
                </div>
                <div className={`p-6 rounded-[2.5rem] border flex flex-col items-center justify-center text-center transition-colors duration-500 ${isStressed ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-600/5 border-blue-500/10'}`}>
                    <Shield className={`mb-3 ${isStressed ? 'text-red-400' : 'text-blue-400'}`} size={32} />
                    <h3 className={`text-4xl font-black tracking-tight ${isStressed ? 'text-red-400' : 'text-blue-400'}`}>
                        {displayHorizon}
                        <span className="text-sm opacity-50"> Days</span>
                    </h3>
                    <p className={`${isStressed ? 'text-red-400/60' : 'text-blue-400/60'} text-[10px] font-black uppercase tracking-widest`}>
                        {isStressed ? 'Stressed Horizon' : 'True Survival Horizon'}
                    </p>

                </div>
            </div>

            {/* ZONE 2: ANALYTICS (Unified) */}
            <div className="bg-stone-900/40 rounded-[2.5rem] border border-stone-800 p-6 mb-6">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-stone-500">Spending Trends</h3>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className="text-xl font-black text-white">₹{data.daily_avg}</p>
                            <p className="text-[9px] text-stone-500 uppercase font-bold">Daily Avg</p>
                        </div>
                        <div className="text-right border-l border-stone-800 pl-4">
                            <p className={`text-xl font-black ${data.burn_rate > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{data.burn_rate}%</p>
                            <p className="text-[9px] text-stone-500 uppercase font-bold">Volatility</p>
                        </div>
                    </div>
                </div>
                <div className="h-48">
                    <SpendingGraph labels={graphData.labels} values={graphData.values} />
                </div>
            </div>

            {/* ZONE 3: ACTIONS & GOALS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:order-none order-last">
                <ActionZone
                    form={form}
                    setForm={setForm}
                    anchor={anchor}
                    setAnchor={setAnchor}
                    investments={investments}
                    setInvestments={setInvestments}
                    suggestedAnchor={suggestedAnchor}
                    onLog={handleManualLog}
                    loading={loading}
                />

                {/* Freedom Goal Setter */}
                <div className="h-full">
                    <GoalSetter currentDailyLimit={data.daily_limit} />
                </div>
            </div>

            {/* ZONE 4: LIVE HISTORY & BULK UPLOAD */}
            <HistoryList history={history} onUpload={handleBulkUpload} loading={loading} />
        </div>
    );
}

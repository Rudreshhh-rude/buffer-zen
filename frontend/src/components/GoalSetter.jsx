import { useState, useEffect } from 'react';
import { Target, Calendar, Calculator, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoalSetter({ currentDailyLimit }) {
    const [goal, setGoal] = useState(() => {
        const saved = localStorage.getItem('buffer_goal');
        return saved ? JSON.parse(saved) : { name: '', cost: '', date: '' };
    });

    useEffect(() => {
        localStorage.setItem('buffer_goal', JSON.stringify(goal));
    }, [goal]);

    const calculateImpact = () => {
        if (!goal.cost || !goal.date) return null;
        const today = new Date();
        const target = new Date(goal.date);
        const diffTime = Math.abs(target - today);
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) return { days: 0, dailySave: 0 };

        const dailySave = Math.ceil(Number(goal.cost) / daysLeft);
        const newDailyLimit = Math.max(0, currentDailyLimit - dailySave);

        return { days: daysLeft, dailySave, newDailyLimit };
    };

    const impact = calculateImpact();

    return (
        <div className="bg-stone-900/40 p-6 rounded-[2rem] border border-stone-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Target size={120} className="text-purple-500" />
            </div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <Target size={16} className="text-purple-400" />
                <h4 className="font-black uppercase text-[10px] tracking-widest text-stone-500">Freedom Goal (The Carrot)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Goal Name (e.g. Sabbatical)"
                        value={goal.name}
                        onChange={e => setGoal({ ...goal, name: e.target.value })}
                        className="w-full bg-black/20 border border-stone-800 rounded-xl p-3 text-sm text-white placeholder:text-stone-600 focus:border-purple-500 outline-none transition-colors"
                    />
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Cost (₹)"
                            value={goal.cost}
                            onChange={e => setGoal({ ...goal, cost: e.target.value })}
                            className="w-1/2 bg-black/20 border border-stone-800 rounded-xl p-3 text-sm text-white placeholder:text-stone-600 focus:border-purple-500 outline-none transition-colors"
                        />
                        <input
                            type="date"
                            value={goal.date}
                            onChange={e => setGoal({ ...goal, date: e.target.value })}
                            className="w-1/2 bg-black/20 border border-stone-800 rounded-xl p-3 text-xs text-white placeholder:text-stone-600 focus:border-purple-500 outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="flex flex-col justify-center">
                    {impact ? (
                        <div className="text-center space-y-2">
                            <p className="text-[10px] uppercase tracking-widest text-stone-400">To achieve this in <span className="text-white">{impact.days} days</span>:</p>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                                <p className="text-[10px] text-purple-400 font-bold uppercase">Save Daily</p>
                                <p className="text-2xl font-black text-white">₹{impact.dailySave.toLocaleString()}</p>
                            </div>
                            {currentDailyLimit > 0 && (
                                <p className="text-[9px] text-stone-500">
                                    New Safe-to-Spend: <span className={impact.newDailyLimit < 500 ? "text-red-400" : "text-emerald-400"}>₹{impact.newDailyLimit.toLocaleString()}</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <Calculator size={24} className="mb-2 text-purple-400" />
                            <p className="text-[10px] max-w-[12rem]">Set a target to calculate your "Daily Sacrifice".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

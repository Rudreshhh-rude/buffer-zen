import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpendingGraph({ labels, values }) {
    const maxVal = Math.max(...values, 1);

    return (
        <div className="bg-stone-900/80 p-5 rounded-[2rem] border border-stone-800 shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">7-Day Momentum</h3>
                <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div className="flex-1 flex items-end justify-between gap-2 min-h-[8rem]">
                {values.length > 0 ? (
                    values.map((v, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(v / maxVal) * 100}%` }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="w-full bg-emerald-500/5 border-t border-emerald-500/40 rounded-t-md transition-colors duration-300 group-hover:bg-emerald-500/20"
                            />
                            <span className="text-[9px] text-stone-600 font-bold">{labels[i]?.slice(-2) || '--'}</span>
                        </div>
                    ))
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-3 p-4">
                        <div className="p-3 bg-stone-800/50 rounded-full">
                            <TrendingUp size={20} className="text-stone-600" />
                        </div>
                        <div>
                            <p className="text-stone-400 text-xs font-bold">No Activity Yet</p>
                            <p className="text-[10px] text-stone-600 mt-1 max-w-[10rem] mx-auto">Log your first expense to activate your resilience score.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ChaosControl({ anchor, setAnchor, investments, setInvestments, onCommit, loading }) {
    return (
        <div className="glass-panel p-6 rounded-xl flex flex-col h-full relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-3 items-center">
                    <div className="bg-buf-cyan/10 p-1.5 rounded-md text-buf-cyan shadow-[0_0_10px_rgba(13,242,201,0.2)]">
                        <BarChart3 size={16} />
                    </div>
                    <h2 className="text-sm font-black text-white tracking-widest">Chaos Control</h2>
                </div>
                <div className="px-2 py-0.5 rounded border border-buf-cyan/40 bg-buf-cyan/10 text-buf-cyan text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Active Live
                </div>
            </div>

            {/* Inputs */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="group">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block mb-2 group-hover:text-stone-400 transition-colors">
                        Fixed Anchor (Monthly)
                    </label>
                    <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-3 flex items-center gap-2 focus-within:border-buf-cyan/50 focus-within:ring-1 focus-within:ring-buf-cyan/20 transition-all">
                        <span className="text-buf-cyan font-black text-sm">$</span>
                        <input
                            type="number"
                            value={anchor}
                            onChange={(e) => setAnchor(e.target.value)}
                            className="bg-transparent border-none outline-none text-white font-black w-full"
                        />
                    </div>
                </div>

                <div className="group">
                    <label className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block mb-2 group-hover:text-stone-400 transition-colors">
                        Liquid Assets
                    </label>
                    <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-3 flex items-center gap-2 focus-within:border-buf-cyan/50 focus-within:ring-1 focus-within:ring-buf-cyan/20 transition-all">
                        <span className="text-buf-cyan font-black text-sm">$</span>
                        <input
                            type="number"
                            value={investments}
                            onChange={(e) => setInvestments(e.target.value)}
                            className="bg-transparent border-none outline-none text-white font-black w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] text-stone-400 font-bold flex items-center gap-2">
                        <svg className="animate-spin text-stone-500" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                        Recalculating system buffers...
                    </span>
                    <span className="text-buf-cyan font-black text-[10px]">82%</span>
                </div>
                <div className="h-1 bg-stone-900 rounded-full mb-6">
                    <div className="h-full bg-buf-cyan w-[82%] relative">
                        <div className="absolute top-0 right-0 w-2 h-full bg-white opacity-50 blur-[1px]"></div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCommit}
                    disabled={loading}
                    className="w-full bg-buf-cyan text-stone-950 font-black text-[11px] uppercase tracking-widest py-4 rounded-lg hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(13,242,201,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                >
                    {loading ? 'Commiting...' : 'Commit Changes'}
                </motion.button>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-buf-cyan/5 blur-3xl pointer-events-none rounded-full"></div>
        </div>
    );
}

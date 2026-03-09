import { motion } from 'framer-motion';
import Topbar from './components/Topbar';

export default function Strategy({ currentView, onViewChange, onSignOut }) {
    return (
        <div className="min-h-screen bg-buf-bg text-stone-100 font-sans">
            <Topbar currentView={currentView} onViewChange={onViewChange} onSignOut={onSignOut} />
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Protocol Strategy</h2>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Long-Term Wealth Simulation & Stress Testing</p>
                </motion.div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="glass-panel p-10 rounded-xl flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-stone-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-700/50">
                                <span className="text-stone-400">⚡</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Strategy Lab Offline</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto">Advanced Monte Carlo stress testing and variable compound interest projections will be available in this module soon.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

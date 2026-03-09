import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Zap, Bell, Settings, User } from 'lucide-react';

export default function Topbar({ onSignOut, currentView, onViewChange, error, uploadSuccess, isStressed, onToggleChaos }) {
    const [toast, setToast] = useState(null);

    const triggerToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <header className="flex justify-between items-center py-4 border-b border-stone-800/50 mb-8 px-6 md:px-8 bg-buf-bg/80 backdrop-blur-md sticky top-0 z-50">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                {/* Logo Icon */}
                <div className="w-8 h-8 bg-buf-cyan rounded-md flex items-center justify-center relative shadow-[0_0_15px_rgba(13,242,201,0.2)]">
                    <div className="absolute inset-1 border-[1.5px] border-buf-bg rounded-sm"></div>
                    <div className="w-2 h-2 bg-buf-bg rounded-[1px] mx-auto z-10"></div>
                </div>
                <div className="flex items-baseline gap-2 cursor-pointer" onClick={() => onViewChange('dashboard')}>
                    <h1 className="text-2xl font-black text-white tracking-tighter">BufferZen</h1>
                    <span className="text-buf-cyan text-[10px] font-black tracking-widest">V2.4</span>
                </div>
            </motion.div>

            {/* Center Navigation */}
            <motion.nav
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="hidden lg:flex gap-8 text-[11px] font-black tracking-widest"
            >
                <button
                    onClick={() => onViewChange('dashboard')}
                    className={`transition-colors uppercase ${currentView === 'dashboard' ? 'text-white border-b-2 border-buf-cyan pb-1' : 'text-stone-500 hover:text-buf-cyan'}`}
                >
                    DASHBOARD
                </button>
                <button
                    onClick={() => onViewChange('analytics')}
                    className={`transition-colors uppercase ${currentView === 'analytics' ? 'text-white border-b-2 border-buf-cyan pb-1' : 'text-stone-500 hover:text-white'}`}
                >
                    ANALYTICS
                </button>
                <button
                    onClick={() => onViewChange('strategy')}
                    className={`transition-colors uppercase ${currentView === 'strategy' ? 'text-white border-b-2 border-buf-cyan pb-1' : 'text-stone-500 hover:text-white'}`}
                >
                    STRATEGY
                </button>
            </motion.nav>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-5">
                {error && <div className="text-buf-red text-[10px] font-black uppercase"><AlertCircle size={12} className="inline mr-1" /> {error}</div>}
                {uploadSuccess && <div className="text-buf-green text-[10px] font-black uppercase"><CheckCircle size={12} className="inline mr-1" /> {uploadSuccess}</div>}

                <button onClick={onToggleChaos} className="text-stone-400 hover:text-buf-cyan transition-colors relative" title="Toggle Chaos Mode">
                    <Zap size={18} className={isStressed ? 'text-buf-red fill-current animate-pulse' : ''} />
                </button>
                <button onClick={() => triggerToast("Notifications Module")} className="text-stone-400 hover:text-white transition-colors relative" title="Notifications">
                    <Bell size={18} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-buf-red rounded-full border-2 border-buf-bg"></span>
                </button>
                <button onClick={() => triggerToast("Core Settings")} className="text-stone-400 hover:text-white transition-colors" title="Settings">
                    <Settings size={18} />
                </button>
                <div className="flex items-center pl-3 border-l border-stone-800/80">
                    <button onClick={onSignOut} className="w-8 h-8 rounded-full bg-stone-800 border border-stone-700 overflow-hidden hover:ring-2 hover:ring-buf-cyan transition-all flex items-center justify-center" title="Sign Out">
                        <User size={16} className="text-stone-300" />
                    </button>
                </div>
            </motion.div>

            {/* Floating Demo Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-20 right-6 z-50 glass-panel border-buf-cyan/50 px-4 py-3 rounded-lg flex items-center gap-3 shadow-[0_0_20px_rgba(13,242,201,0.15)]"
                    >
                        <div className="w-6 h-6 rounded-full bg-buf-cyan/20 flex items-center justify-center">
                            <Zap size={12} className="text-buf-cyan" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-white tracking-widest">{toast}</p>
                            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Available in V3.0</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

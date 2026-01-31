import { AlertTriangle, Briefcase, TrendingDown, ZapOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const SCENARIOS = [
    {
        id: 'job_loss',
        label: 'Income Stop',
        desc: 'Reliance on savings',
        icon: ZapOff,
        color: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20'
    },
    {
        id: 'inflation',
        label: 'Cost Spike',
        desc: 'Expenses +20%',
        icon: AlertTriangle,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/20'
    },
    {
        id: 'market_crash',
        label: 'Market Crash',
        desc: 'Assets -30%',
        icon: TrendingDown,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    }
];

export default function ChaosControl({ activeScenarios, onToggle }) {
    return (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {SCENARIOS.map((scenario) => {
                const isActive = activeScenarios[scenario.id];
                const Icon = scenario.icon;

                return (
                    <motion.button
                        key={scenario.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onToggle(scenario.id)}
                        className={`
                            relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 min-w-[140px]
                            ${isActive
                                ? `${scenario.bg} ${scenario.border} ring-1 ring-inset ring-white/10`
                                : 'bg-stone-900/40 border-stone-800 hover:border-stone-700 opacity-60 hover:opacity-100'}
                        `}
                    >
                        <div className={`
                            p-2 rounded-lg transition-colors
                            ${isActive ? 'bg-black/20 text-white' : 'bg-stone-800 text-stone-400'}
                        `}>
                            <Icon size={16} />
                        </div>
                        <div className="text-left">
                            <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? scenario.color : 'text-stone-400'}`}>
                                {scenario.label}
                            </p>
                            <p className="text-[9px] text-stone-500 font-bold">
                                {scenario.desc}
                            </p>
                        </div>

                        {/* Active Indicator Dot */}
                        {isActive && (
                            <motion.div
                                layoutId="active-dot"
                                className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${scenario.color.replace('text-', 'bg-')}`}
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}

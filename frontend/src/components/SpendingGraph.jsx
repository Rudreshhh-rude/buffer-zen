import { motion } from 'framer-motion';

export default function SpendingGraph({ labels, values }) {
    const maxVal = Math.max(...values, 1);
    const avgVal = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return (
        <div className="w-full h-full flex items-end justify-between gap-2 pt-8">
            {values.length > 0 ? (
                values.map((v, i) => {
                    const isVolatile = v > avgVal;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(2, (v / maxVal) * 100)}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                                className={`w-1/2 rounded-t-sm transition-all duration-300 ${isVolatile
                                        ? 'bg-buf-red/80 hover:bg-buf-red shadow-[0_0_10px_rgba(255,77,77,0.3)]'
                                        : 'bg-buf-cyan/20 hover:bg-buf-cyan/60'
                                    }`}
                            />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${isVolatile ? 'text-buf-red' : 'text-stone-600'}`}>
                                {labels[i]?.slice(0, 3) || 'DAY'}
                            </span>
                        </div>
                    );
                })
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <p className="text-[10px] text-stone-600 font-bold uppercase tracking-widest">No Activity Yet</p>
                </div>
            )}
        </div>
    );
}

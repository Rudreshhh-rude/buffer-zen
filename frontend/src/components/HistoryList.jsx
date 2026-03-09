import { UploadCloud, Filter, ShoppingBag, Banknote, Coffee, Check } from 'lucide-react';

export default function HistoryList({ history, onUpload, loading }) {
    // Map item names to mock icons if possible, or fallback
    const getIcon = (desc) => {
        const d = (desc || '').toLowerCase();
        if (d.includes('aws') || d.includes('cloud')) return <ShoppingBag size={14} />;
        if (d.includes('stripe') || d.includes('payout')) return <Banknote size={14} />;
        if (d.includes('coffee') || d.includes('food')) return <Coffee size={14} />;
        return <ShoppingBag size={14} />;
    };

    const getCategory = (item) => {
        const d = (item.description || '').toLowerCase();
        if (d.includes('aws')) return 'INFRASTRUCTURE';
        if (item.type === 'Income') return 'REVENUE';
        if (d.includes('coffee')) return 'LIFESTYLE';
        return 'EXPENSE';
    };

    return (
        <div className="glass-panel rounded-xl overflow-hidden mt-6 flex flex-col pt-6 relative">
            {/* Header */}
            <div className="px-6 pb-6 flex justify-between items-start border-b border-stone-800/50">
                <div>
                    <h2 className="text-xl font-black text-white tracking-tighter mb-1">Transaction Audit Feed</h2>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Deep inspection of ledger movement</p>
                </div>
                <div className="flex gap-3">
                    <label className={`cursor-pointer border border-buf-cyan/30 bg-buf-cyan/5 hover:bg-buf-cyan/10 transition-colors px-4 py-2 rounded-lg flex items-center gap-2 ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                        {loading ? <span className="animate-spin w-3 h-3 border-2 border-buf-cyan border-t-transparent rounded-full" /> : <UploadCloud size={14} className="text-buf-cyan" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-buf-cyan">{loading ? 'UPLOADING...' : 'BULK CSV UPLOAD'}</span>
                        <input type="file" accept=".csv,image/*" onChange={onUpload} className="hidden" disabled={loading} />
                    </label>
                    <button className="border border-buf-cyan/30 bg-buf-cyan/5 hover:bg-buf-cyan/10 transition-colors px-3 py-2 rounded-lg flex items-center justify-center">
                        <Filter size={16} className="text-buf-cyan" />
                    </button>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-800/50">
                <div className="col-span-5 text-[9px] text-buf-cyan font-black uppercase tracking-widest">TRANSACTION DETAILS</div>
                <div className="col-span-2 text-[9px] text-buf-cyan font-black uppercase tracking-widest">CATEGORY</div>
                <div className="col-span-2 text-[9px] text-buf-cyan font-black uppercase tracking-widest">STATUS</div>
                <div className="col-span-2 text-[9px] text-buf-cyan font-black uppercase tracking-widest">AMOUNT</div>
                <div className="col-span-1 text-[9px] text-buf-cyan font-black uppercase tracking-widest text-right">FIXED COST</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto max-h-[300px]">
                {history.length > 0 ? (
                    history.map((item, i) => {
                        const isIncome = item.type === 'Income';
                        const amountStr = `${isIncome ? '+' : '-'}$${Math.abs(item.amount).toFixed(2)}`;
                        const isCleared = item.status !== 'pending';

                        return (
                            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-800/30 hover:bg-stone-900/40 transition-colors items-center">
                                {/* Details */}
                                <div className="col-span-5 flex items-center gap-4">
                                    <div className={`p-2 rounded-md ${isIncome ? 'bg-buf-green/10 text-buf-green' : 'bg-buf-red/10 text-buf-red'}`}>
                                        {getIcon(item.description)}
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-black text-white tracking-wide">{item.description}</p>
                                        <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">
                                            {item.date || '08 OCT 2023'} • ID: {492021 + i}
                                        </p>
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="col-span-2 flex items-center">
                                    <span className="px-2 py-0.5 rounded-full border border-stone-700 bg-stone-900 text-[8px] font-black uppercase tracking-widest text-stone-300">
                                        {getCategory(item)}
                                    </span>
                                </div>

                                {/* Status */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isCleared ? 'bg-buf-green' : 'bg-buf-cyan'}`}></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-300">
                                        {isCleared ? 'CLEARED' : 'PENDING'}
                                    </span>
                                </div>

                                {/* Amount */}
                                <div className="col-span-2 flex items-center">
                                    <span className={`text-[13px] font-black tracking-wider ${isIncome ? 'text-buf-green' : 'text-buf-red'}`}>
                                        {amountStr}
                                    </span>
                                </div>

                                {/* Fixed Cost */}
                                <div className="col-span-1 flex items-center justify-end">
                                    {item.is_fixed ? (
                                        <div className="w-5 h-5 rounded bg-buf-cyan/20 border border-buf-cyan flex items-center justify-center">
                                            <Check size={12} className="text-buf-cyan" />
                                        </div>
                                    ) : (
                                        <span className="text-stone-600 font-bold">–</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-12 text-center text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                        No transactions recorded.
                    </div>
                )}
            </div>

            {/* Footer Pagination */}
            <div className="px-6 py-4 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-stone-500 border-t border-stone-800/50">
                <span>SHOWING {Math.min(3, history.length)} OF {Math.max(42, history.length)} TRANSACTIONS</span>
                <div className="flex gap-4">
                    <button className="hover:text-white transition-colors">Previous</button>
                    <button className="hover:text-white transition-colors text-white">Next</button>
                </div>
            </div>
        </div>
    );
}

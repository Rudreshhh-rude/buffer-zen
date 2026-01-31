import { History, UploadCloud, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function HistoryList({ history, onUpload, loading }) {
    return (
        <div className="bg-stone-900/40 rounded-[2rem] border border-stone-800 overflow-hidden">
            <div className="p-4 border-b border-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-400"><History size={16} /><span className="text-[10px] font-black uppercase tracking-widest">History</span></div>
                <label className={`cursor-pointer bg-stone-800 hover:bg-stone-700 p-2 px-4 rounded-lg flex items-center gap-2 transition-all ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                    {loading ? <Loader2 size={14} className="text-emerald-400 animate-spin" /> : <UploadCloud size={14} className="text-emerald-400" />}
                    <span className="text-[9px] font-black uppercase tracking-widest text-white">{loading ? 'Scanning...' : 'Scan Statement'}</span>
                    <input type="file" accept=".csv,image/*" onChange={onUpload} className="hidden" disabled={loading} />
                </label>
            </div>
            <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                {history.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-emerald-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${item.type === 'Income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {item.type === 'Income' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase">{item.description}</p>
                                <p className="text-[9px] text-stone-500 uppercase font-black tracking-widest">{item.date}</p>
                            </div>
                        </div>
                        <p className={`text-sm font-black ${item.type === 'Income' ? 'text-emerald-400' : 'text-stone-100'}`}>
                            {item.type === 'Income' ? '+' : '-'}₹{item.amount}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

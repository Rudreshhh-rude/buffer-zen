import { Zap, CheckCircle, Anchor, Briefcase, Loader2 } from 'lucide-react';

export default function ActionZone({
    form,
    setForm,
    anchor,
    setAnchor,
    investments,
    setInvestments,
    suggestedAnchor,
    onLog,
    loading
}) {
    return (
        <div className="space-y-4">
            {/* Log Expense - PRIMARY ACTION */}
            <div className="bg-stone-900/60 p-6 rounded-[2rem] border border-stone-800/80 shadow-lg space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={64} className={form.type === 'Expense' ? 'text-yellow-500' : 'text-emerald-500'} />
                </div>
                <div className="flex items-center justify-between relative z-10">
                    <div className={`flex items-center gap-3 ${form.type === 'Expense' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                        <Zap size={20} />
                        <h4 className="font-black text-white uppercase text-xs tracking-widest">Log {form.type}</h4>
                    </div>
                    <div className="flex bg-black/40 rounded-lg p-1 border border-stone-800">
                        <button onClick={() => setForm({ ...form, type: 'Expense' })} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${form.type === 'Expense' ? 'bg-yellow-500 text-black' : 'text-stone-500 hover:text-stone-300'}`}>Exp</button>
                        <button onClick={() => setForm({ ...form, type: 'Income' })} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${form.type === 'Income' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-stone-300'}`}>Inc</button>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <input type="number" inputMode="decimal" placeholder="₹" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={`w-24 bg-black/40 p-3 rounded-xl border border-stone-800 outline-none focus:border-${form.type === 'Expense' ? 'yellow' : 'emerald'}-500 font-black`} />
                    <input type="text" placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={`flex-1 bg-black/40 p-3 rounded-xl border border-stone-800 outline-none focus:border-${form.type === 'Expense' ? 'yellow' : 'emerald'}-500`} />
                </div>

                {/* Smart Anchor Checkbox */}
                {form.type === 'Expense' && (
                    <label className="flex items-center gap-2 cursor-pointer relative z-10 group/check w-fit">
                        <input
                            type="checkbox"
                            checked={form.is_fixed}
                            onChange={e => setForm({ ...form, is_fixed: e.target.checked })}
                            className="peer sr-only"
                        />
                        <div className="w-4 h-4 rounded border border-stone-700 bg-stone-900 peer-checked:bg-yellow-500 peer-checked:border-yellow-500 transition-colors flex items-center justify-center">
                            <CheckCircle size={10} className="text-black opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-[10px] text-stone-500 group-hover/check:text-stone-300 font-bold uppercase tracking-wider select-none">
                            Fixed Cost (Subscription/Rent)
                        </span>
                    </label>
                )}
                <button onClick={onLog} className={`w-full relative z-10 ${form.type === 'Expense' ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-emerald-500 hover:bg-emerald-400'} text-black font-black py-3 rounded-xl transition-all shadow-lg uppercase tracking-widest text-[10px]`}>
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : `Confirm ${form.type}`}
                </button>
            </div>
        </div>
    );
}

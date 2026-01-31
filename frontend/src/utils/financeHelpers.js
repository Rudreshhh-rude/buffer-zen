export const getResilienceLabel = (score) => {
    if (score === 0) return { label: "Vulnerable", color: "text-slate-400", bg: "bg-slate-400" };
    if (score < 30) return { label: "Starting Out", color: "text-yellow-500", bg: "bg-yellow-500" };
    if (score < 60) return { label: "Stabilizing", color: "text-blue-400", bg: "bg-blue-400" };
    if (score < 85) return { label: "Resilient", color: "text-emerald-400", bg: "bg-emerald-400" };
    return { label: "Unshakeable", color: "text-purple-400", bg: "bg-purple-400" };
};

export const calculateStressMetrics = (data, investments, scenarios) => {
    let { daily_avg, current_balance, survival_horizon } = data;
    let stressedInvestments = investments || 0;

    // 1. Inflation: Increase Daily Spend (Burn Rate)
    // We modify daily_avg effectively by reducing the 'value' of money or increasing costs
    if (scenarios.inflation) {
        daily_avg = daily_avg * 1.2; // +20% expenses
    }

    // 2. Market Crash: Reduce Assets
    if (scenarios.market_crash) {
        stressedInvestments = stressedInvestments * 0.7; // -30% value
    }

    // 3. Job Loss: Income stops? 
    // In this simplified view, we assumes 'daily_avg' is the burn. 
    // If Job Loss means 'No Replenishment', it just means we are purely relying on the burn rate.
    // For the Horizon calculation: (Cash + Assets) / DailyBurn
    // This formula ALREADY assumes no income (it's a runway calculation).
    // So 'Job Loss' scenario in this context might ideally highlight the *urgency*.
    // For now, let's keep it simple: Maybe Job Loss adds a 'buffer penalty' for severance?
    // Actually, let's treat Job Loss as strict mode: we assume daily_avg spikes because we lose perks?
    // OR: We simply re-calculate Horizon strictly based on these new stressed numbers.

    const totalLiquid = current_balance + stressedInvestments;

    // Recalculate Horizon
    const stressedHorizon = daily_avg > 0 ? Math.round(totalLiquid / daily_avg) : 0;

    return {
        daily_avg_stress: Math.round(daily_avg),
        investments_stress: Math.round(stressedInvestments),
        horizon_stress: stressedHorizon
    };
};

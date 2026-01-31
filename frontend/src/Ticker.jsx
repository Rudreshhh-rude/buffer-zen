import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';

export default function Ticker() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchMarketData = async () => {
        try {
            setLoading(true);
            setError(false);

            // 1. Crypto (CoinGecko - Free, no key needed for simple client-side)
            const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true');
            const cryptoJson = await cryptoRes.json();

            // 2. Forex (Open Exchange Rates / Franken - heavy rate limits, trying a public fallback)
            // Using a reliable public exchange rate API (Frankfurter)
            const forexRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=INR,EUR,GBP');
            const forexJson = await forexRes.json();

            // Transform Data
            const newData = [
                {
                    symbol: "BTC",
                    value: `$${cryptoJson.bitcoin.usd.toLocaleString()}`,
                    change: `${cryptoJson.bitcoin.usd_24h_change.toFixed(1)}%`,
                    up: cryptoJson.bitcoin.usd_24h_change >= 0
                },
                {
                    symbol: "ETH",
                    value: `$${cryptoJson.ethereum.usd.toLocaleString()}`,
                    change: `${cryptoJson.ethereum.usd_24h_change.toFixed(1)}%`,
                    up: cryptoJson.ethereum.usd_24h_change >= 0
                },
                {
                    symbol: "SOL",
                    value: `$${cryptoJson.solana.usd.toLocaleString()}`,
                    change: `${cryptoJson.solana.usd_24h_change.toFixed(1)}%`,
                    up: cryptoJson.solana.usd_24h_change >= 0
                },
                {
                    symbol: "USD/INR",
                    value: `₹${forexJson.rates.INR.toFixed(2)}`,
                    change: "LIVE",
                    up: true
                },
                {
                    symbol: "USD/EUR",
                    value: `€${forexJson.rates.EUR.toFixed(2)}`,
                    change: "LIVE",
                    up: true
                }
            ];
            setData(newData);
        } catch (err) {
            console.error("Market fetch failed:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        // Refresh every 60s
        const interval = setInterval(fetchMarketData, 60000);
        return () => clearInterval(interval);
    }, []);

    if (error) return null; // Hide ticker if API fails (rate limits)

    return (
        <div className="w-full bg-slate-900/80 border-b border-slate-800 overflow-hidden py-2 flex relative z-10 group">
            {loading && !data.length ? (
                <div className="flex items-center gap-2 px-4 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                    <RefreshCw size={10} className="animate-spin" /> Fetching Live Market Data...
                </div>
            ) : (
                <div className="flex gap-8 animate-marquee whitespace-nowrap group-hover:pause">
                    {[...data, ...data, ...data].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-black tracking-widest uppercase">
                            <span className="text-slate-400">{item.symbol}</span>
                            <span className="text-white">{item.value}</span>
                            <span className={`flex items-center ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>
                                {item.change !== "LIVE" && (item.up ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />)}
                                {item.change}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

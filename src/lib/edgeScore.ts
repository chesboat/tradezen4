import { Trade } from '@/types';

export interface EdgeScoreBreakdown {
	winRate: number;        // 0-100: Win rate performance vs target (50%+)
	profitFactor: number;   // 0-100: Profit factor performance vs target (1.5+)
	expectancy: number;     // 0-100: Expected return per trade in R
	consistency: number;    // 0-100: Sharpe-like consistency measure
	drawdown: number;       // 0-100: Drawdown control (lower is better)
	sampleSize: number;     // 0-100: Statistical significance (50+ trades)
}

export interface EdgeScoreResult {
	score: number; // 0..100
	breakdown: EdgeScoreBreakdown;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Lightweight Edge Score composite. Assumes trades include pnl (USD) and riskAmount (USD) when available.
export function computeEdgeScore(trades: Trade[]): EdgeScoreResult {
	if (!trades || trades.length === 0) {
		return {
			score: 0,
			breakdown: { winRate: 0, profitFactor: 0, expectancy: 0, consistency: 0, drawdown: 0, sampleSize: 0 }
		};
	}

	const wins = trades.filter(t => (t.pnl || 0) > 0);
	const losses = trades.filter(t => (t.pnl || 0) < 0);
	const total = trades.length;
	const winRatePct = (wins.length / total) * 100;

	const grossProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0);
	const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
	const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 2.5 : 0); // cap for small samples

	// Expectancy in R (fallback to USD normalized by average absolute loss if risk missing)
	const rValues: number[] = trades.map(t => {
		const risk = Math.max(1, t.riskAmount || 0);
		if (risk > 1) return (t.pnl || 0) / risk; // in R
		// fallback: use avg abs loss as risk proxy
		return (t.pnl || 0) / Math.max(1, grossLoss / Math.max(1, losses.length));
	});
	const expectancyR = rValues.reduce((a, b) => a + b, 0) / rValues.length;

	// Consistency via simple Sharpe on daily pnl
	const dailyMap = new Map<string, number>();
	trades.forEach(t => {
		const d = new Date(t.entryTime).toISOString().slice(0, 10);
		dailyMap.set(d, (dailyMap.get(d) || 0) + (t.pnl || 0));
	});
	const daily = Array.from(dailyMap.values());
	const avg = daily.reduce((a, b) => a + b, 0) / daily.length;
	const std = Math.sqrt(daily.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / daily.length) || 0.00001;
	const sharpe = avg / std; // not annualized; directionally useful

	// Max drawdown from equity curve (USD)
	let equity = 0;
	let peak = 0;
	let maxDD = 0; // percent from peak
	trades.forEach(t => {
		equity += (t.pnl || 0);
		if (equity > peak) peak = equity;
		if (peak > 0) maxDD = Math.max(maxDD, (peak - equity) / peak * 100);
	});

	// Map to 0..100 sub-scores with realistic thresholds
	const winRateScore = clamp(((winRatePct - 30) / (70 - 30)) * 100, 0, 100); // 30-70% range
	const profitFactorScore = profitFactor >= 1.5
		? 100
		: profitFactor <= 0.8
			? 0
			: ((profitFactor - 0.8) / (1.5 - 0.8)) * 100;
	const expectancyScore = clamp(((expectancyR - (-0.5)) / (0.3 - (-0.5))) * 100, 0, 100); // -0.5R to +0.3R
	const consistencyScore = sharpe <= -0.5 ? 0 : clamp(((sharpe + 0.5) / 1.5) * 100, 0, 100); // -0.5 to 1.0 SR
	const drawdownScore = clamp(100 - maxDD * 2, 0, 100); // Less harsh on drawdown
	const sampleSizeScore = clamp((total / 30) * 100, 0, 100); // 30 trades for full score

	// Weights sum to 100 - emphasize profitability over perfection
	const weights = { winRate: 15, profitFactor: 30, expectancy: 25, consistency: 10, drawdown: 15, sampleSize: 5 };
	const score = (
		winRateScore * (weights.winRate / 100) +
		profitFactorScore * (weights.profitFactor / 100) +
		expectancyScore * (weights.expectancy / 100) +
		consistencyScore * (weights.consistency / 100) +
		drawdownScore * (weights.drawdown / 100) +
		sampleSizeScore * (weights.sampleSize / 100)
	);

	return {
		score: Math.round(score),
		breakdown: {
			winRate: Math.round(winRateScore),
			profitFactor: Math.round(profitFactorScore),
			expectancy: Math.round(expectancyScore),
			consistency: Math.round(consistencyScore),
			drawdown: Math.round(drawdownScore),
			sampleSize: Math.round(sampleSizeScore)
		}
	};
}



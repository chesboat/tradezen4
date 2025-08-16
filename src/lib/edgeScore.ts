import { Trade } from '@/types';

export interface EdgeScoreBreakdown {
	winRate: number;        // 0-100: Win percentage score
	avgWinLoss: number;     // 0-100: Average win/loss ratio score  
	profitFactor: number;   // 0-100: Profit factor score
	maxDrawdown: number;    // 0-100: Max drawdown score (inverted)
	recoveryFactor: number; // 0-100: Recovery factor score
	consistency: number;    // 0-100: Consistency score (inverted volatility)
}

export interface EdgeScoreResult {
	score: number; // 0..100
	breakdown: EdgeScoreBreakdown;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Trading Performance Score based on proven industry metrics
export function computeEdgeScore(trades: Trade[]): EdgeScoreResult {
	if (!trades || trades.length === 0) {
		return {
			score: 0,
			breakdown: { winRate: 0, avgWinLoss: 0, profitFactor: 0, maxDrawdown: 0, recoveryFactor: 0, consistency: 0 }
		};
	}

	const wins = trades.filter(t => (t.pnl || 0) > 0);
	const losses = trades.filter(t => (t.pnl || 0) < 0);
	const total = trades.length;
	const winRatePct = (wins.length / total) * 100;

	const grossProfit = wins.reduce((s, t) => s + (t.pnl || 0), 0);
	const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0));
	const netProfit = grossProfit - grossLoss;

	// 1. Win Rate Score (TradeZella: top threshold 60%)
	const winRateScore = clamp((winRatePct / 60) * 100, 0, 100);

	// 2. Average Win/Loss Ratio Score
	const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
	const avgLoss = losses.length > 0 ? grossLoss / losses.length : 1;
	const winLossRatio = avgWin / avgLoss;
	const avgWinLossScore = winLossRatio >= 2.6 ? 100 :
		winLossRatio >= 2.4 ? 90 + ((winLossRatio - 2.4) / 0.2) * 10 :
		winLossRatio >= 2.2 ? 80 + ((winLossRatio - 2.2) / 0.2) * 10 :
		winLossRatio >= 2.0 ? 70 + ((winLossRatio - 2.0) / 0.2) * 10 :
		winLossRatio >= 1.9 ? 60 + ((winLossRatio - 1.9) / 0.1) * 10 :
		winLossRatio >= 1.8 ? 50 + ((winLossRatio - 1.8) / 0.1) * 10 :
		20;

	// 3. Profit Factor Score
	const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 2.6 : 0);
	const profitFactorScore = profitFactor >= 2.6 ? 100 :
		profitFactor >= 2.4 ? 90 + ((profitFactor - 2.4) / 0.2) * 10 :
		profitFactor >= 2.2 ? 80 + ((profitFactor - 2.2) / 0.2) * 10 :
		profitFactor >= 2.0 ? 70 + ((profitFactor - 2.0) / 0.2) * 10 :
		profitFactor >= 1.9 ? 60 + ((profitFactor - 1.9) / 0.1) * 10 :
		profitFactor >= 1.8 ? 50 + ((profitFactor - 1.8) / 0.1) * 10 :
		20;

	// 4. Max Drawdown Score (inverted - lower drawdown = higher score)
	let equity = 0;
	let peak = 0;
	let maxDD = 0; // percent from peak
	trades.forEach(t => {
		equity += (t.pnl || 0);
		if (equity > peak) peak = equity;
		if (peak > 0) maxDD = Math.max(maxDD, (peak - equity) / peak * 100);
	});
	const maxDrawdownScore = clamp(100 - maxDD, 0, 100);

	// 5. Recovery Factor Score (Net Profit / Max Drawdown)
	const maxDrawdownUSD = trades.reduce((maxDD, trade, i) => {
		const equity = trades.slice(0, i + 1).reduce((sum, t) => sum + (t.pnl || 0), 0);
		const peak = trades.slice(0, i + 1).reduce((peak, t, j) => {
			const eq = trades.slice(0, j + 1).reduce((s, tr) => s + (tr.pnl || 0), 0);
			return Math.max(peak, eq);
		}, 0);
		return Math.max(maxDD, peak - equity);
	}, 0);
	
	const recoveryFactor = maxDrawdownUSD > 0 ? Math.abs(netProfit) / maxDrawdownUSD : (netProfit > 0 ? 3.5 : 0);
	const recoveryFactorScore = recoveryFactor >= 3.5 ? 100 :
		recoveryFactor >= 3.0 ? 70 + ((recoveryFactor - 3.0) / 0.5) * 19 :
		recoveryFactor >= 2.5 ? 60 + ((recoveryFactor - 2.5) / 0.5) * 10 :
		recoveryFactor >= 2.0 ? 50 + ((recoveryFactor - 2.0) / 0.5) * 10 :
		recoveryFactor >= 1.5 ? 30 + ((recoveryFactor - 1.5) / 0.5) * 20 :
		recoveryFactor >= 1.0 ? 1 + ((recoveryFactor - 1.0) / 0.5) * 28 :
		0;

	// 6. Consistency Score (based on daily P&L volatility)
	const dailyMap = new Map<string, number>();
	trades.forEach(t => {
		const d = new Date(t.entryTime).toISOString().slice(0, 10);
		dailyMap.set(d, (dailyMap.get(d) || 0) + (t.pnl || 0));
	});
	const daily = Array.from(dailyMap.values());
	const avgDaily = daily.reduce((a, b) => a + b, 0) / daily.length;
	const totalProfit = daily.reduce((a, b) => a + b, 0);
	
	let consistencyScore = 0;
	if (avgDaily > 0 && totalProfit > 0) {
		const stdDev = Math.sqrt(daily.reduce((s, v) => s + Math.pow(v - avgDaily, 2), 0) / daily.length);
		const consistencyRatio = stdDev / Math.abs(totalProfit);
		consistencyScore = clamp(100 - (consistencyRatio * 100), 0, 100);
	}

	// TradeZella weights
	const weights = { 
		winRate: 15, 
		avgWinLoss: 20, 
		profitFactor: 25, 
		maxDrawdown: 20, 
		recoveryFactor: 10, 
		consistency: 10 
	};

	const score = (
		winRateScore * (weights.winRate / 100) +
		avgWinLossScore * (weights.avgWinLoss / 100) +
		profitFactorScore * (weights.profitFactor / 100) +
		maxDrawdownScore * (weights.maxDrawdown / 100) +
		recoveryFactorScore * (weights.recoveryFactor / 100) +
		consistencyScore * (weights.consistency / 100)
	);

	return {
		score: Math.round(score),
		breakdown: {
			winRate: Math.round(winRateScore),
			avgWinLoss: Math.round(avgWinLossScore),
			profitFactor: Math.round(profitFactorScore),
			maxDrawdown: Math.round(maxDrawdownScore),
			recoveryFactor: Math.round(recoveryFactorScore),
			consistency: Math.round(consistencyScore)
		}
	};
}



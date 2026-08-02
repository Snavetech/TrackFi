import { Transaction, Budget, FinancialPrediction, RiskLevel } from '../types';
import { subDays, format, parseISO, addDays, differenceInDays } from 'date-fns';

export interface ComputePredictionParams {
  userId: string;
  transactions: Transaction[];
  currentBalance: number;
  budgets?: Budget[];
  budgetId?: string | null;
  horizonDays?: number; // default 30
  currencySymbol?: string;
}

export function computeFinancialPrediction({
  userId,
  transactions,
  currentBalance,
  budgets = [],
  budgetId = null,
  horizonDays = 30,
  currencySymbol = '₦'
}: ComputePredictionParams): FinancialPrediction {
  const today = new Date();
  const trailingWindowDays = 30;
  const windowStartDate = subDays(today, trailingWindowDays);

  // Filter transactions within the trailing 30-day window
  const windowTransactions = transactions.filter(t => {
    const txDate = parseISO(t.date);
    return txDate >= windowStartDate && txDate <= today;
  });

  // Calculate totals in trailing window
  const totalIncomeInWindow = windowTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenseInWindow = windowTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Daily Averages
  const avgDailyIncome = totalIncomeInWindow / trailingWindowDays;
  const avgDailyExpense = totalExpenseInWindow / trailingWindowDays;
  
  // Burn Rate: Positive = losing money per day, Negative = saving money per day
  const avgDailyBurnRate = avgDailyExpense - avgDailyIncome;

  // Projected Balance after horizonDays
  const projectedBalance = currentBalance - (avgDailyBurnRate * horizonDays);

  // Estimated Exhaustion Date calculation
  let estimatedExhaustionDate: string | null = null;
  if (avgDailyBurnRate > 0 && currentBalance > 0) {
    const daysRemaining = currentBalance / avgDailyBurnRate;
    estimatedExhaustionDate = format(addDays(today, Math.round(daysRemaining)), 'yyyy-MM-dd');
  }

  // Budget specific exhaustion date if budgetId is supplied
  if (budgetId) {
    const targetBudget = budgets.find(b => b.id === budgetId);
    if (targetBudget) {
      const budgetCategoryTxs = windowTransactions.filter(
        t => t.type === 'expense' && (!targetBudget.category_id || t.category_id === targetBudget.category_id)
      );
      const budgetDailyExpense = budgetCategoryTxs.reduce((sum, t) => sum + t.amount, 0) / trailingWindowDays;
      
      if (budgetDailyExpense > 0) {
        const daysToExhaustBudget = targetBudget.amount / budgetDailyExpense;
        const budgetStartDate = parseISO(targetBudget.start_date);
        const calcExhaustion = addDays(budgetStartDate, Math.round(daysToExhaustBudget));
        const budgetEndDate = parseISO(targetBudget.end_date);
        
        // Cap at budget end date
        const finalExhaustion = calcExhaustion > budgetEndDate ? budgetEndDate : calcExhaustion;
        estimatedExhaustionDate = format(finalExhaustion, 'yyyy-MM-dd');
      }
    }
  }

  // Calculate Sustainability Score (0-100)
  let score = 100;

  if (avgDailyBurnRate > 0) {
    // Losing money
    if (currentBalance <= 0) {
      score = 0;
    } else {
      const daysUntilDepletion = currentBalance / avgDailyBurnRate;
      if (daysUntilDepletion < horizonDays) {
        // Depleted before horizon
        score = Math.max(0, Math.round((daysUntilDepletion / horizonDays) * 50));
      } else {
        // Depleted after horizon
        const burnRatio = avgDailyBurnRate / (avgDailyIncome + 1);
        score = Math.max(40, Math.round(100 - (burnRatio * 40)));
      }
    }
  } else {
    // Cash flow positive or net zero burn
    const savingsRateRatio = avgDailyExpense > 0 ? (avgDailyIncome - avgDailyExpense) / avgDailyExpense : 1;
    score = Math.min(100, Math.round(85 + Math.min(15, savingsRateRatio * 10)));
  }

  // Active budget overspend penalty
  const activeOverspends = budgets.filter(b => {
    const budgetSpent = transactions
      .filter(t => t.type === 'expense' && (!b.category_id || t.category_id === b.category_id))
      .reduce((sum, t) => sum + t.amount, 0);
    return budgetSpent > b.amount;
  }).length;

  if (activeOverspends > 0) {
    score = Math.max(0, score - (activeOverspends * 10));
  }

  // Determine Risk Level & Score Label
  let riskLevel: RiskLevel = 'low';
  let scoreLabel = 'Good';

  if (score >= 80) {
    riskLevel = 'low';
    scoreLabel = 'Excellent';
  } else if (score >= 70) {
    riskLevel = 'low';
    scoreLabel = 'Good';
  } else if (score >= 40) {
    riskLevel = 'moderate';
    scoreLabel = 'Fair';
  } else {
    riskLevel = 'high';
    scoreLabel = 'Critical';
  }

  // Days remaining calculation
  let daysRemaining: number | null = null;
  let formattedExhaustionDateStr: string | null = null;

  if (avgDailyBurnRate > 0 && currentBalance > 0) {
    daysRemaining = Math.round(currentBalance / avgDailyBurnRate);
    const exhaustionDateObj = addDays(today, daysRemaining);
    formattedExhaustionDateStr = format(exhaustionDateObj, 'dd MMM yyyy');
  }

  // Synthesize Detailed Report Insights & Recommendations
  const formattedBurn = `${currencySymbol}${Math.abs(avgDailyBurnRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedBalance = `${currencySymbol}${Math.abs(currentBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formattedProjected = `${currencySymbol}${Math.abs(projectedBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  let explanationText = '';
  let primaryInsight = '';
  const recommendations: string[] = [];

  if (avgDailyBurnRate > 0) {
    explanationText = `At your current spending pace, you are burning an average net ${formattedBurn} per day. Your current balance of ${formattedBalance} is projected to shrink to ${projectedBalance < 0 ? '-' : ''}${formattedProjected} over the next ${horizonDays} days.`;
    if (formattedExhaustionDateStr && daysRemaining) {
      explanationText += ` Estimated cash exhaustion date: ${formattedExhaustionDateStr} (${daysRemaining} days remaining).`;
    }

    primaryInsight = `Your spending currently exceeds your income, causing a gradual decline in your available balance by approximately ${formattedBurn} each day.`;

    const suggestedCut = Math.max(15, Math.ceil((avgDailyBurnRate / (avgDailyExpense || 1)) * 100));
    recommendations.push(
      `Reduce discretionary spending by at least ${suggestedCut}% or increase monthly income to achieve net-zero daily burn and extend your cash runway.`
    );

    if (activeOverspends > 0) {
      recommendations.push(
        `Resolve ${activeOverspends} active budget category overspend(s) to improve your sustainability index score and prevent rapid cash exhaustion.`
      );
    } else {
      recommendations.push(
        `Cap non-essential purchases in your highest spending categories over the next ${horizonDays} days to preserve liquid capital.`
      );
    }

    recommendations.push(
      `Maintain an emergency cash cushion covering at least 3 months of essential recurring expenses.`
    );
  } else {
    explanationText = `Your financial pattern is sustainable! You are accumulating net savings of approximately ${formattedBurn} per day. Over the next ${horizonDays} days, your balance is projected to grow from ${formattedBalance} to ${formattedProjected}. Risk level: ${riskLevel.toUpperCase()}.`;

    primaryInsight = `Your income comfortably exceeds your total expenses, generating a continuous net surplus of ${formattedBurn} per day.`;

    const monthlySurplus = Math.abs(avgDailyBurnRate) * 30;
    const formattedSurplus = `${currencySymbol}${monthlySurplus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    recommendations.push(
      `Direct your net monthly surplus (~${formattedSurplus}) toward high-priority savings goals or automated investment vaults.`
    );
    recommendations.push(
      `Periodically review subscription services and recurring bills to lock in your high savings rate.`
    );
  }

  return {
    id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id: userId,
    budget_id: budgetId,
    prediction_date: format(today, 'yyyy-MM-dd'),
    forecast_horizon_days: horizonDays,
    avg_daily_burn_rate: Number(avgDailyBurnRate.toFixed(2)),
    projected_balance: Number(projectedBalance.toFixed(2)),
    sustainability_score: score,
    score_label: scoreLabel,
    risk_level: riskLevel,
    estimated_exhaustion_date: formattedExhaustionDateStr || estimatedExhaustionDate,
    days_remaining: daysRemaining,
    explanation_text: explanationText,
    primary_insight: primaryInsight,
    recommendations: recommendations,
    created_at: new Date().toISOString(),
  };
}

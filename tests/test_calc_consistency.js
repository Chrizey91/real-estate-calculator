
import { calculateInvestmentMetrics, aggregateToCalendarYears } from '../src/data/transformations.js';

// Mock params and data
const params = {
    purchasePrice: 100000,
    additionalCosts: 10000,
    debtAmount: 90000,
    expectedRent: 500,
    monthlyPayment: 400,
    interestRate: 2,
    applyGermanTax: false,
    buildingValue: 80000,
    taxRate: 42,
    annualExpenses: 100,
    startMonth: 0, // Jan
    startYear: 2024,
    propertyWorth: 100000
};

// Start of Year Values (before simulation)
// Equity = Purchase (100k) - Debt (90k) = 10k.
// Cumulative Liquid = -(Purchase + Costs - Debt) = -(100k + 10k - 90k) = -20k.
const initialValues = {
    balance: params.debtAmount,
    cumulative: -(params.purchasePrice + params.additionalCosts - params.debtAmount),
    cumulativeIlliquid: params.purchasePrice - params.debtAmount,
    totalCumulative: -(params.purchasePrice + params.additionalCosts - params.debtAmount) + (params.purchasePrice - params.debtAmount)
};

console.log("Running Consistency Test (Beginning of Year)...");

// Mock amortization with 1 month
const mockAmortization = [{
    month: 1,
    payment: 100,
    interestPayment: 50,
    principalPayment: 50,
    balance: 89950,
    totalInterest: 50
}];

// Mock cash flow (simplified)
const mockCashFlowSchedule = [{
    month: 0, // Jan 2024
    cashFlow: 100,
    rentIncome: 500,
    mortgagePayment: 100,
    taxOnRent: 0,
    netCashFlow: 400,
    balance: 89950,
    cumulative: -19600, // Starts at -20k + 400
    cumulativeIlliquid: 10050, // Starts at 10k + 50 principal
    totalCumulative: -19600 + 10050
}];

const yearlyData = aggregateToCalendarYears(mockCashFlowSchedule, 0, 2024, initialValues);

// Check Year 2024 (First Year)
const y2024 = yearlyData.find(y => y.year === 2024);
console.log(`Year 2024 Balance Start (Expected 90000): ${y2024.balanceStart}`);
// Should be Initial Debt
if (y2024.balanceStart !== 90000) console.error("FAIL: Balance Start incorrect");

console.log(`Year 2024 Illiquid Start (Expected 10000): ${y2024.cumulativeIlliquidStart}`);
// Should be Initial Equity
if (y2024.cumulativeIlliquidStart !== 10000) console.error("FAIL: Illiquid Start incorrect");

// Check Year 2025 (Next Year - assumes aggregation creates it or we need more data?)
// aggregateToCalendarYears only creates years present in data.
// If we want to check 2025 start, we need a month in 2025.
// Let's assume we don't have it, but the logic for 2024 start is what matters most for "initial unexplainable equity".

if (y2024.balanceStart === 90000 && y2024.cumulativeIlliquidStart === 10000) {
    console.log("SUCCESS: Beginning of Year values match Initial State.");
} else {
    process.exit(1);
}

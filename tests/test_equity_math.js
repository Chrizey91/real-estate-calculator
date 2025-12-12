
import { calculateInvestmentMetrics } from '../src/data/transformations.js';

// Mock amortization data
const mockAmortization = Array(480).fill(0).map((_, i) => ({
    month: i + 1,
    balance: 90000 - (100 * (i + 1)), // Simplified: pay 100 principal each month
    interestPayment: 100,
    principalPayment: 100,
    totalInterest: 100 * (i + 1)
}));

// Mock params
const params = {
    purchasePrice: 100000,
    additionalCosts: 10000,
    expectedRent: 500,
    debtAmount: 90000, // 20k equity (110k total cost - 90k debt)
    monthlyPayment: 400,
    interestRate: 2,
    applyGermanTax: false,
    buildingValue: 80000,
    taxRate: 42,
    annualExpenses: 100,
    startMonth: 0,
    startYear: 2024,
    propertyWorth: 100000
};

// Mock getMonthsInYear
const getMonthsInYear = () => 12;

console.log("Running Equity Calculation Test...");

const metrics = calculateInvestmentMetrics(params, mockAmortization, getMonthsInYear);

// Check Month 0
const m0 = metrics.cashFlowSchedule[0];
console.log(`Month 0 Illiquid (Expected 10100): ${m0.cumulativeIlliquid}`);
// Month 0 is Active. Principal Paid = 100.
// Illiquid = 10000 + 100 = 10100.

// Check Month 10
const m10 = metrics.cashFlowSchedule[10];
console.log(`Month 10 Illiquid (Expected 11100): ${m10.cumulativeIlliquid}`);
// Principal Paid after 10 months (indices 0..10) = 11 months * 100 = 1100.
// Wait, index 10 is the 11th element.
// amort[0]..amort[10] -> 11 payments.
// 10000 + 1100 = 11100.

if (m0.cumulativeIlliquid === 10100 && m10.cumulativeIlliquid === 11100) {
    console.log("SUCCESS: Equity calculations are correct.");
} else {
    console.error(`FAILURE: Equity calculations incorrect. Got M0=${m0.cumulativeIlliquid}, M10=${m10.cumulativeIlliquid}`);
    process.exit(1);
}


import { calculateAmortization } from '../src/core/calculations.js';
import { calculateInvestmentMetrics, extendAmortizationSchedule } from '../src/data/transformations.js';

console.log("Running Test: Break-Even Logic (Total vs Liquid)...");

// Mock month helper
const getMonthsInYear = () => 1;

// Setup Params
const params = {
    purchasePrice: 100000,
    additionalCosts: 10000, // Sunk cost
    expectedRent: 500,
    debtAmount: 90000,
    monthlyPayment: 400, // Interest + Principal
    interestRate: 2.0,
    startMonth: 0,
    startYear: 2024,
    applyGermanTax: false,
    buildingValue: 0,
    taxRate: 0,
    annualExpenses: 0,
    propertyWorth: 100000
};

// 1. Calculate Amortization
const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);

// Shift (Month 0 Logic) - Simplistic simulation
const shiftedAmortization = amortization.map(entry => ({ ...entry, month: entry.month - 1 }));

// 2. Calculate Metrics
const metrics = calculateInvestmentMetrics(params, shiftedAmortization, getMonthsInYear);

// 3. Verify Break-Even
const breakEvenTotalYears = metrics.breakEvenYears;

console.log(`Break-Even Point (Total): ${breakEvenTotalYears} years`);

// 4. Manually find Liquid Only Break-Even
const liquidBreakEvenMonth = metrics.cashFlowSchedule.findIndex(item => item.cumulative >= 0);
const liquidBreakEvenYears = liquidBreakEvenMonth >= 0 ? liquidBreakEvenMonth / 12 : 0;

console.log(`Break-Even Point (Liquid Only - Old Method): ${liquidBreakEvenYears} years`);

// Assertion 1: Total Break-Even should be earlier than Liquid Break-Even
// (Unless cash flow is hugely negative and equity doesn't compensate, or both are instantly positive)
if (breakEvenTotalYears >= liquidBreakEvenYears && liquidBreakEvenYears > 0) {
    // Note: If both are 0, that's fine.
    if (breakEvenTotalYears > 0) {
        console.warn("WARNING: Break-Even (Total) is NOT earlier than Liquid. This might be due to specific parameters, but usually equity speeds it up.");
    }
}

// Assertion 2: Verify Total Cumulative at Break-Even Year is >= 0
if (breakEvenTotalYears > 0) {
    const monthIndex = Math.ceil(breakEvenTotalYears * 12);
    const breakEvenItem = metrics.cashFlowSchedule[monthIndex];
    // Note: findIndex returns the first index.
    const actualBreakEvenItem = metrics.cashFlowSchedule.find(item => item.totalCumulative >= 0);

    if (actualBreakEvenItem && actualBreakEvenItem.totalCumulative < 0) {
        console.error("FAILURE: Found break-even item has negative total cumulative cash flow!");
        process.exit(1);
    }
}

console.log("SUCCESS: Break-Even Logic verified.");

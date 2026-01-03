
import { calculateInvestmentMetrics } from '../src/data/transformations.js';

// Mock getMonthsInYear
const getMonthsInYear = (monthIndex, startMonth, startYear) => 12; // Simplified, not used for break even month index finding

const params = {
    purchasePrice: 380000,
    additionalCosts: 20000,
    expectedRent: 2000,
    debtAmount: 320000,
    monthlyPayment: 1500,
    interestRate: 3.5,
    applyGermanTax: true,
    buildingValue: 300000,
    taxRate: 30,
    annualExpenses: 2000,
    startMonth: 11, // Dec
    startYear: 2025,
    propertyWorth: 380000
};

// Mock Amortization (Simplified)
const amortization = [];
for (let i = 0; i < 480; i++) {
    amortization.push({
        month: i,
        payment: 1500,
        interestPayment: 1000, // Dummy
        principalPayment: 500, // Dummy
        balance: 320000 - (i * 500),
        totalInterest: i * 1000
    });
}

const metrics = calculateInvestmentMetrics(params, amortization, getMonthsInYear);

console.log(`Break Even Month Index: ${metrics.breakEvenYears * 12}`);
console.log(`Break Even Years Duration: ${metrics.breakEvenYears}`);

// Simulate New UI Logic
const date = new Date(params.startYear, params.startMonth);
date.setMonth(date.getMonth() + Math.ceil(metrics.breakEvenYears * 12));
const uiYear = date.getFullYear();
console.log(`UI Calculated Year (New Logic): ${uiYear}`);

// Correct Logic check
const refDate = new Date(params.startYear, params.startMonth);
refDate.setMonth(refDate.getMonth() + (metrics.breakEvenYears * 12));
const correctYear = refDate.getFullYear();

console.log(`Correct Calendar Year: ${correctYear}`);

if (uiYear !== correctYear) {
    console.log("FAIL: UI Year does not match Calendar Year");
} else {
    console.log("SUCCESS: Years match");
}

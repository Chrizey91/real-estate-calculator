
import { aggregateToCalendarYears } from '../src/data/transformations.js';

// Mock Data
// Start Jan 2024.
// Initial Debt 90k. Down Payment 10k.
const initialValues = {
    balance: 90000,
    cumulativeIlliquid: 10000 // Equity
};

// Amortization (Start Month 0 inserted by fix logic in main.js, here we test aggregation with it)
const mockData = [
    { month: 0, balance: 90000, cumulativeIlliquid: 10000 }, // Start state
    { month: 1, balance: 89900, cumulativeIlliquid: 10100 }  // End of Month 1
];

console.log("Running Regression Test: Equity Start Consistency...");

const agg = aggregateToCalendarYears(mockData, 0, 2024, initialValues);
const year2024 = agg[0];

console.log(`Year 2024 Balance Start: ${year2024.balanceStart} (Expected 90000)`);
console.log(`Year 2024 Illiquid Start: ${year2024.cumulativeIlliquidStart} (Expected 10000)`);

if (year2024.balanceStart === 90000 && year2024.cumulativeIlliquidStart === 10000) {
    console.log("SUCCESS: Beginning of Year values match Initial State.");
} else {
    console.error("FAILURE: Beginning of Year values incorrect.");
    process.exit(1);
}

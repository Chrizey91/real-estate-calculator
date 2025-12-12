
import { aggregateToCalendarYears } from '../src/data/transformations.js';

console.log("Running Debt Graph Start Month Reproduction...");

// Case 1: Start Jan 2024
// Month 1 = Feb 2024. Year is 2024. Chart should show 2024.
const am1 = [{ month: 1, balance: 90000, interestPayment: 100, principalPayment: 100 }];
const agg1 = aggregateToCalendarYears(am1, 0, 2024, {}); // Jan 2024
console.log("Case 1 (Start Jan 2024): First Year =", agg1[0].year);

// Case 2: Start Dec 2024
// Month 1 = Jan 2025. Year is 2025.
// Chart skips 2024 entirely?
// User expects to see 2024 (Purchase date).
const am2 = [{ month: 1, balance: 90000, interestPayment: 100, principalPayment: 100 }];
const agg2 = aggregateToCalendarYears(am2, 11, 2024, {}); // Dec 2024
console.log("Case 2 (Start Dec 2024): First Year =", agg2[0] ? agg2[0].year : "None");
// Expected: 2025 (Problem implies this is bad, user wants 2024).

// Proposed Fix Validation: Add Month 0
const amFix = [
    { month: 0, balance: 100000, interestPayment: 0, principalPayment: 0 },
    { month: 1, balance: 90000, interestPayment: 100, principalPayment: 100 }
];
const aggFix = aggregateToCalendarYears(amFix, 11, 2024, {}); // Dec 2024
console.log("Case 2 Fix (With Month 0): First Year =", aggFix[0].year);
// Expected: 2024.

if (agg1[0].year === 2024 && agg2[0].year === 2025 && aggFix[0].year === 2024) {
    console.log("SUCCESS: Reproduction confirmed. Adding Month 0 fixes the missing start year.");
} else {
    console.error("FAILURE: Reproduction logic assumptions wrong.");
}


import { extendAmortizationSchedule, aggregateToCalendarYears } from '../src/data/transformations.js';

console.log("Running Reproduction: Gap & Aggregation logic...");

// 1. Reproduce Gap in Extension
// Mock: Month 0, 1, 2. Length 3. Last Month 2.
// Robust logic should produce Month 3 next.
// Current Buggy Logic (len + 1): Starts at 4. Skips 3.
const mockAmortization = [
    { month: 0, balance: 100 },
    { month: 1, balance: 90 },
    { month: 2, balance: 80 }
];

const extended = extendAmortizationSchedule(mockAmortization, 5);
const months = extended.map(m => m.month);
console.log("Extended Months:", months.join(', '));

const hasGap = !months.includes(3);
if (hasGap) {
    console.error("FAILURE: Gap detected! Month 3 missing.");
} else {
    console.log("SUCCESS: Continuation is continuous.");
}

// 2. Reproduce Aggregation Index Bug
// If we have a gap or just testing index reliance.
// Data: [M0, M1]. Missing M2? No let's just test sequentiality.
// Logic `monthlyData[monthData.month - 1]` implies strict index=month mapping.
// If we pass a filtered list or gap list, it fails.
// Let's pass a list with a gap: [M0, M2]. (Simulating the gap bug).
// Aggregation for M2 should use M0 (last avail) or handle gracefully.
// Current logic: M2 looks at index 1. Index 1 is M2.
// So M2.start = M2.balance.
// Expected: M2.start = M0.balance (since M1 missing, carry forward?). Or fail loudly?
// Ideally aggregation tracks "last seen state".
const gapData = [
    { month: 0, balance: 100, cumulative: 50 },
    { month: 2, balance: 80, cumulative: 70 } // index 1. month 2.
];
const agg = aggregateToCalendarYears(gapData, 0, 2024, { balance: 100, cumulative: 50 });
// Year 2024.
// Process M0. Start=100. End=100.
// Process M2. Start=?
// If logic uses [2-1] = [1]. array[1] is M2.
// Start = M2.balance = 80.
// Delta for M2: Start 80 -> End 80. Flow? 
// Correct Start should be 100 (from M0).
// M2 should show change from 100 -> 80.

// Check derived "Start" for M2 (which might be logged if we could see inside, or check chart data output).
// If `aggregateToCalendarYears` returns `balanceStart` for the year.
// If M0 and M2 are in same year (2024).
// Year Start = M0 Start = 100.
// This example doesn't reveal year-start bug unless M2 is first month of new year.
// Let's Put M2 in 2025.
// M0 (Jan 24). M12 (Jan 25).
// Gap: M1..M11 missing.
// M12 is first of 2025.
// Logic: `if (monthData.month === 0) ... else { prev = monthlyData[12-1] = index 11 }`.
// Index 11 is undefined!
// Returns 0.
// So Year 2 Start Balance = 0.
// This explains "Zero debt paid off" (or Zero Balance Start).
// If Balance Start = 0. And End Balance = 80.
// It looks like debt INCREASED or weirdness.

const gapData2 = [
    { month: 0, balance: 100, cumulative: 0 },
    // M1..M11 missing
    { month: 12, balance: 80, cumulative: 0 } // Jan 2025. Index 1.
];

const agg2 = aggregateToCalendarYears(gapData2, 0, 2024, { balance: 100 });
const year2 = agg2.find(y => y.year === 2025);
if (year2) {
    console.log(`Year 2 Start Balance: ${year2.balanceStart}`);
    if (year2.balanceStart === 0 || year2.balanceStart === undefined) {
        console.error("FAILURE: Year 2 Start Balance lost due to gap/indexing.");
    } else if (year2.balanceStart === 100) {
        console.log("SUCCESS: Year 2 correctly picked up previous balance despite gap.");
    } else {
        console.log(`WARN: Got ${year2.balanceStart}, expected 100.`);
    }
}

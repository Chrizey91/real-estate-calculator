
import { extendAmortizationSchedule, calculateTaxSavingsByYear } from '../src/data/transformations.js';

console.log("Running Reproduction: Duplicate Month & Tax Year Spike...");

// Mock Amortization: 2 months. Month 1, Month 2.
// Payoff happens at Month 2.
const mock = [
    { month: 1, balance: 50, interestPayment: 10, totalInterest: 10 },
    { month: 2, balance: 0, interestPayment: 5, totalInterest: 15 } // Payoff
];

// 1. Test Duplicate Month
const extended = extendAmortizationSchedule(mock, 5);
// Expect: 1, 2, 3, 4, 5.
// If bug: 1, 2, 2, 3, 4, 5 (or similar)

console.log("Extended Schedule Months:", extended.map(m => m.month).join(', '));

const hasDuplicate = new Set(extended.map(m => m.month)).size !== extended.length;
if (hasDuplicate) {
    console.error("FAILURE: Duplicate months detected in extended schedule!");
} else {
    console.log("SUCCESS: No duplicate months.");
}

// 2. Test Tax Savings Spike (Result of duplication)
// If duplicate month 2 exists, aggregation for that year will sum income twice for that month.
// Start Year 2024. Start Month 0 (Jan).
// Year 2024 should have 12 months.
const taxSchedule = calculateTaxSavingsByYear(extended, 100000, 0, 42, 0, 2024, 1000);
const year2024 = taxSchedule.find(m => m.month === 0); // Just check any month or the count

// Check logic internal to tax Calc: it sums months.
// We can't easily check internal sum from output schedule (it returns monthly entries).
// But we can check if we have more than 12 entries for 2024?
// calculateTaxSavingsByYear returns ONE entry per month.
// If 2024 has 13 months logic, it might push 13 entries?
// Or if it groups by year, it calculates `actualAnnualRent = monthlyRent * monthsInYear`.
// If monthsInYear is 13, Annual Rent is 13000.
// Year 2024 months should all have the SAME `annualRentalIncome`.

if (year2024) {
    console.log(`Annual Rental Income in Schedule: ${year2024.annualRentalIncome}`);
    if (year2024.annualRentalIncome > 12000) {
        console.error("FAILURE: Annual Rental Income Spiked (Likely > 12 months counted).");
    } else {
        console.log("SUCCESS: Annual Rental Income is normal.");
    }
}

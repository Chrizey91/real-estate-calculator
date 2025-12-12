
import { calculateInvestmentMetrics } from '../src/data/transformations.js';

console.log("Running Regression: Month 0 is Active Month (Not Snapshot)...");

// Mock params
const params = {
    purchasePrice: 100000,
    additionalCosts: 10000,
    expectedRent: 1000,
    debtAmount: 90000,
    monthlyPayment: 500,
    interestRate: 2,
    applyGermanTax: false,
    buildingValue: 80000,
    taxRate: 42,
    annualExpenses: 0,
    startMonth: 0,
    startYear: 2024,
    propertyWorth: 100000
};

// Mock Amortization (0-based indexing assumed for this architecture shift)
// If we shift amortization to be 0-based, then amortization[0].month = 0.
const mockAmortization = [
    { month: 0, balance: 89600, interestPayment: 150, principalPayment: 350, payment: 500, totalInterest: 150 }
];

const getMonthsInYear = () => 12;

// The test will fail initially because calculateInvestmentMetrics forces M0 flows to 0.
// And it expects amort[month-1].
// We want it to use amort[month].

try {
    const metrics = calculateInvestmentMetrics(params, mockAmortization, getMonthsInYear);
    const m0 = metrics.monthlyCashFlowSchedule[0];

    console.log(`Month 0 Cash Flow: ${m0.cashFlow}`);
    console.log(`Month 0 Rent: ${m0.rentIncome}`);
    console.log(`Month 0 Mortgage: ${m0.mortgagePayment}`);

    if (m0.rentIncome === 1000 && m0.mortgagePayment === 500) {
        console.log("SUCCESS: Month 0 has active flows.");
    } else {
        console.error(`FAILURE: Month 0 flows are zeroed out or missing. Rent=${m0.rentIncome}, Mortgage=${m0.mortgagePayment}`);
        process.exit(1);
    }
} catch (e) {
    console.error("FAILURE: Error during calculation", e);
    process.exit(1);

}

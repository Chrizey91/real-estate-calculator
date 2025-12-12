
import { calculateInvestmentMetrics } from '../src/data/transformations.js';

// Mock amortization with a partial final payment
// loan 500. payment 300.
// Month 1: Interest 50. Principal 250. Balance 250.
// Month 2: Interest 25. Principal 250. Balance 0. Payment 275 (Partial).
const mockAmortization = [
    {
        month: 1,
        payment: 300,
        interestPayment: 50,
        principalPayment: 250,
        balance: 250,
        totalInterest: 50
    },
    {
        month: 2,
        payment: 275, // Partial payment (250 principal + 25 interest)
        interestPayment: 25,
        principalPayment: 250,
        balance: 0,
        totalInterest: 75
    }
];

// Params
const params = {
    purchasePrice: 1000,
    additionalCosts: 0,
    expectedRent: 0,
    debtAmount: 500,
    monthlyPayment: 300, // Configured payment
    interestRate: 10,
    applyGermanTax: false,
    buildingValue: 0,
    taxRate: 0,
    annualExpenses: 0,
    startMonth: 0,
    startYear: 2024,
    propertyWorth: 1000
};

const getMonthsInYear = () => 1; // Simplify

console.log("Running Regression Test: Payoff Year Correctness...");

const metrics = calculateInvestmentMetrics(params, mockAmortization, getMonthsInYear);

// Check Month 2 Cash Flow
// In fixed logic: Month 2 looks up amortization[1] (which is Month 2 in mock).
const m2 = metrics.monthlyCashFlowSchedule.find(m => m.month === 2);

if (!m2) {
    console.error("FAILURE: Month 2 not found in schedule.");
    process.exit(1);
}

console.log(`Month 2 Payment Used: ${m2.mortgagePayment} (Expected 275)`);

if (m2.mortgagePayment === 275) {
    console.log("SUCCESS: Calculator uses actual partial payment for payoff month.");
} else {
    console.error(`FAILURE: Calculator used wrong payment. Got ${m2.mortgagePayment}, expected 275.`);
    process.exit(1);
}

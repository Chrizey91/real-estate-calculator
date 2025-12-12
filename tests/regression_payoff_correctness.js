
import { calculateInvestmentMetrics } from '../src/data/transformations.js';

// Mock amortization with a partial final payment
// loan 500. payment 300.
// Month 0: Interest 50. Principal 250.
// Month 1: Interest 25. Principal 250. Payment 275.
const mockAmortization = [
    {
        month: 0,
        payment: 300,
        interestPayment: 50,
        principalPayment: 250,
        balance: 250,
        totalInterest: 50
    },
    {
        month: 1,
        payment: 275, // Partial payment (250 principal + 25 interest)
        interestPayment: 25,
        principalPayment: 250,
        balance: 0,
        totalInterest: 75
    }
];

// Params
const params = {
    // ... same
    debtAmount: 500,
    startMonth: 0,
    // ...
};

const getMonthsInYear = () => 1;

console.log("Running Regression Test: Payoff Year Correctness...");

const metrics = calculateInvestmentMetrics(params, mockAmortization, getMonthsInYear);

// Check Month 1 Cash Flow (Last month of mortgage)
const mPayoff = metrics.monthlyCashFlowSchedule.find(m => m.month === 1);

if (!mPayoff) {
    console.error("FAILURE: Payoff Month (1) not found in schedule.");
    process.exit(1);
}

console.log(`Month 1 Payment Used: ${mPayoff.mortgagePayment} (Expected 275)`);

if (mPayoff.mortgagePayment === 275) {
    console.log("SUCCESS: Calculator uses actual partial payment for payoff month.");
} else {
    console.error(`FAILURE: Calculator used wrong payment. Got ${mPayoff.mortgagePayment}, expected 275.`);
    process.exit(1);
}


import { calculateAmortization } from '../src/core/calculations.js';
import { extendAmortizationSchedule, aggregateToCalendarYears } from '../src/data/transformations.js';

console.log("Debugging Chart Values Aggregation...");

// 1. Params
const params = {
    debtAmount: 320000,
    monthlyPayment: 1566, // Approx for 320k, 3.5%, 120m? No, generic.
    interestRate: 3.5,
    startMonth: 11, // Dec
    startYear: 2025,
    purchasePrice: 400000,
    additionalCosts: 20000
};

// 2. Calculate Amortization
const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);
console.log(`Amortization Length: ${amortization.length}`);
console.log(`Month 1 Interest Paid: ${amortization[0].interestPayment}`);
console.log(`Month 1 Total Interest: ${amortization[0].totalInterest}`); // Check raw data

// 3. Shift (Month 0 Logic)
const shiftedAmortization = amortization.map(entry => ({
    ...entry,
    month: entry.month - 1
}));
console.log(`Shifted Month 0 Total Interest: ${shiftedAmortization[0].totalInterest}`);

// 4. Extend
const extendedAmortization = extendAmortizationSchedule(shiftedAmortization, 480);
console.log(`Extended Length: ${extendedAmortization.length}`);

// 5. Aggregate
const initialValues = {
    balance: params.debtAmount,
    cumulative: 0,
    cumulativeIlliquid: 0,
    totalCumulative: 0
};

const aggregated = aggregateToCalendarYears(extendedAmortization, params.startMonth, params.startYear, initialValues);

// Simulate Chart Dataset Mapping (BoY Logic)
try {
    const initialDebt = params.debtAmount;

    // Dataset 1 (Remaining Debt) -> d.balanceStart
    const d1 = aggregated.map(d => d.balanceStart);
    // Dataset 2 (Interest) -> Previous year's end interest
    const d2 = aggregated.map((d, i) => i === 0 ? 0 : aggregated[i - 1].totalInterest);
    // Dataset 3 (Principal) -> initialDebt - d.balanceStart
    const d3 = aggregated.map(d => {
        return initialDebt - d.balanceStart;
    });

    console.log("Dataset Mapping Success (BoY Logic)");
    console.log(`D3 Sample (Principal Paid BoY): ${d3.slice(0, 3)}`);
} catch (e) {
    console.error("Dataset Mapping Failed:", e);
    process.exit(1);
}

// 6. Inspect Years
const year1 = aggregated.find(y => y.year === 2025);
const year2 = aggregated.find(y => y.year === 2026);

console.log("\n--- Year 1 (2025) ---");
if (year1) {
    console.log(`Balance (End): ${year1.balance}`);
    console.log(`Balance (Start): ${year1.balanceStart}`);
    console.log(`Total Interest (End): ${year1.totalInterest}`);
    console.log(`Months Included: ${year1.months.length}`);
} else {
    console.log("MISSING");
}

console.log("\n--- Year 2 (2026) ---");
if (year2) {
    console.log(`Balance (End): ${year2.balance}`);
    console.log(`Balance (Start): ${year2.balanceStart}`);
    console.log(`Total Interest (End): ${year2.totalInterest}`);
    console.log(`Months Included: ${year2.months.length}`);
} else {
    console.log("MISSING");
}

if (year2 && year2.totalInterest === 0) {
    console.error("FAILURE: Year 2 Total Interest is 0!");
    process.exit(1);
} else {
    console.log("SUCCESS: Year 2 has interest.");
}

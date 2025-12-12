
import { calculateAmortization } from '../src/core/calculations.js';
import { extendAmortizationSchedule, aggregateToCalendarYears } from '../src/data/transformations.js';

console.log("Running Regression Test: Debt Graph BoY Logic...");

// 1. Params for Dec 2025 Start
const params = {
    debtAmount: 320000,
    monthlyPayment: 1566,
    interestRate: 3.5,
    startMonth: 11, // Dec
    startYear: 2025,
    purchasePrice: 400000,
    additionalCosts: 20000
};

// 2. Calculate Amortization
const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);

// 3. Shift (Month 0 Logic)
const shiftedAmortization = amortization.map(entry => ({
    ...entry,
    month: entry.month - 1
}));

// 4. Extend
const extendedAmortization = extendAmortizationSchedule(shiftedAmortization, 480);

// 5. Aggregate
const initialValues = {
    balance: params.debtAmount,
    cumulative: 0,
    cumulativeIlliquid: 0,
    totalCumulative: 0
};

const aggregated = aggregateToCalendarYears(extendedAmortization, params.startMonth, params.startYear, initialValues);

// 6. Simulate Debt Graph BoY Data
// Year 1 (2025) should show Start State (No repayment because Jan 1 state = Initial)
// Actually, BoY logic: Date Point 0 = Initial.
// Data Point 1 = Start of Year 2.

// Principal Paid Dataset Logic: initialDebt - d.balanceStart
const principalPaidData = aggregated.map(d => params.debtAmount - d.balanceStart);
const remainingDebtData = aggregated.map(d => d.balanceStart);

console.log(`Year 1 Principal Paid: ${principalPaidData[0]}`);
console.log(`Year 2 Principal Paid: ${principalPaidData[1]}`);

// Assertions
if (principalPaidData[0] !== 0) {
    console.error(`FAILURE: Year 1 Principal Paid should be 0 (Start of Year), but got ${principalPaidData[0]}`);
    process.exit(1);
}

if (principalPaidData[1] <= 0) {
    console.error(`FAILURE: Year 2 Principal Paid must be > 0 (reflecting Month 0 payment), but got ${principalPaidData[1]}`);
    process.exit(1);
}

console.log("SUCCESS: Debt Graph BoY logic verified.");

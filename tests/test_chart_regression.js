
import { aggregateToCalendarYears } from '../src/data/transformations.js';

// Mock cash flow schedule
// Create 2 years of data
const mockSchedule = [];
for (let i = 0; i < 24; i++) {
    mockSchedule.push({
        month: i,
        year: i < 12 ? 2024 : 2025,
        rentIncome: 1000,
        mortgagePayment: 500,
        taxOnRent: 100,
        taxReimbursement: 0,
        netCashFlow: 400,
        // Values required for logic but not aggregation summing if raw months are used properly
        // aggregateToCalendarYears logic sums up raw values if present
    });
}

// Params
const startMonth = 0;
const startYear = 2024;
const initialValues = {};

console.log("Running Regression Test: Chart Data Completeness...");

const aggregated = aggregateToCalendarYears(mockSchedule, startMonth, startYear, initialValues);

// Check if all required "annual" fields are present and non-zero (since we put data in)
const firstYear = aggregated[0];

const requiredFields = [
    'annualRentIncome',
    'annualMortgagePayment',
    'annualTaxOnRent',
    'annualTaxReimbursement',
    'annualNetCashFlow'
];

let failed = false;
requiredFields.forEach(field => {
    if (firstYear[field] === undefined) {
        console.error(`FAIL: Missing field ${field} in aggregated data.`);
        failed = true;
    } else if (firstYear[field] === 0 && field !== 'annualTaxReimbursement') {
        // TaxReimbursement is 0 in mock, so skip check for it being non-zero
        // But Rent/Mortgage/TaxOnRent should be > 0
        console.error(`FAIL: Field ${field} is 0, expected positive sum.`);
        failed = true;
    }
});

// Calculate expected values
// 12 months * 1000 = 12000
if (firstYear.annualRentIncome !== 12000) {
    console.error(`FAIL: annualRentIncome calculation wrong. Got ${firstYear.annualRentIncome}, expected 12000`);
    failed = true;
}

if (!failed) {
    console.log("SUCCESS: Aggregated data contains all required fields for charts.");
} else {
    process.exit(1);
}

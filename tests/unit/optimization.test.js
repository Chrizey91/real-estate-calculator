/**
 * Optimization Logic Test Suite
 */

import { calculateOptimalScenario } from '../../src/core/optimization.js';

// ANSI color codes
const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function assertApproximatelyEqual(actual, expected, description, tolerance = 0.05) {
    testsRun++;
    const diff = Math.abs(actual - expected);
    if (diff <= tolerance) {
        testsPassed++;
        console.log(`${COLORS.green}✅ PASS${COLORS.reset}: ${description}`);
    } else {
        testsFailed++;
        console.log(`${COLORS.red}❌ FAIL${COLORS.reset}: ${description}`);
        console.log(`   Expected: ${expected}, Got: ${actual}, Diff: ${diff}`);
    }
}

console.log(`\n${COLORS.blue}🧪 Optimization Logic Tests${COLORS.reset}`);
console.log(`${COLORS.blue}${'='.repeat(60)}${COLORS.reset}\n`);

// Test 1: Optimal Payment Calculation (No Tax)
{
    // Debt: 100k, Interest: 3%, Repayment: 2%
    // Interest = 100k * 3% / 12 = 250
    // Repayment = 100k * 2% / 12 = 166.67
    // Total = 416.67
    const result = calculateOptimalScenario(100000, 3, 0, 0, 0, false);
    assertApproximatelyEqual(result.monthlyPayment, 416.67, 'Optimal payment should be Interest + 2% Repayment');
    assertApproximatelyEqual(result.minRent, 416.67, 'Min rent without tax should equal payment');
}

// Test 2: Break-Even Rent with Tax Savings
{
    // Debt: 300k, Interest: 4%
    // Building: 200k (AfA = 4k/yr = 333.33/mo)
    // Expenses: 1200/yr = 100/mo
    // Tax Rate: 40%

    // 1. Payment
    // Interest = 300k * 4% / 12 = 1000
    // Repayment = 300k * 2% / 12 = 500
    // Payment = 1500

    // 2. Deductibles
    // Interest (1000) + AfA (333.33) + Expenses (100) = 1433.33

    // 3. Rent Formula
    // Rent = (Payment - Deductibles*TaxRate) / (1 - TaxRate)
    // Rent = (1500 - 1433.33 * 0.4) / (1 - 0.4)
    // Rent = (1500 - 573.33) / 0.6
    // Rent = 926.67 / 0.6
    // Rent = 1544.45

    const result = calculateOptimalScenario(300000, 4, 200000, 1200, 40, true);
    assertApproximatelyEqual(result.monthlyPayment, 1500, 'Optimal payment check');
    assertApproximatelyEqual(result.minRent, 1544.45, 'Min rent with tax check');

    // Verification:
    // Rent = 1544.45
    // Deductibles = 1433.33
    // Profit = 111.12
    // Tax = 111.12 * 0.4 = 44.45
    // CashFlow = Rent (1544.45) - Payment (1500) - Tax (44.45) = 0.00
}

// Test 3: Break-Even Rent with High Deductibles (Tax Savings)
{
    // Debt: 300k, Interest: 4% (1000/mo)
    // Building: 600k (AfA = 12k/yr = 1000/mo) -> Huge depreciation
    // Expenses: 0
    // Tax Rate: 40%

    // Payment = 1500 (same as above)
    // Deductibles = 1000 (Int) + 1000 (AfA) = 2000

    // Rent = (1500 - 2000 * 0.4) / 0.6
    // Rent = (1500 - 800) / 0.6
    // Rent = 700 / 0.6
    // Rent = 1166.67

    const result = calculateOptimalScenario(300000, 4, 600000, 0, 40, true);
    assertApproximatelyEqual(result.minRent, 1166.67, 'Min rent with high deductibles');

    // Verification:
    // Rent = 1166.67
    // Deductibles = 2000
    // Loss = 1166.67 - 2000 = -833.33
    // Tax Savings = 833.33 * 0.4 = 333.33
    // CashFlow = Rent (1166.67) - Payment (1500) + Savings (333.33) = 0.00
}

// Test 4: Target Cash Flow (Positive)
{
    // Same as Test 2 but want 100€ Cash Flow
    // Debt: 300k, Interest: 4%, Repayment: 2% -> Payment: 1500
    // Deductibles: 1433.33
    // Tax Rate: 40%
    // Target: 100

    // Rent = (Payment + Target - Deductibles*TaxRate) / (1 - TaxRate)
    // Rent = (1500 + 100 - 573.33) / 0.6
    // Rent = (1026.67) / 0.6
    // Rent = 1711.12

    const result = calculateOptimalScenario(300000, 4, 200000, 1200, 40, true, 100, 2.0);
    assertApproximatelyEqual(result.minRent, 1711.12, 'Rent for 100€ cash flow');
}

// Test 5: Custom Repayment Rate
{
    // Debt: 100k, Interest: 3%
    // Repayment: 3% (instead of 2%)
    // Interest = 250
    // Repayment = 100k * 3% / 12 = 250
    // Payment = 500
    // No Tax
    // Target: 0

    const result = calculateOptimalScenario(100000, 3, 0, 0, 0, false, 0, 3.0);
    assertApproximatelyEqual(result.monthlyPayment, 500, 'Payment with 3% repayment');
    assertApproximatelyEqual(result.minRent, 500, 'Rent matches payment (no tax)');
}

console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
console.log(`Total Tests: ${testsRun}`);
console.log(`${COLORS.green}Passed:      ${testsPassed}${COLORS.reset}`);
console.log(`${COLORS.red}Failed:      ${testsFailed}${COLORS.reset}`);

if (testsFailed > 0) process.exit(1);

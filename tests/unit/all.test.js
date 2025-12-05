/**
 * Investment Calculator Test Suite
 * 
 * This test suite validates all financial calculations in the investment calculator.
 * Run with: node investment-calculator/tests.js
 * 
 * @requires calculator.js - The functions being tested
 */

import {
    calculateAmortization,
    calculateGermanTaxSavings,
    getMonthsInYear
} from '../../src/core/calculations.js';



import {
    aggregateToCalendarYears,
    extendAmortizationSchedule,
    calculateInvestmentMetrics
} from '../../src/data/transformations.js';

// ANSI color codes for terminal output
const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

// Test tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const failedTests = [];

/**
 * Assert that two numbers are approximately equal within a tolerance
 * @param {number} actual - The actual value from the calculation
 * @param {number} expected - The expected value
 * @param {string} testDescription - Clear description of what is being tested
 * @param {number} tolerance - Acceptable difference (default 0.01)
 */
function assertApproximatelyEqual(actual, expected, testDescription, tolerance = 0.01) {
    testsRun++;
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;

    if (passed) {
        testsPassed++;
        console.log(`${COLORS.green}✅ PASS${COLORS.reset}: ${testDescription}`);
    } else {
        testsFailed++;
        failedTests.push(testDescription);
        console.log(`${COLORS.red}❌ FAIL${COLORS.reset}: ${testDescription}`);
        console.log(`   Expected: €${expected.toFixed(2)}, Got: €${actual.toFixed(2)}, Diff: €${diff.toFixed(2)}`);
    }
}

/**
 * Assert that an array has the expected length
 * @param {Array} array - The array to check
 * @param {number} expectedLength - Expected length
 * @param {string} testDescription - Clear description of what is being tested
 */
function assertArrayLength(array, expectedLength, testDescription) {
    testsRun++;
    const passed = array.length === expectedLength;

    if (passed) {
        testsPassed++;
        console.log(`${COLORS.green}✅ PASS${COLORS.reset}: ${testDescription}`);
    } else {
        testsFailed++;
        failedTests.push(testDescription);
        console.log(`${COLORS.red}❌ FAIL${COLORS.reset}: ${testDescription}`);
        console.log(`   Expected length: ${expectedLength}, Got: ${array.length}`);
    }
}

/**
 * Assert that a value is greater than another
 * @param {number} actual - The actual value
 * @param {number} threshold - The value that actual should exceed
 * @param {string} testDescription - Clear description of what is being tested
 */
function assertGreaterThan(actual, threshold, testDescription) {
    testsRun++;
    const passed = actual > threshold;

    if (passed) {
        testsPassed++;
        console.log(`${COLORS.green}✅ PASS${COLORS.reset}: ${testDescription}`);
        console.log(`   Value: ${actual.toFixed(2)} > ${threshold.toFixed(2)}`);
    } else {
        testsFailed++;
        failedTests.push(testDescription);
        console.log(`${COLORS.red}❌ FAIL${COLORS.reset}: ${testDescription}`);
        console.log(`   Expected > ${threshold.toFixed(2)}, Got: ${actual.toFixed(2)}`);
    }
}

/**
 * Print a section header
 */
function printSection(title) {
    console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${title}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
}

// ========================================
// TEST SUITE EXECUTION
// ========================================

console.log(`\n${COLORS.blue}🧪 Investment Calculator Test Suite${COLORS.reset}`);
console.log(`${COLORS.blue}${'='.repeat(60)}${COLORS.reset}\n`);

// ========================================
// SUITE 1: Amortization Calculations
// ========================================
printSection('📊 Suite 1: Amortization Calculations');

// Test 1.1: Verify loan payoff duration for standard 100k loan
{
    const principal = 100000;
    const monthlyPayment = 1000;
    const annualRate = 3.6;

    const schedule = calculateAmortization(principal, monthlyPayment, annualRate);

    assertArrayLength(
        schedule,
        120,
        'Standard 100k loan at 3.6% APR with €1000/month payment should be paid off in 120 months'
    );
}

// Test 1.2: Verify final balance is zero after payoff
{
    const schedule = calculateAmortization(100000, 1000, 3.6);

    assertApproximatelyEqual(
        schedule[schedule.length - 1].balance,
        0,
        'Final balance after complete loan payoff should be €0',
        1
    );
}

// Test 1.3: Verify total interest paid is reasonable
{
    const schedule = calculateAmortization(100000, 1000, 3.6);
    const totalInterest = schedule[schedule.length - 1].totalInterest;

    assertApproximatelyEqual(
        totalInterest,
        19070,
        'Total interest paid on 100k loan at 3.6% APR over 120 months should be ~€19,070',
        100
    );
}

// Test 1.4: Verify higher payment results in faster payoff
{
    const schedule = calculateAmortization(100000, 5000, 3.6);

    assertArrayLength(
        schedule,
        21,
        'Higher payment of €5000/month should pay off 100k loan in 21 months (vs 120 months at €1000/month)'
    );
}

// Test 1.5: Verify first month interest calculation accuracy
{
    const principal = 320000;
    const monthlyPayment = 1500;
    const annualRate = 3.5;

    const schedule = calculateAmortization(principal, monthlyPayment, annualRate);

    // First month interest = principal * (annualRate / 100 / 12)
    // 320000 * (3.5 / 100 / 12) = 933.33
    assertApproximatelyEqual(
        schedule[0].interestPayment,
        933.33,
        'First month interest on €320k at 3.5% APR should be €933.33',
        0.01
    );
}

// Test 1.6: Verify first month principal payment
{
    const schedule = calculateAmortization(320000, 1500, 3.5);

    // Principal payment = monthly payment - interest payment
    // 1500 - 933.33 = 566.67
    assertApproximatelyEqual(
        schedule[0].principalPayment,
        566.67,
        'First month principal payment should be €1500 - €933.33 = €566.67',
        0.01
    );
}

// Test 1.7: Verify balance decreases after first payment
{
    const schedule = calculateAmortization(320000, 1500, 3.5);

    // New balance = original - principal payment
    // 320000 - 566.67 = 319433.33
    assertApproximatelyEqual(
        schedule[0].balance,
        319433.33,
        'Balance after first payment should decrease by principal amount to €319,433.33',
        0.01
    );
}

// ========================================
// SUITE 2: German Tax Savings
// ========================================
printSection('📊 Suite 2: German Tax Savings (AfA & Deductions)');

// Test 2.1: Verify AfA depreciation calculation (2% annual)
{
    const buildingValue = 300000;
    const annualRentalIncome = 24000; // €2000/month * 12
    const result = calculateGermanTaxSavings(buildingValue, 10000, 2000, 30, annualRentalIncome);

    // AfA = building value * 2%
    assertApproximatelyEqual(
        result.annualDepreciation,
        6000,
        'AfA depreciation on €300k building should be 2% = €6,000 annually'
    );
}

// Test 2.2: Verify total deductible calculation
{
    const annualRentalIncome = 24000;
    const result = calculateGermanTaxSavings(300000, 10000, 2000, 30, annualRentalIncome);

    // Total deductible = depreciation + interest + expenses
    // 6000 + 10000 + 2000 = 18000
    assertApproximatelyEqual(
        result.totalDeductible,
        18000,
        'Total deductible should sum AfA (€6k) + Interest (€10k) + Expenses (€2k) = €18,000'
    );
}

// Test 2.3: Verify tax savings when expenses exceed income
{
    const annualRentalIncome = 24000; // €2000/month
    const result = calculateGermanTaxSavings(300000, 10000, 2000, 30, annualRentalIncome);

    // Rental income: €24,000
    // Deductibles: €6k (AfA) + €10k (interest) + €2k (expenses) = €18,000
    // Net result: €24,000 - €18,000 = +€6,000 (profit, no loss)
    // Tax savings: €0 (no loss to offset other income)
    assertApproximatelyEqual(
        result.taxSavings,
        0,
        'Tax savings should be €0 when rental income (€24k) exceeds deductibles (€18k)'
    );
}

// Test 2.4: Verify tax savings when deductibles create a loss
{
    const annualRentalIncome = 18000; // €1500/month
    const result = calculateGermanTaxSavings(400000, 15000, 3000, 42, annualRentalIncome);

    // AfA = 400000 * 0.02 = 8000
    // Total deductible = 8000 + 15000 + 3000 = 26000
    // Net result: €18,000 - €26,000 = -€8,000 (loss)
    // Tax savings = €8,000 * 0.42 = €3,360
    assertApproximatelyEqual(
        result.taxSavings,
        3360,
        'Tax savings at 42% on €8k loss (€18k income - €26k deductibles) should be €3,360'
    );
}

// Test 2.5: Verify tax savings decrease as interest decreases
{
    const buildingValue = 300000;
    const annualExpenses = 2000;
    const taxRate = 30;
    const annualRentalIncome = 18000; // €1500/month - creates a loss scenario

    const year1 = calculateGermanTaxSavings(buildingValue, 11000, annualExpenses, taxRate, annualRentalIncome);
    const year5 = calculateGermanTaxSavings(buildingValue, 8000, annualExpenses, taxRate, annualRentalIncome);

    // Year 1: Deductibles = 6000 + 11000 + 2000 = 19000, Loss = 18000 - 19000 = -1000, Savings = 300
    // Year 5: Deductibles = 6000 + 8000 + 2000 = 16000, Income > Deductibles, Savings = 0
    assertGreaterThan(
        year1.taxSavings,
        year5.taxSavings,
        'Tax savings should decrease over time as mortgage interest decreases (Year 1: €11k interest vs Year 5: €8k interest)'
    );
}

// ========================================
// SUITE 3: Cash Flow Calculations
// ========================================
printSection('📊 Suite 3: Cash Flow Calculations');

// Test 3.1: Verify base cash flow without tax benefits
{
    const expectedRent = 2000;
    const monthlyPayment = 1500;
    const baseCashFlow = expectedRent - monthlyPayment;

    assertApproximatelyEqual(
        baseCashFlow,
        500,
        'Base monthly cash flow should be Rent (€2000) - Payment (€1500) = €500'
    );
}

// Test 3.2: Verify cash flow with tax benefits
{
    const expectedRent = 2000;
    const monthlyPayment = 1500;
    const annualTaxSavings = 6000;
    const monthlyTaxBenefit = annualTaxSavings / 12;

    const totalCashFlow = (expectedRent - monthlyPayment) + monthlyTaxBenefit;

    assertApproximatelyEqual(
        totalCashFlow,
        1000,
        'Cash flow with tax benefits should be Base (€500) + Monthly Tax Benefit (€500) = €1,000'
    );
}

// Test 3.3: Verify cumulative cash flow after 12 months
{
    const monthlyCashFlow = 500;
    const initialEquity = 80000;
    const months = 12;

    // Cumulative = -equity + (monthly cash flow * months)
    const cumulativeAfter12 = -initialEquity + (monthlyCashFlow * months);

    assertApproximatelyEqual(
        cumulativeAfter12,
        -74000,
        'After 12 months with €500/month cash flow, cumulative should be -€80k + €6k = -€74,000'
    );
}

// Test 3.4: Verify break-even calculation
{
    const initialEquity = 80000;
    const monthlyCashFlow = 500;

    const breakEvenMonths = initialEquity / monthlyCashFlow;

    assertApproximatelyEqual(
        breakEvenMonths,
        160,
        'Break-even point should occur at 160 months when €500/month recovers €80k equity'
    );

    assertApproximatelyEqual(
        breakEvenMonths / 12,
        13.33,
        'Break-even should occur after 13.33 years',
        0.01
    );
}

// ========================================
// SUITE 4: ROI Calculations
// ========================================
printSection('📊 Suite 4: ROI Calculations');

// Test 4.1: Verify basic ROI calculation
{
    const equity = 80000;
    const totalRentReceived = 200000;
    const propertyAppreciation = 60000;

    const totalGains = totalRentReceived + propertyAppreciation;
    const roi = (totalGains / equity) * 100;

    assertApproximatelyEqual(
        roi,
        325,
        'ROI should be (€200k rent + €60k appreciation) / €80k equity * 100 = 325%',
        0.1
    );
}

// Test 4.2: Verify property appreciation at 3% annual
{
    const propertyWorth = 400000;
    const years = 10;

    const appreciated = propertyWorth * Math.pow(1.03, years);
    const gain = appreciated - propertyWorth;

    assertApproximatelyEqual(
        gain,
        137566,
        '€400k property appreciating at 3% annually should gain ~€137,566 over 10 years',
        100
    );
}

// ========================================
// SUITE 5: Integration Tests
// ========================================
printSection('📊 Suite 5: Integration Tests (Full Scenarios)');

// Test 5.1: Complete scenario without tax benefits
{

    const purchasePrice = 380000;
    const additionalCosts = 20000;
    const expectedRent = 2000;
    const debtAmount = 320000;
    const monthlyPayment = 1500;

    const totalInvestment = purchasePrice + additionalCosts;
    const equity = totalInvestment - debtAmount;
    const monthlyCashFlow = expectedRent - monthlyPayment;

    assertApproximatelyEqual(
        totalInvestment,
        400000,
        'Total investment should equal purchase price (€380k) + additional costs (€20k) = €400k'
    );

    assertApproximatelyEqual(
        equity,
        80000,
        'Initial equity should be total investment (€400k) - debt (€320k) = €80k'
    );

    assertApproximatelyEqual(
        monthlyCashFlow,
        500,
        'Monthly cash flow without tax should be rent (€2k) - payment (€1.5k) = €500'
    );
}

// Test 5.2: Complete scenario with German tax benefits
{
    const buildingValue = 300000;
    const firstYearInterest = 11200;
    const annualExpenses = 2000;
    const taxRate = 30;
    const annualRentalIncome = 24000; // €2000/month

    const taxCalc = calculateGermanTaxSavings(buildingValue, firstYearInterest, annualExpenses, taxRate, annualRentalIncome);
    const monthlyTaxBenefit = taxCalc.taxSavings / 12;

    const baseCashFlow = 500;
    const totalCashFlow = baseCashFlow + monthlyTaxBenefit;

    // Deductibles = 6000 (AfA) + 11200 (interest) + 2000 (expenses) = 19200
    // Net: 24000 - 19200 = +4800 (profit, no tax savings)
    // Monthly tax benefit = 0
    assertApproximatelyEqual(
        totalCashFlow,
        500,
        'With no rental loss, monthly cash flow should be base (€500) + tax benefit (€0) = €500'
    );
}

// ========================================
// TEST SUITE 6: Partial Year Calculations
// ========================================
printSection('📅 Test Suite 6: Partial Year Calculations');

{
    // Test 1: Full year (Jan start)
    // Jan 2025 start, checking 2025 (month 0)
    const months = getMonthsInYear(0, 0, 2025);
    assertApproximatelyEqual(months, 12, 'Full year starting in Jan should have 12 months');
}

{
    // Test 2: Partial year (June start)
    // June 2025 start (month 5), checking 2025
    // Should be 7 months (June-Dec)
    const months = getMonthsInYear(0, 5, 2025);
    assertApproximatelyEqual(months, 7, 'Year starting in June should have 7 months');
}

{
    // Test 3: Partial year (Dec start)
    // Dec 2025 start (month 11), checking 2025
    // Should be 1 month (Dec)
    const months = getMonthsInYear(0, 11, 2025);
    assertApproximatelyEqual(months, 1, 'Year starting in Dec should have 1 month');
}

{
    // Test 4: Second year full
    // June 2025 start. Checking month 12 (June 2026).
    // 2026 should be full 12 months.
    const months = getMonthsInYear(12, 5, 2025);
    assertApproximatelyEqual(months, 12, 'Second year should be full 12 months');
}

{
    // Test 5: End of investment check
    // 40 years = 480 months.
    // If start Jan 2025, end Dec 2064.
    // Month 479 is Dec 2064.
    const months = getMonthsInYear(479, 0, 2025);
    assertApproximatelyEqual(months, 12, 'Last year (full) should have 12 months');
}

// ========================================
// TEST SUITE 7: Data Transformations
// ========================================
printSection('🔄 Test Suite 7: Data Transformations');

{
    // Test 1: Aggregate to yearly data
    // Create 24 months of data starting from Jan 2025 (Month 0)
    // 0-11 = 2025, 12-23 = 2026
    const monthlyData = Array.from({ length: 24 }, (_, i) => ({ month: i, value: i }));
    const yearlyData = aggregateToCalendarYears(monthlyData, 0, 2025);

    assertApproximatelyEqual(yearlyData.length, 2, 'Should have 2 yearly data points for 24 months');
    assertApproximatelyEqual(yearlyData[0].year, 2025, 'First point should be year 2025');
    assertApproximatelyEqual(yearlyData[1].year, 2026, 'Second point should be year 2026');
}

{
    // Test 2: Extend amortization schedule
    const amortization = Array.from({ length: 12 }, (_, i) => ({
        month: i,
        balance: 1000 - i * 100,
        totalInterest: i * 10
    }));
    const extended = extendAmortizationSchedule(amortization, 24);

    assertApproximatelyEqual(extended.length, 25, 'Should extend to 24 months (0-24 inclusive)');
    assertApproximatelyEqual(extended[24].balance, 0, 'Extended months should have 0 balance');
    assertApproximatelyEqual(extended[24].totalInterest, 110, 'Extended months should keep final total interest');
}

// ========================================
// TEST SUITE 8: Edge Cases & Post-Payoff
// ========================================
printSection('⚠️ Test Suite 8: Edge Cases & Post-Payoff');

{
    // Test 1: Zero interest rate
    // 100k loan, 0% interest, 1000/month payment -> 100 months
    const schedule = calculateAmortization(100000, 1000, 0);
    assertApproximatelyEqual(schedule.length, 100, 'Zero interest loan should take exactly Principal/Payment months');
    assertApproximatelyEqual(schedule[0].interestPayment, 0, 'Zero interest loan should have 0 interest payment');
}

{
    // Test 2: Immediate payoff (Cash purchase)
    // 0 loan amount
    const schedule = calculateAmortization(0, 1000, 3.5);
    assertApproximatelyEqual(schedule.length, 0, 'Zero loan amount should have empty schedule');
}

{
    // Test 3: Tax calculation with no loan (Post-payoff scenario)
    // Building 300k, Interest 0, Expenses 2k, Rent 24k
    // Deductibles = 6k (AfA) + 0 (Interest) + 2k (Expenses) = 8k
    // Net Rental = 24k - 8k = 16k Profit
    // Tax = 16k * 30% = 4800
    const taxCalc = calculateGermanTaxSavings(300000, 0, 2000, 30, 24000);
    assertApproximatelyEqual(taxCalc.taxSavings, 0, 'Should have 0 savings when profitable');
    assertApproximatelyEqual(taxCalc.netRentalResult, 16000, 'Should have 16k profit');
}

{
    // Test 4: High interest rate (predatory loan)
    // 100k loan, 50% interest, 5000/month payment
    // Monthly rate = 50/12 = 4.16%
    // Interest = 4166.67
    // Principal = 5000 - 4166.67 = 833.33
    const schedule = calculateAmortization(100000, 5000, 50);
    assertApproximatelyEqual(schedule[0].interestPayment, 4166.67, 'High interest calculation check');
}

// ========================================
// TEST SUITE 9: Comprehensive Metrics
// ========================================
printSection('📊 Suite 9: Comprehensive Metrics (Refactored Logic)');



{
    // Test 1: Verify structure and basic values
    const params = {
        purchasePrice: 200000,
        additionalCosts: 20000,
        expectedRent: 1000,
        debtAmount: 150000,
        monthlyPayment: 800,
        interestRate: 3.5,
        applyGermanTax: false,
        buildingValue: 150000,
        taxRate: 30,
        annualExpenses: 1000,
        startMonth: 0,
        startYear: 2025,
        propertyWorth: 200000
    };

    const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);
    const metrics = calculateInvestmentMetrics(params, amortization, getMonthsInYear);

    assertApproximatelyEqual(metrics.totalInvestment, 220000, 'Total investment should be correct');
    assertApproximatelyEqual(metrics.equity, 70000, 'Initial equity should be correct');
    assertArrayLength(metrics.monthlyCashFlowSchedule, 481, 'Monthly cash flow schedule should cover 40 years + month 0');
    assertApproximatelyEqual(metrics.monthlyCashFlowSchedule[0].cashFlow, 200, 'Initial cash flow should be Rent - Payment (1000 - 800 = 200)');
}

{
    // Test 2: Verify tax logic integration
    const params = {
        purchasePrice: 200000,
        additionalCosts: 20000,
        expectedRent: 1000,
        debtAmount: 150000,
        monthlyPayment: 800,
        interestRate: 3.5,
        applyGermanTax: true,
        buildingValue: 150000,
        taxRate: 30,
        annualExpenses: 1200, // 100/month
        startMonth: 0,
        startYear: 2025,
        propertyWorth: 200000
    };

    const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);
    const metrics = calculateInvestmentMetrics(params, amortization, getMonthsInYear);

    // Month 0 Tax Calculation:
    // Interest (approx) = 150000 * 3.5% / 12 = 437.5
    // AfA = 150000 * 2% / 12 = 250
    // Expenses = 100
    // Total Deductibles = 437.5 + 250 + 100 = 787.5
    // Net Rental = 1000 - 787.5 = 212.5 (Profit)
    // Tax = 212.5 * 30% = 63.75

    // Net Cash Flow = Rent (1000) - Mortgage (800) - Tax (63.75) = 136.25

    const month0 = metrics.monthlyCashFlowSchedule[0];
    assertApproximatelyEqual(month0.taxOnRent, 63.75, 'Tax on rent should be calculated correctly', 1);
    assertApproximatelyEqual(month0.netCashFlow, 136.25, 'Net cash flow with tax should be correct', 1);
}

// ========================================
// TEST RESULTS SUMMARY
// ========================================
printSection('📈 Test Results Summary');

const successRate = ((testsPassed / testsRun) * 100).toFixed(1);

console.log(`Total Tests Run:  ${COLORS.blue}${testsRun}${COLORS.reset}`);
console.log(`${COLORS.green}✅ Passed:        ${testsPassed}${COLORS.reset}`);
console.log(`${COLORS.red}❌ Failed:        ${testsFailed}${COLORS.reset}`);
console.log(`Success Rate:     ${successRate >= 90 ? COLORS.green : COLORS.yellow}${successRate}%${COLORS.reset}`);

if (testsFailed > 0) {
    console.log(`\n${COLORS.yellow}Failed Tests:${COLORS.reset}`);
    failedTests.forEach((test, i) => {
        console.log(`  ${i + 1}. ${test}`);
    });
}

console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);

if (testsFailed === 0) {
    console.log(`${COLORS.green}🎉 All tests passed! Calculator is working correctly.${COLORS.reset}\n`);
    process.exit(0);
} else {
    console.log(`${COLORS.red}⚠️  ${testsFailed} test(s) failed. Please review the calculations.${COLORS.reset}\n`);
    process.exit(1);
}

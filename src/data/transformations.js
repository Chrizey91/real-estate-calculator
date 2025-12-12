/**
 * @fileoverview Data transformation functions for the investment calculator.
 * @module data-transformations
 */

import { calculateGermanTaxSavings } from '../core/calculations.js';

/**
 * Calculates tax savings grouped by calendar year.
 * @param {Array<Object>} amortization - The amortization schedule.
 * @param {number} buildingValue - Value of the building.
 * @param {number} annualExpenses - Annual deductible expenses.
 * @param {number} taxRate - Tax rate in percentage.
 * @param {number} startMonth - Start month index (0-11).
 * @param {number} startYear - Start year.
 * @param {number} monthlyRent - Monthly rental income.
 * @returns {Array<Object>} Schedule of tax savings per month.
 */
export function calculateTaxSavingsByYear(amortization, buildingValue, annualExpenses, taxRate, startMonth, startYear, monthlyRent) {
    // Group amortization by calendar year
    const yearlyData = {};

    amortization.forEach(month => {
        const date = new Date(startYear, startMonth, 1);
        date.setMonth(date.getMonth() + month.month);
        const year = date.getFullYear();

        if (!yearlyData[year]) {
            yearlyData[year] = {
                interest: 0,
                months: []
            };
        }

        yearlyData[year].interest += month.interestPayment;
        yearlyData[year].months.push(month.month);
    });

    // Calculate tax savings for each year
    const schedule = [];
    Object.keys(yearlyData).sort().forEach(year => {
        const yearData = yearlyData[year];
        const monthsInYear = yearData.months.length;
        const fractionOfYear = monthsInYear / 12;

        // Pro-rate values for partial years
        const actualAnnualRent = monthlyRent * monthsInYear;
        const actualAnnualExpenses = annualExpenses * fractionOfYear;

        // Calculate tax with pro-rated values
        // Note: calculateGermanTaxSavings calculates AfA internally as 2% of building value
        // We need to adjust the building value input to get the correct pro-rated AfA
        // Or better, we calculate AfA manually here to be precise

        const annualDepreciation = (buildingValue * 0.02) * fractionOfYear;
        const totalDeductible = annualDepreciation + yearData.interest + actualAnnualExpenses;
        const netRentalResult = actualAnnualRent - totalDeductible;
        const taxSavings = netRentalResult < 0 ? Math.abs(netRentalResult) * (taxRate / 100) : 0;

        // Calculate components for visualization
        const isProfit = netRentalResult > 0;
        const taxableIncome = isProfit ? netRentalResult : 0;
        const deductibleOverflow = isProfit ? 0 : Math.abs(netRentalResult);
        const taxReturns = taxSavings;

        // Add entry for each month in this year
        yearData.months.forEach(monthIdx => {
            schedule.push({
                month: monthIdx,
                savings: taxSavings,
                totalDeductible: totalDeductible,
                // Detailed breakdown
                annualRentalIncome: actualAnnualRent,
                annualDepreciation: annualDepreciation,
                annualInterest: yearData.interest,
                annualExpenses: actualAnnualExpenses,
                netRentalResult: netRentalResult,
                taxableIncome: taxableIncome,
                deductibleOverflow: deductibleOverflow,
                taxReturns: taxReturns
            });
        });
    });

    return schedule;
}

/**
 * Aggregates monthly data to calendar year data points.
 * @param {Array<Object>} monthlyData - Array of monthly data objects.
 * @param {number} startMonth - Start month index (0-11).
 * @param {number} startYear - Start year.
 * @param {Object} initialValues - Initial state values for Beginning-of-Year snapshots.
 * @returns {Array<Object>} Array of yearly aggregated data.
 */
export function aggregateToCalendarYears(monthlyData, startMonth, startYear, initialValues = {}) {
    const yearlyData = {};

    // Track running state for robust start-value determination
    let lastState = {
        balance: initialValues.balance || 0,
        cumulative: initialValues.cumulative || 0,
        cumulativeIlliquid: initialValues.cumulativeIlliquid || 0,
        totalCumulative: initialValues.totalCumulative || 0
    };

    monthlyData.forEach(monthData => {
        const date = new Date(startYear, startMonth, 1);
        date.setMonth(date.getMonth() + monthData.month);
        const year = date.getFullYear();

        if (!yearlyData[year]) {
            // Determine "Start of Year" values
            // If this is the first year (check if month index matches start), use initialValues.
            // But monthlyData is 0, 1, 2...
            // So if monthData.month == 0 -> Initial.
            // If new year starts at month index X, then StartValue = monthlyData[X-1].State.

            let balanceStart, cumulativeStart, cumulativeIlliquidStart, totalCumulativeStart;

            if (monthData.month === 0) {
                // Very start of the simulation
                balanceStart = initialValues.balance !== undefined ? initialValues.balance : 0;
                cumulativeStart = initialValues.cumulative !== undefined ? initialValues.cumulative : 0;
                cumulativeIlliquidStart = initialValues.cumulativeIlliquid !== undefined ? initialValues.cumulativeIlliquid : 0;
                totalCumulativeStart = initialValues.totalCumulative !== undefined ? initialValues.totalCumulative : 0;
            } else {
                // Continuation from previous state (robust against gaps or index mismatches)
                // If this is the FIRST month of the year, use the running last state.
                balanceStart = lastState.balance;
                cumulativeStart = lastState.cumulative;
                cumulativeIlliquidStart = lastState.cumulativeIlliquid;
                totalCumulativeStart = lastState.totalCumulative;
            }

            yearlyData[year] = {
                year: year,
                months: [],
                // Flow variables (sums)
                annualRentIncome: 0,
                annualMortgagePayment: 0,
                annualTaxOnRent: 0,
                annualTaxReimbursement: 0,
                annualNetCashFlow: 0,
                annualInterestPayment: 0,
                annualPrincipalPayment: 0,
                // State variables (last value of year - End of Year)
                balance: 0,
                totalInterest: 0,
                cumulative: 0,
                cumulativeIlliquid: 0,
                totalCumulative: 0,
                // Start variables (Beginning of Year)
                balanceStart: balanceStart,
                cumulativeStart: cumulativeStart,
                cumulativeIlliquidStart: cumulativeIlliquidStart,
                totalCumulativeStart: totalCumulativeStart
            };
        }

        const yearEntry = yearlyData[year];
        yearEntry.months.push(monthData);

        // Accumulate flows (check if property exists)
        if (monthData.rentIncome !== undefined) yearEntry.annualRentIncome += monthData.rentIncome;
        if (monthData.mortgagePayment !== undefined) yearEntry.annualMortgagePayment += monthData.mortgagePayment;
        if (monthData.taxOnRent !== undefined) yearEntry.annualTaxOnRent += monthData.taxOnRent;
        if (monthData.taxReimbursement !== undefined) yearEntry.annualTaxReimbursement += monthData.taxReimbursement;
        if (monthData.netCashFlow !== undefined) yearEntry.annualNetCashFlow += monthData.netCashFlow;
        if (monthData.interestPayment !== undefined) yearEntry.annualInterestPayment += monthData.interestPayment;
        if (monthData.principalPayment !== undefined) yearEntry.annualPrincipalPayment += monthData.principalPayment;

        // Handle Tax Savings Data
        if (monthData.annualRentalIncome !== undefined) yearEntry.annualRentalIncome = monthData.annualRentalIncome;
        if (monthData.annualDepreciation !== undefined) yearEntry.annualDepreciation = monthData.annualDepreciation;
        if (monthData.annualInterest !== undefined) yearEntry.annualInterest = monthData.annualInterest;
        if (monthData.annualExpenses !== undefined) yearEntry.annualExpenses = monthData.annualExpenses;
        if (monthData.taxableIncome !== undefined) yearEntry.taxableIncome = monthData.taxableIncome;
        if (monthData.deductibleOverflow !== undefined) yearEntry.deductibleOverflow = monthData.deductibleOverflow;
        if (monthData.taxReturns !== undefined) yearEntry.taxReturns = monthData.taxReturns;
        if (monthData.totalDeductible !== undefined) yearEntry.totalDeductible = monthData.totalDeductible;

        // Update state (always take latest - End of Year)
        if (monthData.balance !== undefined) yearEntry.balance = monthData.balance;
        if (monthData.totalInterest !== undefined) yearEntry.totalInterest = monthData.totalInterest;
        if (monthData.cumulative !== undefined) yearEntry.cumulative = monthData.cumulative;
        if (monthData.cumulativeIlliquid !== undefined) yearEntry.cumulativeIlliquid = monthData.cumulativeIlliquid;
        if (monthData.totalCumulative !== undefined) yearEntry.totalCumulative = monthData.totalCumulative;

        // Update running state for next iteration
        if (monthData.balance !== undefined) lastState.balance = monthData.balance;
        if (monthData.cumulative !== undefined) lastState.cumulative = monthData.cumulative;
        if (monthData.cumulativeIlliquid !== undefined) lastState.cumulativeIlliquid = monthData.cumulativeIlliquid;
        if (monthData.totalCumulative !== undefined) lastState.totalCumulative = monthData.totalCumulative;
    });

    return Object.values(yearlyData).sort((a, b) => a.year - b.year);
}

/**
 * Extends the amortization schedule to a fixed number of months by padding with zero balances.
 * @param {Array<Object>} amortization - The original amortization schedule.
 * @param {number} targetMonths - The target number of months (e.g., 480).
 * @returns {Array<Object>} The extended amortization schedule.
 */
export function extendAmortizationSchedule(amortization, targetMonths = 480) {
    const extended = [...amortization];
    const finalTotalInterest = amortization.length > 0 ? amortization[amortization.length - 1].totalInterest : 0;

    // Pad with zero balance months up to targetMonths
    // Fix: Robustly determine next month number
    let nextMonthNum = 0;
    if (amortization.length > 0) {
        nextMonthNum = amortization[amortization.length - 1].month + 1;
    }

    for (let month = nextMonthNum; month <= targetMonths; month++) {
        extended.push({
            month: month,
            balance: 0,
            interestPayment: 0,
            principalPayment: 0,
            totalInterest: finalTotalInterest
        });
    }

    return extended;
}

/**
 * Calculates comprehensive investment metrics including cash flow and ROI schedules.
 * @param {Object} params - Input parameters
 * @param {number} params.purchasePrice - Purchase price
 * @param {number} params.additionalCosts - Additional costs
 * @param {number} params.expectedRent - Monthly rent
 * @param {number} params.debtAmount - Loan amount
 * @param {number} params.monthlyPayment - Monthly mortgage payment
 * @param {number} params.interestRate - Annual interest rate
 * @param {boolean} params.applyGermanTax - Whether to apply tax logic
 * @param {number} params.buildingValue - Building value for depreciation
 * @param {number} params.taxRate - Tax rate (percentage)
 * @param {number} params.annualExpenses - Annual maintenance/expenses
 * @param {number} params.startMonth - Start month index (0-11)
 * @param {number} params.startYear - Start year
 * @param {number} params.propertyWorth - Current property worth
 * @param {Array} amortization - Amortization schedule
 * @param {Function} getMonthsInYearFn - Dependency injection for month calculation
 * @returns {Object} Calculated metrics and schedules
 */
export function calculateInvestmentMetrics(params, amortization, getMonthsInYearFn) {
    const {
        purchasePrice, additionalCosts, expectedRent, debtAmount, monthlyPayment,
        applyGermanTax, buildingValue, taxRate, annualExpenses,
        startMonth, startYear, propertyWorth
    } = params;

    const totalInvestment = purchasePrice + additionalCosts;
    const equity = totalInvestment - debtAmount;
    const payoffMonths = amortization.length;
    const payoffYears = payoffMonths / 12;
    const totalInterest = amortization.length > 0 ? amortization[amortization.length - 1].totalInterest : 0;

    // Build monthly cash flow schedule - extended to 40 years (480 months)
    const MAX_MONTHS = 480;
    const monthlyCashFlowSchedule = [];
    const cashFlowSchedule = [];
    let cumulativeCashFlow = -equity;

    for (let month = 0; month <= MAX_MONTHS; month++) {
        // Basic calculations
        let rentIncome = expectedRent;
        // Use actual payment from amortization schedule if available (handle partial final payments)
        let mortgagePayment = 0;
        let interestPayment = 0;
        let principalPayment = 0;
        let currentBalance = 0;

        if (month < amortization.length) {
            const entry = amortization[month];
            mortgagePayment = entry.payment;
            interestPayment = entry.interestPayment;
            principalPayment = entry.principalPayment;
            currentBalance = entry.balance;
        }

        // Tax on rental profit/loss
        let taxOnRent = 0;
        if (applyGermanTax) {
            const monthlyAfA = (buildingValue * 0.02) / 12;
            const monthlyExpenses = annualExpenses / 12;
            const monthlyDeductibles = monthlyAfA + interestPayment + monthlyExpenses;
            const monthlyNetRental = expectedRent - monthlyDeductibles;
            taxOnRent = monthlyNetRental * (taxRate / 100);
        }

        const netMonthlyCashFlow = rentIncome - mortgagePayment - taxOnRent;
        const monthsInThisYear = getMonthsInYearFn(month, startMonth, startYear);

        cumulativeCashFlow += netMonthlyCashFlow;

        // Calculate Equity (Illiquid Cash Flow)
        // Equity = Initial Property Equity (Purchase Price - Debt) + Principal Paid
        // This excludes additional costs (sunk costs) from the asset value view
        const initialPropertyEquity = purchasePrice - debtAmount;
        // Optimization: principalPaid variable above is monthly; we need cumulative.
        // Or simply: Debt - CurrentBalance.
        const principalPaidCumulative = debtAmount - currentBalance;
        const cumulativeIlliquid = initialPropertyEquity + principalPaidCumulative;

        // Calculate Total Cumulative (Liquid + Illiquid)
        const totalCumulative = cumulativeCashFlow + cumulativeIlliquid;

        monthlyCashFlowSchedule.push({
            month,
            cashFlow: netMonthlyCashFlow,
            rentIncome,
            mortgagePayment,
            taxOnRent,
            taxReimbursement: -Math.min(0, taxOnRent),
            netCashFlow: netMonthlyCashFlow,
            annualRentIncome: rentIncome * monthsInThisYear,
            annualMortgagePayment: mortgagePayment * monthsInThisYear,
            annualTaxOnRent: taxOnRent * monthsInThisYear,
            annualTaxReimbursement: -Math.min(0, taxOnRent) * monthsInThisYear,
            annualNetCashFlow: netMonthlyCashFlow * monthsInThisYear,
            cumulative: cumulativeCashFlow,
            cumulativeIlliquid: cumulativeIlliquid,
            totalCumulative: totalCumulative,
            // Pass through state for aggregation
            balance: currentBalance,
            totalInterest: amortization[month]?.totalInterest || totalInterest,
            principalPayment: principalPayment,
            interestPayment: interestPayment
        });



        cashFlowSchedule.push({
            month,
            cumulative: cumulativeCashFlow,
            cumulativeIlliquid: cumulativeIlliquid,
            totalCumulative: totalCumulative
        });
    }

    // Cumulative cash flow calculated in main loop

    // Find break-even point
    const breakEvenMonth = cashFlowSchedule.findIndex(item => item.cumulative >= 0);
    const breakEvenYears = breakEvenMonth >= 0 ? breakEvenMonth / 12 : 0;

    // Calculate max investment needed (lowest point of cumulative cash flow)
    const minCumulative = Math.min(...cashFlowSchedule.map(item => item.cumulative));
    const maxInvestmentNeeded = Math.abs(minCumulative);

    // Find when max investment is reached (month of lowest cumulative cash flow)
    const maxInvestmentMonth = cashFlowSchedule.findIndex(item => item.cumulative === minCumulative);
    const maxInvestmentAtYears = maxInvestmentMonth >= 0 ? maxInvestmentMonth / 12 : 0;

    // Calculate ROI over time
    const roiSchedule = [];
    for (let month = 0; month <= MAX_MONTHS; month++) {
        const monthsElapsed = month;
        const totalRentReceived = expectedRent * monthsElapsed;
        const propertyAppreciation = propertyWorth * (1 + 0.03 * (monthsElapsed / 12)) - propertyWorth;
        const totalGains = totalRentReceived + propertyAppreciation;
        const roi = (totalGains / equity) * 100;

        roiSchedule.push({ month, roi });
    }

    const roi10Years = roiSchedule[120]?.roi || 0;

    return {
        totalInvestment,
        equity,
        payoffYears,
        totalInterest,
        breakEvenYears,
        maxInvestmentNeeded,
        maxInvestmentAtYears,
        roi10Years,
        monthlyCashFlowSchedule,
        cashFlowSchedule,
        roiSchedule
    };
}

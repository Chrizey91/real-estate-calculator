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
    const annualRentalIncome = monthlyRent * 12;
    const schedule = [];
    Object.keys(yearlyData).sort().forEach(year => {
        const yearData = yearlyData[year];
        const taxCalc = calculateGermanTaxSavings(buildingValue, yearData.interest, annualExpenses, taxRate, annualRentalIncome);

        // Add entry for each month in this year
        yearData.months.forEach(monthIdx => {
            schedule.push({
                month: monthIdx,
                savings: taxCalc.taxSavings
            });
        });
    });

    return schedule;
}

/**
 * Aggregates monthly data to yearly data points.
 * @param {Array<Object>} monthlyData - Array of monthly data objects.
 * @param {number} interval - Interval in months (default 12).
 * @returns {Array<Object>} Filtered array containing only data points at the specified interval.
 */
export function aggregateToYearlyData(monthlyData, interval = 12) {
    return monthlyData.filter((_, i) => i % interval === 0);
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
    for (let month = amortization.length; month <= targetMonths; month++) {
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

    for (let month = 0; month <= MAX_MONTHS; month++) {
        // Basic calculations
        const rentIncome = expectedRent;
        const mortgagePayment = month < payoffMonths ? monthlyPayment : 0;

        // Tax on rental profit/loss
        let taxOnRent = 0;
        if (applyGermanTax) {
            const monthlyInterest = month < amortization.length ? amortization[month].interestPayment : 0;
            const monthlyAfA = (buildingValue * 0.02) / 12;
            const monthlyExpenses = annualExpenses / 12;
            const monthlyDeductibles = monthlyAfA + monthlyInterest + monthlyExpenses;
            const monthlyNetRental = expectedRent - monthlyDeductibles;
            taxOnRent = monthlyNetRental * (taxRate / 100);
        }

        const netMonthlyCashFlow = rentIncome - mortgagePayment - taxOnRent;
        const monthsInThisYear = getMonthsInYearFn(month, startMonth, startYear);

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
            annualNetCashFlow: netMonthlyCashFlow * monthsInThisYear
        });
    }

    // Calculate cumulative cash flow
    const cashFlowSchedule = [];
    let cumulativeCashFlow = -equity;

    monthlyCashFlowSchedule.forEach(monthData => {
        cumulativeCashFlow += monthData.cashFlow;
        cashFlowSchedule.push({
            month: monthData.month,
            cumulative: cumulativeCashFlow
        });
    });

    // Find break-even point
    const breakEvenMonth = cashFlowSchedule.findIndex(item => item.cumulative >= 0);
    const breakEvenYears = breakEvenMonth >= 0 ? breakEvenMonth / 12 : 0;

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
        roi10Years,
        monthlyCashFlowSchedule,
        cashFlowSchedule,
        roiSchedule
    };
}

/**
 * @fileoverview Core pure calculation functions for the investment calculator.
 * @module core-calculations
 */

/**
 * Calculates the amortization schedule for a loan.
 * @param {number} principal - The total loan amount.
 * @param {number} monthlyPayment - The monthly payment amount.
 * @param {number} annualRate - The annual interest rate in percentage (e.g., 3.5).
 * @returns {Array<Object>} Array of monthly payment details.
 */
export function calculateAmortization(principal, monthlyPayment, annualRate) {
    const monthlyRate = annualRate / 100 / 12;
    let balance = principal;
    const schedule = [];
    let totalInterest = 0;
    let month = 0;

    // Safety break to prevent infinite loops if payment is too low
    const MAX_MONTHS = 1200; // 100 years

    while (balance > 0 && month < MAX_MONTHS) {
        const interestPayment = balance * monthlyRate;
        let principalPayment = monthlyPayment - interestPayment;

        if (principalPayment <= 0) {
            // Interest only or negative amortization - simplified handling
            // In a real app, we'd warn the user. Here we just cap it.
            principalPayment = 0;
        }

        if (balance < principalPayment) {
            principalPayment = balance;
        }

        balance -= principalPayment;
        totalInterest += interestPayment;
        month++;

        schedule.push({
            month: month,
            payment: principalPayment + interestPayment,
            interestPayment: interestPayment,
            principalPayment: principalPayment,
            balance: balance,
            totalInterest: totalInterest
        });

        if (balance < 0.01) balance = 0;
    }

    return schedule;
}

/**
 * Calculates German tax savings based on rental income and deductions.
 * @param {number} buildingValue - Value of the building (for depreciation).
 * @param {number} annualInterest - Total interest paid in the year.
 * @param {number} annualExpenses - Other annual deductible expenses.
 * @param {number} taxRate - Personal income tax rate in percentage.
 * @param {number} annualRentalIncome - Annual rental income.
 * @returns {Object} Tax calculation details including savings.
 */
export function calculateGermanTaxSavings(buildingValue, annualInterest, annualExpenses, taxRate, annualRentalIncome) {
    // AfA (Abschreibung für Abnutzung) - Standard 2% depreciation for buildings
    const annualDepreciation = buildingValue * 0.02;

    // Total deductible amount
    const totalDeductible = annualDepreciation + annualInterest + annualExpenses;

    // Net rental result: Income - Deductibles
    // Positive = profit (you pay tax), Negative = loss (you save tax)
    const netRentalResult = annualRentalIncome - totalDeductible;

    // Tax impact (negative means tax savings, positive means tax owed)
    // If you have a loss, it offsets other income at your marginal rate
    const taxSavings = netRentalResult < 0 ? Math.abs(netRentalResult) * (taxRate / 100) : 0;

    return {
        annualDepreciation,
        annualInterest,
        annualExpenses,
        totalDeductible,
        annualRentalIncome,
        netRentalResult,
        taxSavings
    };
}

/**
 * Helper function to calculate actual months in a given calendar year for an investment.
 * @param {number} month - The current month index in the simulation (0-based).
 * @param {number} startMonth - The starting month of the investment (0-11, Jan=0).
 * @param {number} startYear - The starting year of the investment.
 * @param {number} maxMonths - The maximum number of months in the simulation.
 * @returns {number} The number of months the investment is active during the calendar year of the given month.
 */
export function getMonthsInYear(month, startMonth, startYear, maxMonths = 480) {
    const currentDate = new Date(startYear, startMonth, 1);
    currentDate.setMonth(currentDate.getMonth() + month);
    const currentYear = currentDate.getFullYear();

    // Find first and last month indices in this calendar year
    let firstMonthOfYear = month;
    let lastMonthOfYear = month;

    // Find first month of this calendar year
    for (let m = month; m >= 0; m--) {
        const checkDate = new Date(startYear, startMonth, 1);
        checkDate.setMonth(checkDate.getMonth() + m);
        if (checkDate.getFullYear() === currentYear) {
            firstMonthOfYear = m;
        } else {
            break;
        }
    }

    // Find last month of this calendar year (up to maxMonths)
    for (let m = month; m <= maxMonths; m++) {
        const checkDate = new Date(startYear, startMonth, 1);
        checkDate.setMonth(checkDate.getMonth() + m);
        if (checkDate.getFullYear() === currentYear) {
            lastMonthOfYear = m;
        } else {
            break;
        }
    }

    return lastMonthOfYear - firstMonthOfYear + 1;
}

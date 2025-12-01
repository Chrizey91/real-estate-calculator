/**
 * @fileoverview Optimization logic for investment scenarios.
 * @module core/optimization
 */

/**
 * Calculates the optimal monthly payment and minimum rent for a specific scenario.
 * Allows setting a target cash flow and target repayment rate.
 *
 * Definition of Cash Flow used here matches the application's logic:
 * Cash Flow = Rent - Mortgage Payment - Tax
 * (Expenses are considered for Tax Deductions but not directly subtracted from Cash Flow in the current app model)
 *
 * @param {number} debtAmount - Total loan amount.
 * @param {number} interestRate - Annual interest rate (percentage).
 * @param {number} buildingValue - Value of the building (for AfA).
 * @param {number} annualExpenses - Annual non-recoverable expenses.
 * @param {number} taxRate - Personal income tax rate (percentage).
 * @param {boolean} applyTax - Whether to apply tax logic.
 * @param {number} [targetCashFlow=0] - Desired monthly cash flow (default 0 for break-even).
 * @param {number} [targetRepaymentRate=2.0] - Desired initial repayment rate in percent (default 2.0).
 * @returns {Object} Optimal scenario { monthlyPayment, minRent }
 */
export function calculateOptimalScenario(
    debtAmount,
    interestRate,
    buildingValue,
    annualExpenses,
    taxRate,
    applyTax,
    targetCashFlow = 0,
    targetRepaymentRate = 2.0
) {
    // 1. Calculate Optimal Monthly Payment (Interest + Target Repayment)
    const monthlyInterestRate = interestRate / 100 / 12;
    const initialMonthlyInterest = debtAmount * monthlyInterestRate;
    const monthlyRepayment = (debtAmount * (targetRepaymentRate / 100)) / 12;
    const optimalMonthlyPayment = initialMonthlyInterest + monthlyRepayment;

    // 2. Solve for Required Rent
    // Formula derivation:
    // CashFlow = Rent - Payment - Tax
    // Set CashFlow = Target  =>  Rent - Payment - Tax = Target
    // Rent - Payment - Target = Tax
    //
    // Tax = (Rent - Deductibles) * TaxRate
    // Deductibles = Interest + AfA + Expenses
    //
    // Rent - Payment - Target = (Rent - Deductibles) * TaxRate
    // Rent - Payment - Target = Rent*TaxRate - Deductibles*TaxRate
    // Rent - Rent*TaxRate = Payment + Target - Deductibles*TaxRate
    // Rent * (1 - TaxRate) = Payment + Target - Deductibles*TaxRate
    // Rent = (Payment + Target - Deductibles*TaxRate) / (1 - TaxRate)

    let minRent;

    if (applyTax) {
        const monthlyAfA = (buildingValue * 0.02) / 12;
        const monthlyExpenses = annualExpenses / 12;
        const monthlyDeductibles = initialMonthlyInterest + monthlyAfA + monthlyExpenses;
        const t = taxRate / 100;

        // Avoid division by zero or nonsense results if tax rate is >= 100%
        if (t >= 0.99) {
            minRent = optimalMonthlyPayment + targetCashFlow;
        } else {
            minRent = (optimalMonthlyPayment + targetCashFlow - (monthlyDeductibles * t)) / (1 - t);
        }
    } else {
        // Without tax effects:
        // CashFlow = Rent - Payment
        // Target = Rent - Payment
        // Rent = Payment + Target
        minRent = optimalMonthlyPayment + targetCashFlow;
    }

    return {
        monthlyPayment: Number(optimalMonthlyPayment.toFixed(2)),
        minRent: Number(minRent.toFixed(2))
    };
}

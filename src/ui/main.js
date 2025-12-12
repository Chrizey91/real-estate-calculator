import {
    calculateAmortization,
    calculateGermanTaxSavings,
    getMonthsInYear
} from '../core/calculations.js';

import {
    formatCurrency,
    formatPercentage,
    formatDate
} from '../utils/formatting.js';

import {
    calculateTaxSavingsByYear,
    aggregateToCalendarYears,
    extendAmortizationSchedule,
    calculateInvestmentMetrics
} from '../data/transformations.js';

import { calculateOptimalScenario } from '../core/optimization.js';

// Chart instances
let debtChart, cashFlowChart, taxSavingsChart, monthlyCashFlowChart;

// DOM elements - only initialized in browser environment
let inputs = {};
let results = {};
let calculateBtn;

// Initialize DOM elements and listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get all input elements
    inputs = {
        purchasePrice: document.getElementById('purchasePrice'),
        additionalCosts: document.getElementById('additionalCosts'),
        expectedRent: document.getElementById('expectedRent'),
        startMonth: document.getElementById('startMonth'),
        startYear: document.getElementById('startYear'),
        debtAmount: document.getElementById('debtAmount'),
        monthlyPayment: document.getElementById('monthlyPayment'),
        interestRate: document.getElementById('interestRate'),
        applyGermanTax: document.getElementById('applyGermanTax'),
        buildingValue: document.getElementById('buildingValue'),
        taxRate: document.getElementById('taxRate'),
        annualExpenses: document.getElementById('annualExpenses'),
        targetCashFlow: document.getElementById('targetCashFlow'),
        targetRepayment: document.getElementById('targetRepayment')
    };

    // Get result elements
    results = {
        monthlyRentResult: document.getElementById('monthlyRentResult'),
        monthlyPaymentResult: document.getElementById('monthlyPaymentResult'),
        totalInvestment: document.getElementById('totalInvestment'),
        payoffTime: document.getElementById('payoffTime'),
        totalInterest: document.getElementById('totalInterest'),
        breakEven: document.getElementById('breakEven')
    };

    // Tab Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Deactivate all
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Activate clicked
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');

            // Trigger calculation
            performCalculations();
        });
    });

    // Calculate button
    calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', performCalculations);
    }

    // Optimize button removed in favor of auto-calculation based on active tab
    // We kept the Calculate button for manual trigger if needed


    // Add event listeners to inputs for real-time updates
    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                // Debounce for better performance
                if (input.debounceTimer) clearTimeout(input.debounceTimer);
                input.debounceTimer = setTimeout(performCalculations, 500);
            });

            if (input.type === 'checkbox') {
                input.addEventListener('change', function () {
                    if (this.id === 'applyGermanTax') {
                        const taxFields = document.getElementById('taxFields');
                        if (taxFields) {
                            taxFields.style.display = this.checked ? 'block' : 'none';
                        }
                    }
                    performCalculations();
                });
            }
        }
    });

    // Chart.js default config
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = '#475569';
        Chart.defaults.font.family = 'Inter, sans-serif';
    }

    // Initial calculation (only on calculator page)
    if (calculateBtn) {
        performCalculations();
    }

    // Mobile Menu Toggle (works on all pages)
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');

    if (mobileBtn && navLinksContainer) {
        mobileBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('nav-active');
            mobileBtn.classList.toggle('active');
        });

        // Close menu when clicking a link
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('nav-active');
                mobileBtn.classList.remove('active');
            });
        });
    }
});

/**
 * Retrieves and parses all input values from the DOM.
 * @returns {Object} Parsed input values
 */
function getInputValues() {
    return {
        propertyWorth: parseFloat(inputs.purchasePrice.value) || 0, // removed propertyWorth input, use purchasePrice
        purchasePrice: parseFloat(inputs.purchasePrice.value) || 0,
        additionalCosts: parseFloat(inputs.additionalCosts.value) || 0,
        expectedRent: parseFloat(inputs.expectedRent.value) || 0,
        debtAmount: parseFloat(inputs.debtAmount.value) || 0,
        monthlyPayment: parseFloat(inputs.monthlyPayment.value) || 0,
        interestRate: parseFloat(inputs.interestRate.value) || 0,
        applyGermanTax: inputs.applyGermanTax.checked,
        buildingValue: parseFloat(inputs.buildingValue.value) || 0,
        taxRate: parseFloat(inputs.taxRate.value) || 0,
        annualExpenses: parseFloat(inputs.annualExpenses.value) || 0,
        startMonth: parseInt(inputs.startMonth.value),
        startYear: parseInt(inputs.startYear.value),
        targetCashFlow: parseFloat(inputs.targetCashFlow?.value) || 0,
        targetRepayment: parseFloat(inputs.targetRepayment?.value) || 2.0,
        // Helper to check active tab
        isOptimizationMode: document.querySelector('.tab-btn[data-tab="optimization"]')?.classList.contains('active')
    };
}

/**
 * Handles the optimization button click.
 * Calculates optimal payment and rent, updates inputs, and triggers calculation.
 */
function handleOptimization() {
    const params = getInputValues();

    const optimal = calculateOptimalScenario(
        params.debtAmount,
        params.interestRate,
        params.buildingValue,
        params.annualExpenses,
        params.taxRate,
        params.applyGermanTax,
        params.targetCashFlow,
        params.targetRepayment
    );
    return optimal;
}



/**
 * Updates the results section of the UI.
 * @param {Object} metrics - Calculated investment metrics
 */
function updateResultsUI(metrics) {
    results.monthlyRentResult.textContent = formatCurrency(metrics.usedRent);
    results.monthlyPaymentResult.textContent = formatCurrency(metrics.usedMonthlyPayment);
    results.totalInvestment.textContent = formatCurrency(metrics.totalInvestment);

    // Payoff Time Display with year
    const startYear = parseInt(inputs.startYear.value);
    const payoffYear = startYear + Math.floor(metrics.payoffYears);
    results.payoffTime.innerHTML = `Year ${payoffYear} \u003cspan style="font-size: 0.9rem; font-weight: normal; color: var(--text-secondary);">(${metrics.payoffYears.toFixed(1)} years)\u003c/span>`;

    results.totalInterest.textContent = formatCurrency(metrics.totalInterest);

    // Break-even Display
    if (metrics.breakEvenYears > 0) {
        const breakEvenDateYear = startYear + Math.floor(metrics.breakEvenYears);

        // Calculate when max investment is reached
        const maxInvestmentYears = metrics.maxInvestmentAtYears || 0;
        const maxInvestmentYear = startYear + Math.floor(maxInvestmentYears);

        results.breakEven.innerHTML = `
            Year ${breakEvenDateYear} <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-secondary);">(${metrics.breakEvenYears.toFixed(1)} years)</span>
            <div style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-secondary); font-weight: normal;">
                Max investment: ${formatCurrency(metrics.maxInvestmentNeeded)}<br>
                <span style="font-size: 0.75rem;">Reached in year ${maxInvestmentYear} (after ${maxInvestmentYears.toFixed(1)} years)</span>
            </div>
        `;
    } else {
        results.breakEven.textContent = 'Never';
    }

    // ROI removed
}

/**
 * Updates the tax savings section of the UI.
 * @param {Object} taxCalc - Tax calculation results
 * @param {number} taxRate - Tax rate percentage
 */
function updateTaxUI(taxCalc, taxRate) {
    // Show tax chart
    document.getElementById('taxSavingsChartContainer').style.display = 'block';
}

/**
 * Hides the tax savings section of the UI.
 */
function hideTaxUI() {
    // Hide tax chart
    document.getElementById('taxSavingsChartContainer').style.display = 'none';
}

function performCalculations() {
    const params = getInputValues();

    // Check for Optimization Mode
    if (params.isOptimizationMode) {
        const optimal = handleOptimization(); // Get optimal values based on inputs
        params.monthlyPayment = optimal.monthlyPayment;
        params.expectedRent = optimal.minRent;
    }

    // Calculate amortization schedule
    const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);

    // Shift amortization (1-based -> 0-based) for downstream consistency (Month 0 Active Logic)
    const shiftedAmortization = amortization.map(entry => ({
        ...entry,
        month: entry.month - 1
    }));

    // German tax calculations (Year 1 snapshot)
    if (params.applyGermanTax) {
        const annualRentalIncome = params.expectedRent * 12;
        const firstYearInterest = amortization.slice(0, 12).reduce((sum, month) => sum + month.interestPayment, 0);
        const taxCalc = calculateGermanTaxSavings(
            params.buildingValue,
            firstYearInterest,
            params.annualExpenses,
            params.taxRate,
            annualRentalIncome
        );
        updateTaxUI(taxCalc, params.taxRate);
    } else {
        hideTaxUI();
    }

    // Calculate comprehensive metrics (Using SHIFTED amortization)
    const metrics = calculateInvestmentMetrics(params, shiftedAmortization, getMonthsInYear);

    // Add used rent and payment to metrics for display
    metrics.usedRent = params.expectedRent;
    metrics.usedMonthlyPayment = params.monthlyPayment;
    updateResultsUI(metrics);

    // Extend shifted schedule for charts
    const extendedAmortization = extendAmortizationSchedule(shiftedAmortization, 480);

    // Calculate tax savings by calendar year using shifted schedule
    const taxSavingsSchedule = params.applyGermanTax
        ? calculateTaxSavingsByYear(
            extendedAmortization,
            params.buildingValue,
            params.annualExpenses,
            params.taxRate,
            params.startMonth,
            params.startYear,
            params.expectedRent
        )
        : [];

    updateCharts(
        extendedAmortization,
        metrics.cashFlowSchedule,
        null, // ROI schedule removed
        taxSavingsSchedule,
        params.applyGermanTax,
        params.startMonth,
        params.startYear,
        metrics.monthlyCashFlowSchedule
    );
}

function updateCharts(amortization, cashFlowSchedule, roiSchedule, taxSavingsSchedule, showTaxChart, startMonth, startYear, monthlyCashFlowSchedule) {
    // Amortization passed here is now 'amortization' (original) but we want 'extendedAmortization' or 'fullAmortization'.
    // Actually, updateCharts receives 'amortization' as arg1.
    // In performCalculations, we call updateCharts(amortization, ...).
    // We SHOULD pass 'fullAmortization' or 'extendedAmortization' to updateCharts to avoid re-extending and re-prepending.
    // Let's assume we will update the call site in performCalculations to pass 'fullAmortization' (or just let updateCharts extend it).
    // Standardizing: performCalculations passes 'fullAmortization'.
    // updateCharts extends it.

    const extendedAmortization = extendAmortizationSchedule(amortization, 480);

    const inputs = getInputValues();
    const initialDebt = inputs.debtAmount;

    // Month 0 check removed (Centralized in performCalculations)
    // We trust 'amortization' argument has Month 0 if passed from performCalculations.
    // Only need to ensure extendAmortizationSchedule preserves it (it does).
    const initialEquity = inputs.purchasePrice - inputs.debtAmount;
    // Initial cumulative liquid is strictly -Equity (Downpayment) + Additional Costs?
    // Wait, calculation starts at cumulativeCashFlow = -equity.
    // Does it include additional costs?
    // In calculateInvestmentMetrics: `cumulativeCashFlow = -equity`.
    // And `equity = totalInvestment - debtAmount` where `totalInvestment = purchasePrice + additionalCosts`.
    // So `equity` variable there DOES include additional costs.
    // BUT checking my previous fix: I calculated `cumulativeIlliquid` using `initialPropertyEquity = purchasePrice - debtAmount`.
    // So for liquid cash flow, it starts at `- (Purchase + Costs - Debt)`. This is correct.

    const initialValues = {
        balance: initialDebt,
        cumulative: -(inputs.purchasePrice + inputs.additionalCosts - inputs.debtAmount),
        cumulativeIlliquid: initialEquity, // Pure property equity
        totalCumulative: -(inputs.purchasePrice + inputs.additionalCosts - inputs.debtAmount) + initialEquity
    };

    // Debt Chart - Calendar Year Aggregation
    const debtData = aggregateToCalendarYears(extendedAmortization, startMonth, startYear, initialValues);

    if (debtChart) debtChart.destroy();
    debtChart = new Chart(document.getElementById('debtChart'), {
        type: 'line',
        data: {
            labels: debtData.map(d => d.year.toString()),
            datasets: [
                {
                    label: 'Remaining Debt',
                    // Use Beginning-of-Year Balance (Standard for snapshots)
                    data: debtData.map(d => d.balanceStart),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Interest Paid',
                    // Beginning-of-Year Interest (Sum of previous years)
                    data: debtData.map((d, i) => i === 0 ? 0 : debtData[i - 1].totalInterest),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Principal Paid',
                    // Beginning-of-Year Principal Paid.
                    // Year 1 (2025): Initial Debt - Initial Bal = 0.
                    // Year 2 (2026): Initial Debt - Year 2 Start Bal (reflects Year 1 payments).
                    data: debtData.map(d => {
                        return initialDebt - d.balanceStart;
                    }),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => context.dataset.label + ': ' + formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount (€)'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });

    // Detailed Cash Flow Chart - Calendar Year Aggregation
    // Pass same initialValues (declared above)

    const monthlyData = aggregateToCalendarYears(monthlyCashFlowSchedule, startMonth, startYear, initialValues);

    if (monthlyCashFlowChart) monthlyCashFlowChart.destroy();
    monthlyCashFlowChart = new Chart(document.getElementById('monthlyCashFlowChart'), {
        type: 'line',
        data: {
            // ... (Monthly Chart uses Annual Sums - flows during the year - keep as is?)
            // "shows numbers at beginning of said year" logic mostly applies to snapshots (Cumulative/Stock).
            // For Flow charts (Annual Rent/Tax), "Beginning of 2024" = 0 flow?
            // "Annual Rent during 2024".
            // If we shift snapshot graphs to "Begin", "2024" on Balance Graph = Jan 1.
            // "2024" on Flow Graph = Jan 1 to Dec 31 flow.
            // This is the standard "Period" vs "Instant" chart alignment.
            // So we KEEP flow variables as `d.annual...`.
            labels: monthlyData.map(d => d.year.toString()),
            datasets: [
                {
                    label: 'Annual Rent Income',
                    data: monthlyData.map(d => d.annualRentIncome),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Mortgage Payment',
                    data: monthlyData.map(d => -d.annualMortgagePayment),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Tax on Rent Income',
                    data: monthlyData.map(d => -Math.max(0, d.annualTaxOnRent)),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Tax Reimbursement',
                    data: monthlyData.map(d => d.annualTaxReimbursement),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Annual Net Cash Flow',
                    data: monthlyData.map(d => d.annualNetCashFlow),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        }
        // ...
    });

    // Cumulative Cash Flow Chart - Uses same aggregated data
    if (cashFlowChart) cashFlowChart.destroy();
    cashFlowChart = new Chart(document.getElementById('cashFlowChart'), {
        type: 'line',
        data: {
            labels: monthlyData.map(d => d.year.toString()),
            datasets: [
                {
                    label: 'Cumulative Liquid Cash Flow',
                    data: monthlyData.map(d => d.cumulativeStart), // Use Start
                    borderColor: '#3b82f6', // Blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Cumulative Illiquid Cash Flow (Equity)',
                    data: monthlyData.map(d => d.cumulativeIlliquidStart), // Use Start
                    borderColor: '#0ea5e9', // Sky-500
                    backgroundColor: 'rgba(14, 165, 233, 0.1)',
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Total Cumulative Cash Flow',
                    data: monthlyData.map(d => d.totalCumulativeStart), // Use Start
                    borderColor: '#8b5cf6', // Violet-500
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.parsed.y)
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Year'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Cumulative Cash Flow (€)'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });



    // ROI removed

    // Tax Savings Chart

    // Tax Savings Chart - Detailed Breakdown
    if (showTaxChart && taxSavingsSchedule.length > 0) {
        const taxData = aggregateToCalendarYears(taxSavingsSchedule, startMonth, startYear);

        if (taxSavingsChart) taxSavingsChart.destroy();
        taxSavingsChart = new Chart(document.getElementById('taxSavingsChart'), {
            type: 'bar',
            data: {
                labels: taxData.map(d => d.year.toString()),
                datasets: [
                    {
                        label: 'Rental Income',
                        data: taxData.map(d => d.annualRentalIncome),
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: '#3b82f6',
                        borderWidth: 2,
                        stack: 'income'
                    },
                    {
                        label: 'AfA (Depreciation)',
                        data: taxData.map(d => d.annualDepreciation),
                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                        borderColor: '#8b5cf6',
                        borderWidth: 1,
                        stack: 'deductions'
                    },
                    {
                        label: 'Mortgage Interest',
                        data: taxData.map(d => d.annualInterest),
                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                        borderColor: '#f59e0b',
                        borderWidth: 1,
                        stack: 'deductions'
                    },
                    {
                        label: 'Other Expenses',
                        data: taxData.map(d => d.annualExpenses),
                        backgroundColor: 'rgba(234, 179, 8, 0.7)',
                        borderColor: '#eab308',
                        borderWidth: 1,
                        stack: 'deductions'
                    },
                    {
                        label: 'Taxable Income',
                        data: taxData.map(d => d.taxableIncome),
                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                        borderColor: '#ef4444',
                        borderWidth: 2,
                        stack: 'result'
                    },
                    {
                        label: 'Deductible Overflow',
                        data: taxData.map(d => d.deductibleOverflow),
                        backgroundColor: 'rgba(148, 163, 184, 0.5)',
                        borderColor: '#94a3b8',
                        borderWidth: 1,
                        stack: 'result'
                    },
                    {
                        label: 'Tax Returns',
                        data: taxData.map(d => d.taxReturns),
                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                        borderColor: '#10b981',
                        borderWidth: 2,
                        stack: 'result'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#94a3b8',
                            usePointStyle: true,
                            padding: 10,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            title: (tooltipItems) => {
                                return 'Year ' + tooltipItems[0].label;
                            },
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (value === 0) return null; // Hide zero values
                                return label + ': ' + formatCurrency(value);
                            },
                            footer: (tooltipItems) => {
                                const index = tooltipItems[0].dataIndex;
                                const data = taxData[index];
                                const lines = [];
                                lines.push('─────────────────');
                                lines.push('Income: ' + formatCurrency(data.annualRentalIncome));
                                lines.push('Deductions: ' + formatCurrency(data.totalDeductible));
                                if (data.taxableIncome > 0) {
                                    lines.push('→ Taxable: ' + formatCurrency(data.taxableIncome));
                                } else {
                                    lines.push('→ Loss: ' + formatCurrency(data.deductibleOverflow));
                                    lines.push('→ Tax Return: ' + formatCurrency(data.taxReturns));
                                }
                                return lines;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Amount (€)'
                        },
                        ticks: {
                            callback: (value) => formatCurrency(value)
                        }
                    }
                }
            }
        });
    } else if (taxSavingsChart) {
        taxSavingsChart.destroy();
        taxSavingsChart = null;
    }
}



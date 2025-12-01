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
    aggregateToYearlyData,
    extendAmortizationSchedule,
    calculateInvestmentMetrics
} from '../data/transformations.js';

import { calculateOptimalScenario } from '../core/optimization.js';

// Chart instances
let debtChart, cashFlowChart, roiChart, taxSavingsChart, monthlyCashFlowChart;

// DOM elements - only initialized in browser environment
let inputs = {};
let results = {};
let calculateBtn;

// Initialize DOM elements and listeners if in browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Get all input elements
        inputs = {
            propertyWorth: document.getElementById('propertyWorth'),
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
            totalInvestment: document.getElementById('totalInvestment'),
            monthlyCashFlow: document.getElementById('monthlyCashFlow'),
            payoffTime: document.getElementById('payoffTime'),
            totalInterest: document.getElementById('totalInterest'),
            breakEven: document.getElementById('breakEven'),
            roi10: document.getElementById('roi10'),
            annualTaxSavings: document.getElementById('annualTaxSavings')
        };

        // Calculate button
        calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', performCalculations);
        }

        // Optimize button
        const optimizeBtn = document.getElementById('optimizeBtn');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', handleOptimization);
        }

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

        // Initial calculation
        performCalculations();
    });
}

/**
 * Retrieves and parses all input values from the DOM.
 * @returns {Object} Parsed input values
 */
function getInputValues() {
    return {
        propertyWorth: parseFloat(inputs.propertyWorth.value) || 0,
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
        targetRepayment: parseFloat(inputs.targetRepayment?.value) || 2.0
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

    // Update inputs
    inputs.monthlyPayment.value = optimal.monthlyPayment;
    inputs.expectedRent.value = optimal.minRent;

    // Trigger calculation to update UI
    performCalculations();
}

/**
 * Updates the results section of the UI.
 * @param {Object} metrics - Calculated investment metrics
 * @param {number} displayCashFlow - Cash flow value to display
 */
function updateResultsUI(metrics, displayCashFlow) {
    results.totalInvestment.textContent = formatCurrency(metrics.totalInvestment);
    results.monthlyCashFlow.textContent = formatCurrency(displayCashFlow);
    results.monthlyCashFlow.className = 'metric-value ' + (displayCashFlow >= 0 ? 'positive' : 'negative');
    results.payoffTime.textContent = metrics.payoffYears.toFixed(1) + ' years';
    results.totalInterest.textContent = formatCurrency(metrics.totalInterest);
    results.breakEven.textContent = metrics.breakEvenYears > 0 ? metrics.breakEvenYears.toFixed(1) + ' years' : 'Never';
    results.roi10.textContent = formatPercentage(metrics.roi10Years);
}

/**
 * Updates the tax savings section of the UI.
 * @param {Object} taxCalc - Tax calculation results
 * @param {number} taxRate - Tax rate percentage
 */
function updateTaxUI(taxCalc, taxRate) {
    document.getElementById('taxSavingsCard').style.display = 'flex';
    document.getElementById('taxBreakdown').style.display = 'block';
    results.annualTaxSavings.textContent = formatCurrency(taxCalc.taxSavings);

    document.getElementById('afaAmount').textContent = formatCurrency(taxCalc.annualDepreciation);
    document.getElementById('interestAmount').textContent = formatCurrency(taxCalc.annualInterest);
    document.getElementById('expensesAmount').textContent = formatCurrency(taxCalc.annualExpenses);
    document.getElementById('totalDeductible').textContent = formatCurrency(taxCalc.totalDeductible);
    document.getElementById('displayTaxRate').textContent = taxRate;
    document.getElementById('taxSavingsBreakdown').textContent = formatCurrency(taxCalc.taxSavings);

    document.getElementById('taxSavingsChartContainer').style.display = 'block';
}

/**
 * Hides the tax savings section of the UI.
 */
function hideTaxUI() {
    document.getElementById('taxSavingsCard').style.display = 'none';
    document.getElementById('taxBreakdown').style.display = 'none';
    document.getElementById('taxSavingsChartContainer').style.display = 'none';
}

function performCalculations() {
    const params = getInputValues();

    // Calculate amortization schedule
    const amortization = calculateAmortization(params.debtAmount, params.monthlyPayment, params.interestRate);

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

    // Calculate comprehensive metrics
    const metrics = calculateInvestmentMetrics(params, amortization, getMonthsInYear);

    // Display average monthly cash flow (or first month if available)
    const displayCashFlow = metrics.monthlyCashFlowSchedule.length > 0
        ? metrics.monthlyCashFlowSchedule[0].cashFlow
        : (params.expectedRent - params.monthlyPayment);

    // Update results UI
    updateResultsUI(metrics, displayCashFlow);

    // Calculate tax savings by calendar year (if applicable)
    const taxSavingsSchedule = params.applyGermanTax
        ? calculateTaxSavingsByYear(
            amortization,
            params.buildingValue,
            params.annualExpenses,
            params.taxRate,
            params.startMonth,
            params.startYear,
            params.expectedRent
        )
        : [];

    updateCharts(
        amortization,
        metrics.cashFlowSchedule,
        metrics.roiSchedule,
        taxSavingsSchedule,
        params.applyGermanTax,
        params.startMonth,
        params.startYear,
        metrics.monthlyCashFlowSchedule
    );
}

function updateCharts(amortization, cashFlowSchedule, roiSchedule, taxSavingsSchedule, showTaxChart, startMonth, startYear, monthlyCashFlowSchedule) {
    // Extend amortization to 40 years if shorter
    const extendedAmortization = extendAmortizationSchedule(amortization, 480);

    // Debt Chart with Interest and Principal breakdown - yearly data
    const debtData = aggregateToYearlyData(extendedAmortization);

    if (debtChart) debtChart.destroy();
    debtChart = new Chart(document.getElementById('debtChart'), {
        type: 'line',
        data: {
            labels: debtData.map(d => formatDate(startMonth, startYear, d.month)),
            datasets: [
                {
                    label: 'Remaining Debt',
                    data: debtData.map(d => d.balance),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Interest Paid',
                    data: debtData.map(d => d.totalInterest),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: false,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cumulative Principal Paid',
                    data: debtData.map((d) => {
                        const originalDebt = amortization.length > 0 ? amortization[0].balance + amortization[0].principalPayment : 0;
                        return originalDebt - d.balance;
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
                        text: 'Years'
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

    // Detailed Cash Flow Chart with breakdown - yearly data
    const monthlyData = aggregateToYearlyData(monthlyCashFlowSchedule);

    if (monthlyCashFlowChart) monthlyCashFlowChart.destroy();
    monthlyCashFlowChart = new Chart(document.getElementById('monthlyCashFlowChart'), {
        type: 'line',
        data: {
            labels: monthlyData.map(d => formatDate(startMonth, startYear, d.month)),
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
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
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
                        padding: 10,
                        font: {
                            size: 11
                        }
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
                        text: 'Years'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Annual Amount (€)'
                    },
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });

    // Cumulative Cash Flow Chart - yearly data
    const cashFlowData = aggregateToYearlyData(cashFlowSchedule);

    if (cashFlowChart) cashFlowChart.destroy();
    cashFlowChart = new Chart(document.getElementById('cashFlowChart'), {
        type: 'line',
        data: {
            labels: cashFlowData.map(d => formatDate(startMonth, startYear, d.month)),
            datasets: [{
                label: 'Cumulative Cash Flow',
                data: cashFlowData.map(d => d.cumulative),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
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
                        text: 'Years'
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

    // ROI Chart - yearly data
    const roiData = aggregateToYearlyData(roiSchedule);

    if (roiChart) roiChart.destroy();
    roiChart = new Chart(document.getElementById('roiChart'), {
        type: 'line',
        data: {
            labels: roiData.map(d => formatDate(startMonth, startYear, d.month)),
            datasets: [{
                label: 'Return on Investment',
                data: roiData.map(d => d.roi),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => formatPercentage(context.parsed.y)
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Years'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'ROI (%)'
                    },
                    ticks: {
                        callback: (value) => formatPercentage(value)
                    }
                }
            }
        }
    });

    // Tax Savings Chart
    if (showTaxChart && taxSavingsSchedule.length > 0) {
        const taxData = aggregateToYearlyData(taxSavingsSchedule);

        if (taxSavingsChart) taxSavingsChart.destroy();
        taxSavingsChart = new Chart(document.getElementById('taxSavingsChart'), {
            type: 'bar',
            data: {
                labels: taxData.map(d => {
                    const year = startYear + Math.floor(d.month / 12);
                    return year.toString();
                }),
                datasets: [{
                    label: 'Annual Tax Savings',
                    data: taxData.map(d => d.savings),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: '#10b981',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
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
                            text: 'Tax Savings (€)'
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



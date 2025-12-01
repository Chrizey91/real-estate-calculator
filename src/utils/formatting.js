/**
 * @fileoverview Shared utility functions for the investment calculator.
 * @module utils
 */

/**
 * Formats a number as EUR currency.
 * @param {number} value - The value to format.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) return '€0';
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formats a number as a percentage.
 * @param {number} value - The value to format.
 * @returns {string} Formatted percentage string.
 */
export function formatPercentage(value) {
    if (typeof value !== 'number' || isNaN(value)) return '0%';
    return new Intl.NumberFormat('de-DE', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value / 100);
}

/**
 * Formats a date from start date and month offset.
 * @param {number} startMonth - Start month index (0-11).
 * @param {number} startYear - Start year.
 * @param {number} monthOffset - Number of months to add.
 * @returns {string} Formatted date string (e.g., "Jan 2025").
 */
export function formatDate(startMonth, startYear, monthOffset) {
    const date = new Date(startYear, startMonth, 1);
    date.setMonth(date.getMonth() + monthOffset);
    return date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
}

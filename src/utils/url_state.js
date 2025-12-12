/**
 * Serializes the current input values into a URL query string.
 * @param {Object} inputs - Map of input elements (e.g. { purchasePrice: <input>, ... }).
 * @returns {string} The query string starting with '?' (e.g. "?purchasePrice=300000").
 */
export function serializeState(inputs) {
    const params = new URLSearchParams();

    Object.entries(inputs).forEach(([key, element]) => {
        if (!element) return;

        if (element.type === 'checkbox') {
            params.set(key, element.checked ? 'true' : 'false');
        } else if (element.tagName === 'SELECT') {
            params.set(key, element.value);
        } else {
            // For number/text inputs
            params.set(key, element.value);
        }
    });

    // Also capture the active tab if possible, though currently inputs doesn't track tab state directly.
    // We can infer mode from the 'isOptimizationMode' flag but that's derived.
    // For now, let's stick to input values. 
    // Wait, the user might want to share the "Optimization" view specifically.
    // Let's check for active tab in main.js and pass it, or just rely on inputs.
    // If we rely on inputs, restoring them restores the values, but not necessarily the active tab.
    // Adding activeTab support would be nice. Let's add an optional 'extraParams' argument.

    return params.toString();
}

/**
 * Deserializes the URL query string into a state object.
 * @param {string} queryString - The window.location.search string.
 * @returns {Object|null} Map of key-value pairs, or null if empty.
 */
export function deserializeState(queryString) {
    if (!queryString) return null;

    const params = new URLSearchParams(queryString);
    const state = {};

    // Check if we have at least one valid key to avoid noise
    if (params.toString().length === 0) return null;

    for (const [key, value] of params.entries()) {
        state[key] = value;
    }

    return state;
}

/**
 * Applies the deserialized state to the input elements.
 * @param {Object} state - Map of key-value pairs.
 * @param {Object} inputs - Map of input elements.
 */
export function applyStateToInputs(state, inputs) {
    if (!state || !inputs) return;

    Object.entries(state).forEach(([key, value]) => {
        const element = inputs[key];
        if (!element) return;

        if (element.type === 'checkbox') {
            element.checked = value === 'true';
            // Trigger change event for UI updates (like showing tax fields)
            element.dispatchEvent(new Event('change'));
        } else {
            element.value = value;
            // Trigger input event for any listeners (debounced calcs)
            element.dispatchEvent(new Event('input'));
        }
    });
}

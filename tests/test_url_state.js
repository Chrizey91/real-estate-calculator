
import { serializeState, deserializeState } from '../src/utils/url_state.js';

console.log("Running Test: URL State Logic...");

// Mock inputs
const inputs = {
    price: { value: "300000", type: "number" },
    rent: { value: "1500", type: "number" },
    tax: { value: "true", type: "checkbox", checked: true },
    noTax: { value: "false", type: "checkbox", checked: false },
    city: { value: "Berlin", tagName: "SELECT" }
};

// 1. Serialize
const queryString = serializeState(inputs);
console.log(`Serialized Query: ${queryString}`);

// Expected: price=300000&rent=1500&tax=true&noTax=false&city=Berlin
if (!queryString.includes("price=300000") || !queryString.includes("tax=true")) {
    console.error("FAILURE: Serialization failed.");
    process.exit(1);
}

// 2. Deserialize
const deserialized = deserializeState(queryString);
console.log("Deserialized State:", deserialized);

if (deserialized.price !== "300000") {
    console.error(`FAILURE: Deserialized price mismatch. Got ${deserialized.price}`);
    process.exit(1);
}

if (deserialized.tax !== "true") {
    console.error(`FAILURE: Deserialized tax mismatch. Got ${deserialized.tax}`);
    process.exit(1);
}

console.log("SUCCESS: URL State Logic verified.");

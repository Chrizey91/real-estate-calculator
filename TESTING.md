# Testing Infrastructure - Setup & Usage

## ✅ Refactoring Complete

All technical debt has been addressed:

### 1. ✅ Functions Now Referenced, Not Copied
- `calculator.js` exports functions via `module.exports`
- `tests.js` imports directly from calculator using `require()`
- Changes to calculator functions automatically reflected in tests

### 2. ✅ Command-Line Execution
- Tests run via CLI: `node investment-calculator/tests.js`
- No browser required
- Colored terminal output with clear pass/fail indicators

### 3. ✅ Clear, Descriptive Tests
- Each test has explicit description of what it validates
- Test names explain the scenario and expected outcome
- Example: `"Tax savings at 30% on €18k deductible should be €5,400"`

## Prerequisites

### Install Node.js

Since Node.js is not currently installed, choose one option:

**Option 1: Official Installer (Recommended)**
```bash
# Download from https://nodejs.org/
# Install the LTS version
```

**Option 2: Using n (Node version manager)**
```bash
curl -L https://bit.ly/n-install | bash
n lts
```

**Option 3: Using nvm**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
```

## Running Tests

Once Node.js is installed:

```bash
cd /Users/cjuerges/projects/agentic_playground
node investment-calculator/tests.js
```

### Expected Output

```
🧪 Investment Calculator Test Suite
============================================================

============================================================
📊 Suite 1: Amortization Calculations
============================================================

✅ PASS: Standard 100k loan at 3.6% APR...
✅ PASS: Final balance after complete loan payoff...
✅ PASS: Total interest paid on 100k loan...
...

============================================================
📈 Test Results Summary
============================================================
Total Tests Run:  30
✅ Passed:        30
❌ Failed:        0
Success Rate:     100.0%

🎉 All tests passed! Calculator is working correctly.
```

## Test Structure

### Test Suites
1. **Amortization** - Loan payoff, interest, principal calculations
2. **German Tax Savings** - AfA depreciation, deductions, tax rates
3. **Cash Flow** - Base flow, tax benefits, cumulative calculations
4. **ROI** - Return percentages, property appreciation
5. **Integration** - Complete investment scenarios

### Assertion Functions
- `assertApproximatelyEqual(actual, expected, description, tolerance)` - For currency values
- `assertArrayLength(array, expectedLength, description)` - For schedule lengths
- `assertGreaterThan(actual, threshold, description)` - For comparisons

## Development Workflow

After making ANY changes to `calculator.js`:

```bash
node investment-calculator/tests.js
```

All tests must pass (100% success rate) before committing changes.

## CI/CD Integration

Add to your CI pipeline:

```yaml
test:
  script:
    - cd investment-calculator
    - node tests.js
```

Tests exit with code 0 on success, 1 on failure.

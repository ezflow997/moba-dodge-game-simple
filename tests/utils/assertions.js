/**
 * Test Assertion Library
 * Provides common assertion functions for game tests
 */

export class TestAssertions {
  /**
   * Assert that two values are equal
   */
  static assertEquals(expected, actual, message = '') {
    if (expected !== actual) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected: ${JSON.stringify(expected)}\n` +
        `Got: ${JSON.stringify(actual)}`
      );
    }
  }

  /**
   * Assert that a value is not null or undefined
   */
  static assertNotNull(value, message = '') {
    if (value === null || value === undefined) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected non-null value, got: ${value}`
      );
    }
  }

  /**
   * Assert that a value is within a range
   */
  static assertInRange(value, min, max, message = '') {
    if (value < min || value > max) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected value between ${min} and ${max}, got: ${value}`
      );
    }
  }

  /**
   * Assert that a condition is true
   */
  static assertTrue(condition, message = '') {
    if (!condition) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected true, got: ${condition}`
      );
    }
  }

  /**
   * Assert that a condition is false
   */
  static assertFalse(condition, message = '') {
    if (condition) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected false, got: ${condition}`
      );
    }
  }

  /**
   * Assert that a function throws an error
   */
  static assertThrows(fn, message = '') {
    let threw = false;
    try {
      fn();
    } catch (e) {
      threw = true;
    }
    if (!threw) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected function to throw an error`
      );
    }
  }

  /**
   * Assert that a value is approximately equal to expected (within tolerance)
   */
  static assertApproximate(expected, actual, tolerance = 0.01, message = '') {
    const diff = Math.abs(expected - actual);
    const maxDiff = Math.abs(expected * tolerance);
    
    if (diff > maxDiff) {
      const percentOff = ((diff / expected) * 100).toFixed(2);
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected: ${expected} (±${(tolerance * 100).toFixed(1)}%)\n` +
        `Got: ${actual} (${percentOff}% off)`
      );
    }
  }

  /**
   * Assert that an array contains a specific element
   */
  static assertContains(array, element, message = '') {
    if (!array.includes(element)) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected array to contain: ${JSON.stringify(element)}\n` +
        `Array: ${JSON.stringify(array)}`
      );
    }
  }

  /**
   * Assert that an array has a specific length
   */
  static assertLength(array, expectedLength, message = '') {
    if (array.length !== expectedLength) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected length: ${expectedLength}\n` +
        `Got length: ${array.length}`
      );
    }
  }

  /**
   * Assert that a value is greater than another
   */
  static assertGreaterThan(value, threshold, message = '') {
    if (value <= threshold) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected ${value} to be greater than ${threshold}`
      );
    }
  }

  /**
   * Assert that a value is less than another
   */
  static assertLessThan(value, threshold, message = '') {
    if (value >= threshold) {
      throw new Error(
        `Assertion failed: ${message}\n` +
        `Expected ${value} to be less than ${threshold}`
      );
    }
  }
}

// Export individual assertion functions for convenience
export const {
  assertEquals,
  assertNotNull,
  assertInRange,
  assertTrue,
  assertFalse,
  assertThrows,
  assertApproximate,
  assertContains,
  assertLength,
  assertGreaterThan,
  assertLessThan,
} = TestAssertions;

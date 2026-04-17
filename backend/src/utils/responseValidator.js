/**
 * Get the data type of a value
 * @param {*} val - The value to check
 * @returns {string} - The type name
 */
function getDataType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

/**
 * Validate response against sample response schema
 * Checks if all keys exist in response and data types match
 * @param {*} response - The actual response received from API
 * @param {*} sampleResponse - The sample response DTO to validate against
 * @returns {object} - { valid: boolean, errors: string[], passed: boolean }
 */
function validateResponseSchema(response, sampleResponse) {
  const errors = [];

  // Helper function to recursively validate nested objects
  function validateRecursive(actual, sample, parentPath = '') {
    // If sample is null or undefined, skip validation
    if (sample === null || sample === undefined) {
      return;
    }

    // If sample is not an object, just check type
    if (typeof sample !== 'object' || Array.isArray(sample)) {
      const sampleType = getDataType(sample);
      const actualType = getDataType(actual);

      if (sampleType !== actualType) {
        const path = parentPath || 'root';
        errors.push(
          `Type mismatch at ${path}: expected ${sampleType}, got ${actualType}`
        );
      }
      return;
    }

    // Sample is a regular object
    for (const key in sample) {
      if (!sample.hasOwnProperty(key)) continue;

      const path = parentPath ? `${parentPath}.${key}` : key;

      // Check if key exists in actual response
      if (!(key in actual)) {
        errors.push(`Missing key: ${path}`);
        continue;
      }

      const sampleValue = sample[key];
      const actualValue = actual[key];

      // If sample value is an object, recurse
      if (typeof sampleValue === 'object' && sampleValue !== null && !Array.isArray(sampleValue)) {
        // If actual is not an object, type mismatch
        if (typeof actualValue !== 'object' || actualValue === null || Array.isArray(actualValue)) {
          errors.push(
            `Type mismatch at ${path}: expected object, got ${getDataType(actualValue)}`
          );
          continue;
        }
        validateRecursive(actualValue, sampleValue, path);
      } else if (Array.isArray(sampleValue)) {
        // For arrays, check if actual is array and validate first element if it exists
        if (!Array.isArray(actualValue)) {
          errors.push(
            `Type mismatch at ${path}: expected array, got ${getDataType(actualValue)}`
          );
          continue;
        }

        // If sample array has elements, validate array element structure
        if (sampleValue.length > 0 && actualValue.length > 0) {
          const sampleElement = sampleValue[0];
          const actualElement = actualValue[0];

          if (typeof sampleElement === 'object' && sampleElement !== null) {
            validateRecursive(actualElement, sampleElement, `${path}[0]`);
          } else {
            const sampleElemType = getDataType(sampleElement);
            const actualElemType = getDataType(actualElement);
            if (sampleElemType !== actualElemType) {
              errors.push(
                `Type mismatch at ${path}[0]: expected ${sampleElemType}, got ${actualElemType}`
              );
            }
          }
        }
      } else {
        // Primitive value - check type
        const sampleType = getDataType(sampleValue);
        const actualType = getDataType(actualValue);

        if (sampleType !== actualType) {
          errors.push(
            `Type mismatch at ${path}: expected ${sampleType}, got ${actualType}`
          );
        }
      }
    }
  }

  // Start validation
  validateRecursive(response, sampleResponse);

  return {
    valid: errors.length === 0,
    errors,
    passed: errors.length === 0,
  };
}

module.exports = {
  validateResponseSchema,
  getDataType,
};

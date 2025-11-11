/**
 * // Shared automation error types so page objects can fail with intent-specific messages.
 * Consider extending the base Error class with metadata (selector, action, retries, etc.).
 */
class BaseAutomationError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ElementNotFoundError extends BaseAutomationError {}

class AssertionError extends BaseAutomationError {}

class TimeoutError extends BaseAutomationError {}

module.exports = {
  BaseAutomationError,
  ElementNotFoundError,
  AssertionError,
  TimeoutError,
};

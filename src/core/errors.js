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

/** Raised when a locator or business element cannot be located on the page. */
class ElementNotFoundError extends BaseAutomationError {}

/** Raised when a custom validation fails (distinct from Playwright expect failures). */
class AssertionError extends BaseAutomationError {}

/** Raised when a wait helper gives up after the configured timeout. */
class TimeoutError extends BaseAutomationError {}

module.exports = {
  BaseAutomationError,
  ElementNotFoundError,
  AssertionError,
  TimeoutError,
};

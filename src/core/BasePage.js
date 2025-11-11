/**
 * BasePage should house all cross-cutting helpers shared by concrete POMs.
 * TODO: wire lightweight logging, retry helpers, and wait utilities once ready.
 */
const { expect } = require('@playwright/test');
const { createLogger } = require('./logger');
const { waitVisible, waitEnabled, waitForUrlContains } = require('./waits');


class BasePage {
  /**
   * Shared base constructor wires the Playwright page, scoped logger, and a sane default timeout
   * so subclasses can focus on business interactions instead of plumbing.
   */
  constructor(page, logger) {
    this.page = page;
    this.logger = logger || createLogger(this.constructor.name);
    this.defaultTimeout = 15000;
  }

  /**
   * Normalizes any selector input (string, Locator, etc.) to a Locator instance for consistency.
   */
  locator(target) {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }

  /**
   * Navigates to a URL with optional expectations (URL fragment, title match) to confirm arrival.
   */
  async goto(url, options = {}) {
    const gotoOptions = options.gotoOptions || { waitUntil: 'domcontentloaded' };
    await this.page.goto(url, gotoOptions);
    if (options.waitForUrlContains) {
      await waitForUrlContains(this.page, options.waitForUrlContains, options.timeout || this.defaultTimeout);
    }
    if (options.expectTitle) {
      await expect(this.page).toHaveTitle(options.expectTitle, { timeout: options.timeout || this.defaultTimeout });
    }
  }

  /**
   * Clicks a locator with visibility/enabled guards and a lightweight retry loop for flakiness.
   */
  async click(target, options = {}) {
    const locator = this.locator(target);
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries ?? 1;
    const retryDelay = options.retryDelay ?? 250;

    const action = async () => {
      await waitVisible(locator, timeout);
      await waitEnabled(this.page, locator, timeout);
      await locator.click({
        timeout,
        ...(options.clickOptions || {}),
      });
    };

    await this.#withRetry(action, retries, retryDelay);
  }

  /**
   * Retries the supplied async action a limited number of times, logging every retry for traceability.
   */
  async #withRetry(action, retries = 1, delay = 200) {
    let attempts = 0;
    while (attempts <= retries) {
      try {
        return await action();
      } catch (error) {
        attempts += 1;
        if (attempts > retries) {
          throw error;
        }
        this.logger.warn('Retrying flaky action', { attempts, retries, error: error.message });
        if (delay) {
          await this.page.waitForTimeout(delay);
        }
      }
    }
    return undefined;
  }

  /**
   * Fills a field after confirming it is visible; accepts optional Playwright fill options.
   */
  async fill(target, value, options = {}) {
    const locator = this.locator(target);
    const timeout = options.timeout || this.defaultTimeout;
    await waitVisible(locator, timeout);
    await locator.fill(value, {
      timeout,
      ...(options.fillOptions || {}),
    });
  }

  /**
   * Returns trimmed text content for any locator, throwing if the element never becomes visible.
   */
  async getText(target, options = {}) {
    const locator = this.locator(target);
    await waitVisible(locator, options.timeout || this.defaultTimeout);
    const content = await locator.textContent();
    return content?.trim() || '';
  }

  /**
   * Utility wait that ensures a locator is visible before handing it back to callers.
   */
  async waitForVisible(target, timeout) {
    const locator = this.locator(target);
    await waitVisible(locator, timeout || this.defaultTimeout);
    return locator;
  }

  /**
   * Waits until the locator is both attached and enabled; useful for buttons disabled via JS.
   */
  async waitForEnabled(target, timeout) {
    const locator = this.locator(target);
    await waitEnabled(this.page, locator, timeout || this.defaultTimeout);
    return locator;
  }

  /**
   * Blocks until the current URL contains the provided fragment (case-insensitive).
   */
  async waitForUrlContains(fragment, timeout) {
    await waitForUrlContains(this.page, fragment, timeout || this.defaultTimeout);
  }

  /**
   * Thin wrapper around Playwright's load-state wait so callers inherit the same default timeout.
   */
  async waitForLoadState(state = 'domcontentloaded', timeout) {
    await this.page.waitForLoadState(state, { timeout: timeout || this.defaultTimeout });
  }
}
module.exports = { BasePage };

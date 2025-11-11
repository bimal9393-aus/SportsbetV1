/**
 * BasePage should house all cross-cutting helpers shared by concrete POMs.
 * TODO: wire lightweight logging, retry helpers, and wait utilities once ready.
 */
const { expect } = require('@playwright/test');
const { createLogger } = require('./logger');
const { waitVisible, waitEnabled, waitForUrlContains } = require('./waits');


class BasePage {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger || createLogger(this.constructor.name);
    this.defaultTimeout = 15000;
  }


  locator(target) {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }


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
async fill(target, value, options = {}) {
    const locator = this.locator(target);
    const timeout = options.timeout || this.defaultTimeout;
    await waitVisible(locator, timeout);
    await locator.fill(value, {
      timeout,
      ...(options.fillOptions || {}),
    });
  }

  async getText(target, options = {}) {
    const locator = this.locator(target);
    await waitVisible(locator, options.timeout || this.defaultTimeout);
    const content = await locator.textContent();
    return content?.trim() || '';
  }

  async waitForVisible(target, timeout) {
    const locator = this.locator(target);
    await waitVisible(locator, timeout || this.defaultTimeout);
    return locator;
  }

  async waitForEnabled(target, timeout) {
    const locator = this.locator(target);
    await waitEnabled(this.page, locator, timeout || this.defaultTimeout);
    return locator;
  }

  async waitForUrlContains(fragment, timeout) {
    await waitForUrlContains(this.page, fragment, timeout || this.defaultTimeout);
  }

  async waitForLoadState(state = 'domcontentloaded', timeout) {
    await this.page.waitForLoadState(state, { timeout: timeout || this.defaultTimeout });
  }

}
module.exports = { BasePage };


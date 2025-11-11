const { expect } = require('@playwright/test');
const { BasePage } = require('../core/BasePage');
const { ElementNotFoundError, AssertionError, TimeoutError } = require('../core/errors');

class BetSlipCart extends BasePage {
  constructor(page, logger) {
    super(page, logger);
    this.selectors = {
      trigger: 'text="Bet Slip"',
      panel: '[data-automation-id="betslip-scrollable-content"]',
      betRunnerName: '[data-automation-id="betslip-bet-title"]',
      betMarketToggleGroup: '[data-automation-id="betslip-bet-leg-type-toggle"]',
      betMarketToggleButton: '[data-automation-id^="betslip-bet-leg-type-toggle-"]',
      betOdds: '[data-automation-id="betslip-bet-odds"]',
      emptyState: 'text=Your Bet Slip is Empty',
    };
  }

  async openBetSlip() {
    // Ensure the bet slip drawer is visible before reading data.
    const panel = this.page.locator(this.selectors.panel);
    if (!(await panel.isVisible())) {
      await this.click(this.selectors.trigger);
    }
    await this.waitForVisible(panel);
  }

  async verifyBetsAdded(expectedBets = []) {
    // Cross-checks supplied bets against what the slip currently shows.
    if (!expectedBets.length) {
      throw new AssertionError('No expected bets supplied for verification.');
    }

    await this.#ensureSlipReady();
    const betRows = await this.#captureBetRows();
    const usedIndices = new Set();

    for (const expected of expectedBets) {
      const matchIndex = betRows.findIndex((row, index) => {
        if (usedIndices.has(index)) return false;
        const runnerMatch = this.#normalize(row.runner).includes(this.#normalize(expected.runner));
        const betTypeMatch = expected.betType
          ? this.#normalize(row.betType).includes(this.#normalize(expected.betType))
          : true;
        return runnerMatch && betTypeMatch;
      });

      if (matchIndex === -1) {
        throw new ElementNotFoundError(
          `Runner "${expected.runner}"${expected.betType ? ` (${expected.betType})` : ''} not found in bet slip`
        );
      }

      usedIndices.add(matchIndex);
      const actual = betRows[matchIndex];
      this.#assertOddsMatch(expected, actual);
      this.#assertBetTypeMatch(expected, actual);
      this.logger.info('Bet verified', {
        runner: actual.runner,
        odds: actual.odds,
        actualBetType: actual.betType,
        expectedBetType: expected.betType || 'Not specified',
      });
    }
  }

  async getBetSummary() {
    // Returns raw bet rows for reporting/debug purposes.
    await this.#ensureSlipReady();
    return this.#captureBetRows();
  }

  async #ensureSlipReady() {
    // Opens slip, blocks on initial odds, and fails fast if empty.
    await this.openBetSlip();
    const emptyVisible = await this.page.locator(this.selectors.emptyState).isVisible().catch(() => false);
    if (emptyVisible) {
      throw new TimeoutError('Bet slip is empty. Ensure bets are placed before verification.');
    }
    const firstRunner = this.page.locator(this.selectors.betRunnerName).first();
    await firstRunner.waitFor({ state: 'visible', timeout: this.defaultTimeout }).catch(() => {
      throw new TimeoutError('Bet slip did not render any runners within the allotted time.');
    });
  }

  async #captureBetRows() {
    // Harvest runner/odds/bet type info row-by-row.
    const runnerLocator = this.page.locator(this.selectors.betRunnerName);
    const oddsLocator = this.page.locator(this.selectors.betOdds);
    const marketToggle = this.page.locator(this.selectors.betMarketToggleGroup);

    const runners = (await runnerLocator.allTextContents()).map((text) => text.trim()).filter(Boolean);
    const oddsValues = (await oddsLocator.allTextContents()).map((text) => text.trim());
    const togglesCount = await marketToggle.count();
    const togglesPerRow = runners.length ? Math.max(1, Math.floor(togglesCount / runners.length)) : 1;

    return Promise.all(
      runners.map(async (runner, index) => {
        let odds = oddsValues[index];
        if (!odds) {
          const oddsHandle = oddsLocator.nth(index);
          if ((await oddsHandle.count()) > 0) {
            odds = (await oddsHandle.textContent())?.trim() || '';
          } else {
            odds = '';
          }
        }
        const betType = await this.#extractBetTypeForRow(index, togglesPerRow, togglesCount);
        return { runner, odds, betType };
      })
    );
  }

  async #extractBetTypeForRow(rowIndex, togglesPerRow, togglesCount) {
    // Finds the selected market toggle for a row.
    const toggleLocator = this.page.locator(this.selectors.betMarketToggleGroup);
    for (let offset = 0; offset < togglesPerRow; offset += 1) {
      const toggleIndex = rowIndex * togglesPerRow + offset;
      if (toggleIndex >= togglesCount) break;
      const toggle = toggleLocator.nth(toggleIndex);
      const selectedOption = toggle.locator(`[class*="selectedOption"] ${this.selectors.betMarketToggleButton}`);
      if ((await selectedOption.count()) > 0) {
        return (await selectedOption.first().textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
      const pressedButton = toggle.locator(`${this.selectors.betMarketToggleButton}[aria-pressed="true"]`);
      if ((await pressedButton.count()) > 0) {
        return (await pressedButton.first().textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
      const highlightedButton = toggle.locator(`${this.selectors.betMarketToggleButton}.selected`);
      if ((await highlightedButton.count()) > 0) {
        return (await highlightedButton.first().textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
      const firstButton = toggle.locator(this.selectors.betMarketToggleButton).first();
      if ((await firstButton.count()) > 0) {
        return (await firstButton.textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
    }
    const fallbackToggle = toggleLocator.nth(rowIndex * togglesPerRow);
    if ((await fallbackToggle.count()) > 0) {
      const selectedFallback = fallbackToggle.locator(
        `[class*="selectedOption"] ${this.selectors.betMarketToggleButton}, ${this.selectors.betMarketToggleButton}[aria-pressed="true"], ${this.selectors.betMarketToggleButton}.selected`
      );
      if ((await selectedFallback.count()) > 0) {
        return (await selectedFallback.first().textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
      const fallbackButton = fallbackToggle.locator(this.selectors.betMarketToggleButton).first();
      if ((await fallbackButton.count()) > 0) {
        return (await fallbackButton.textContent())?.replace(/\s+/g, ' ').trim() || '';
      }
    }
    return '';
  }

  #normalize(value) {
    // Lowercase + collapse whitespace for fuzzy comparisons.
    return value?.replace(/\s+/g, ' ').trim().toLowerCase() || '';
  }

  #sanitizeOdds(value) {
    // Strip non-numerics so odds can be compared consistently.
    return value?.replace(/[^0-9.]/g, '') || '';
  }

  #assertOddsMatch(expected, actual) {
    // Compare odds using sanitized numeric format when available.
    if (!expected.odds) {
      return;
    }
    const normalizedActual = this.#sanitizeOdds(actual.odds);
    const normalizedExpected = this.#sanitizeOdds(expected.odds);
    if (normalizedActual && normalizedExpected) {
      expect(normalizedActual).toBe(normalizedExpected);
    } else {
      expect(actual.odds).toBe(expected.odds);
    }
  }

  #assertBetTypeMatch(expected, actual) {
    if (!expected.betType) {
      return;
    }
    const normalizedActual = this.#normalize(actual.betType);
    const normalizedExpected = this.#normalize(expected.betType);
    if (!normalizedActual.includes(normalizedExpected)) {
      throw new AssertionError(
        `Expected bet type "${expected.betType}" but found "${actual.betType || 'N/A'}"`
      );
    }
  }
}

module.exports = { BetSlipCart };

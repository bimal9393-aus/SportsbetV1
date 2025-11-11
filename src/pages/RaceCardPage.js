const { BasePage } = require('../core/BasePage');
const { ElementNotFoundError } = require('../core/errors');

class RacecardPage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
    this.selectors = {
      raceCardOutcomeNames: '[data-automation-id="racecard-outcome-name"]',
      raceCardOutcomeCards: '.outcomeCard_f7jc198',
      betSlipTrigger: 'text=Bet Slip',
      winFix: '[data-automation-id$="-0-L-price"]',
      placeFix: '[data-automation-id$="-1-L-price"]',
      eachWayFix: '[data-automation-id$="racecard-outcome-2-L-price"]',
      betSlipClose: '[data-automation-id$="close-isolated-icon"]',
      betSlipPanel: '[data-automation-id="layout-right-panel"]',
      betSlipKeypad: '.keypadContainer_f1j9l3jo',
    };
  }

  async waitForRacecard() {
    // Wait until at least one runner card is rendered.
    const firstCard = this.page.locator(this.selectors.raceCardOutcomeCards).first();
    await this.waitForVisible(firstCard);
  }

  async findHorseCardOrFallback(horseName, fallbackIndex = 0) {
    // Try to match the requested horse; otherwise fall back to index.
    await this.waitForRacecard();
    const cards = this.page.locator(this.selectors.raceCardOutcomeCards);
    const totalCards = await cards.count();

    for (let index = 0; index < totalCards; index += 1) {
      const horseCard = cards.nth(index);
      const nameLocator = horseCard.locator(this.selectors.raceCardOutcomeNames).first();
      if ((await nameLocator.count()) === 0) {
        continue;
      }

      const candidateName = (await nameLocator.textContent())?.trim();
      if (candidateName && candidateName.includes(horseName)) {
        return { horseCard, horseName: candidateName };
      }
    }

    if (fallbackIndex < totalCards) {
      // Use fallback runner if configured index is available.
      const fallbackCard = cards.nth(fallbackIndex);
      const fallbackNameLocator = fallbackCard.locator(this.selectors.raceCardOutcomeNames).first();
      if ((await fallbackNameLocator.count()) === 0) {
        throw new ElementNotFoundError(
          `Fallback runner at index ${fallbackIndex} did not expose a name locator`
        );
      }
      const fallbackName = await fallbackNameLocator.textContent();
      const trimmedFallbackName = fallbackName?.trim() || `Runner ${fallbackIndex + 1}`;
      this.logger.warn('Horse not found, selecting fallback runner', {
        horseName,
        fallbackIndex,
        fallbackRunner: trimmedFallbackName,
      });
      return {
        horseCard: fallbackCard,
        horseName: trimmedFallbackName,
      };
    }

    throw new ElementNotFoundError(
      `Horse "${horseName}" not found and fallback index ${fallbackIndex} is out of range`
    );
  }

  async clickOddsButton(buttonLocator, { expectBetSlip = true } = {}) {
    // Click odds button with visibility/enabled guards and optional slip handling.
    const button = this.locator(buttonLocator);
    await this.waitForVisible(button);
    await this.waitForEnabled(button);
    await button.scrollIntoViewIfNeeded();
    await button.click();

    if (!expectBetSlip) {
      return;
    }

    const appeared = await this.page
      .locator(this.selectors.betSlipPanel)
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(
        () => true,
        () => false
      );

    if (appeared) {
      // Close the slip so subsequent clicks don’t fail due to overlay.
      const closeButton = this.page.locator(this.selectors.betSlipClose);
      await closeButton.click().catch(() => {});
      await this.page.locator(this.selectors.betSlipPanel).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      await this.page.locator(this.selectors.betSlipKeypad).waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    }
  }

  async placeBetsOnCard(horseCard, betTypes = ['win', 'place']) {
    // Iterate bet types, click odds buttons, and capture metadata.
    const buttons = {
      win: horseCard.locator(this.selectors.winFix).first(),
      place: horseCard.locator(this.selectors.placeFix).first(),
      eachWay: horseCard.locator(this.selectors.eachWayFix).first(),
    };

    const placedBets = [];
    let closeSlip = true;

    for (const betType of betTypes) {
      const button = buttons[betType];
      if (!button || (await button.count()) === 0) {
        // Some markets may be unavailable for a runner.
        this.logger.warn('Requested bet type is unavailable', { betType });
        continue;
      }

      await this.clickOddsButton(button, { expectBetSlip: closeSlip });
      closeSlip = false;

      const odds = (await button.textContent())?.trim();
      const runnerName = (
        await horseCard.locator(this.selectors.raceCardOutcomeNames).first().textContent()
      )?.trim();
      this.logger.info('Bet added to slip', {
        runner: runnerName,
        betType: betType === 'eachWay' ? 'Each Way' : betType.charAt(0).toUpperCase() + betType.slice(1),
        odds,
      });

      placedBets.push({
        runner: runnerName,
        betType: betType === 'eachWay' ? 'Each Way' : betType.charAt(0).toUpperCase() + betType.slice(1),
        odds,
      });
    }

    return placedBets;
  }
}

module.exports = { RacecardPage };

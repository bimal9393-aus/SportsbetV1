// Central factory for lazily-instantiated page objects.
const { HomePage } = require('../pages/HomePage');
const { RacecardPage } = require('../pages/RaceCardPage');
const { BetSlipCart } = require('../pages/BetSlipCart');

class PageObjectManager {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
    this.cache = {};
  }

  /**
   * Prefixes the logger scope with the page-object name so log lines remain contextual.
   */
  #childLogger(name) {
    return this.logger?.child ? this.logger.child(name) : this.logger;
  }

  /** Lazily instantiates the HomePage and memoizes it for the duration of the test. */
  get loginPage() {
    if (!this.cache.loginPage) {
      this.cache.loginPage = new HomePage(this.page, this.#childLogger('HomePage'));
    }
    return this.cache.loginPage;
  }

  /** Returns a cached RacecardPage, wiring a child logger for readable traces. */
  get racecardPage() {
    if (!this.cache.racecardPage) {
      this.cache.racecardPage = new RacecardPage(this.page, this.#childLogger('RacecardPage'));
    }
    return this.cache.racecardPage;
  }

  /** Provides the BetSlipCart POM (created once) so verifications share stateful helpers. */
  get betSlipCart() {
    if (!this.cache.betSlipCart) {
      this.cache.betSlipCart = new BetSlipCart(this.page, this.#childLogger('BetSlipCart'));
    }
    return this.cache.betSlipCart;
  }

  // Legacy getter helpers for existing tests if needed.
  getLoginPage() {
    return this.loginPage;
  }

  getRacecardPage() {
    return this.racecardPage;
  }

  getBetSlipCart() {
    return this.betSlipCart;
  }
}

module.exports = { PageObjectManager };

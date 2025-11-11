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

  #childLogger(name) {
    return this.logger?.child ? this.logger.child(name) : this.logger;
  }

  get loginPage() {
    if (!this.cache.loginPage) {
      this.cache.loginPage = new HomePage(this.page, this.#childLogger('HomePage'));
    }
    return this.cache.loginPage;
  }

  get racecardPage() {
    if (!this.cache.racecardPage) {
      this.cache.racecardPage = new RacecardPage(this.page, this.#childLogger('RacecardPage'));
    }
    return this.cache.racecardPage;
  }

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

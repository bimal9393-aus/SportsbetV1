const { BasePage } = require('../core/BasePage');

/**
 * HomePage POM should orchestrate carousel interactions + landing navigation logic.
 * Sections below outline where to add locators/actions/assertions/edge-case handling.
 */
class HomePage extends BasePage {
  constructor(page, logger) {
    super(page, logger);
    this.homeUrl = 'https://www.sportsbet.com.au';
    this.homeTitle = 'Best Online Horse Racing and Sports Betting | Sportsbet';
    this.selectors = {
      loginButton: '[data-automation-id="login-button-label"]:has-text("Log In")',
      userName: '#username',
      password: "[type='password']",
      firstRacecard: '[data-automation-id="carousel-1-cell-1-event-title"]',
    };
  }

  async goTo(url = this.homeUrl) {
    await this.goto(url, {
      expectTitle: this.homeTitle,
      waitForUrlContains: 'sportsbet.com.au',
    });
  }

  // Optional helper if logging in becomes necessary.
  async login(username, password) {
    await this.fill(this.selectors.userName, username);
    await this.fill(this.selectors.password, password);
    await this.click(this.selectors.loginButton);
  }

  async openFirstRaceCard(index = 1) {
    const raceCard = this.page.locator(this.selectors.firstRacecard).nth(index);
    await this.waitForVisible(raceCard);
    await raceCard.click();
  }
}

module.exports = { HomePage };

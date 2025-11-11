const base = require('@playwright/test');
const { PageObjectManager } = require('../core/PageObjectManager');
const { createLogger } = require('../core/logger');

const rootLogger = createLogger('e2e');

const test = base.test.extend({
  pom: async ({ page }, use, testInfo) => {
    // Each test receives its own PageObjectManager wired with a child logger for clean traces.
    const scopedLogger = rootLogger.child(testInfo.title);
    const pom = new PageObjectManager(page, scopedLogger);
    await use(pom);
  },
});

module.exports = {
  test,
  expect: base.expect,
};

const { TimeoutError } = require('./errors');

// Ensure locator is visible before interacting.

async function waitVisible(locator, timeout = 15000) {
  await locator.waitFor({ state: 'visible', timeout });
  return locator;
}

// Poll until the element becomes enabled; fails with TimeoutError otherwise.
async function waitEnabled(page, locator, timeout = 15000, pollInterval = 200) {
  const deadline = Date.now() + timeout;
  await locator.waitFor({ state: 'attached', timeout });
  await locator.waitFor({ state: 'visible', timeout });

  while (Date.now() < deadline) {
    const enabled = await locator.isEnabled().catch(() => false);
    if (enabled) {
      return locator;
    }
    await page.waitForTimeout(pollInterval);
  }

  throw new TimeoutError('Locator did not become enabled within the allotted time.');
}
// Wait for the current URL to contain the expected fragment.
async function waitForUrlContains(page, expectedFragment, timeout = 15000) {
  await page.waitForURL(
    (url) => url.toString().toLowerCase().includes(expectedFragment.toLowerCase()),
    { timeout }
  );
}

module.exports = {
  waitVisible,
  waitEnabled,
  waitForUrlContains,
};

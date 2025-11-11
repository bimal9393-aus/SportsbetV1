const { allure } = require('allure-playwright');
const { test } = require('../../fixtures/test-fixture');
const scenarios = require('./data/placebettestdata.json'); // Test data drives horse selection.
const { setLogSink } = require('../../core/logger');
const { ElementNotFoundError, AssertionError, TimeoutError } = require('../../core/errors');

test.describe('Bet slip journey', () => {
  test.describe.configure({ timeout: 15000 });

  scenarios.forEach((dataSet) => {
    test(`${dataSet.name} › Adds Win + Place bets and verifies bet slip contents`, async ({ page, pom }, testInfo) => {
      const loginPage = pom.loginPage;
      const racecardPage = pom.racecardPage;
      const betSlipCart = pom.betSlipCart;
      const { url, horseName, fallbackIndex } = dataSet;
      const attachScreenshot = async (name) => {
        const shot = await page.screenshot({ fullPage: true });
        await allure.attachment(name, shot, 'image/png');
      };

      // High-level journey broken into readable steps for Playwright UI.
      const logEntries = [];
      const previousSink = setLogSink((entry) => {
        logEntries.push(entry);
      });

      try {
      await test.step('Navigate to sportsbet.com.au @ 420px', async () => {
        await allure.step('Navigate to sportsbet.com.au @ 420px', async () => {
          await loginPage.goTo(url);
          await page.setViewportSize({ width: 420, height: 900 });
          await page.waitForTimeout(500);
          await attachScreenshot('Navigate - actual');
          await allure.step('Navigated successfully to Sportsbet home page', async () => {});
        });
      });

      await test.step("Open first 'Next to Jump' card", async () => {
        await allure.step("Open first 'Next to Jump' card", async () => {
          await loginPage.openFirstRaceCard();
          await page.waitForTimeout(800);
          await attachScreenshot('First card - actual');
          await allure.step("Clicked successfully on the first 'Next to Jump' carousel card", async () => {});
        });
      });

      await test.step('Land on racecard', async () => {
        await allure.step('Land on racecard', async () => {
          await racecardPage.waitForRacecard();
          await attachScreenshot('Racecard - actual');
          await allure.step('Landed on racecard successfully', async () => {});
        });
      });

      const { horseCard } = await racecardPage.findHorseCardOrFallback(horseName, fallbackIndex);

      await test.step('Add two bets for chosen horse', async () => {
        await allure.step('Add two bets for chosen horse', async () => {
          await allure.step(`Chosen horse: ${horseName}`, async () => {});
          const placedBets = await racecardPage.placeBetsOnCard(horseCard, ['win', 'place']);
          await allure.step(`Selected runner successfully: ${placedBets[0]?.runner || 'Unknown runner'}`, async () => {});
          if (placedBets[0]) {
            await allure.step(`Added first bet successfully: ${JSON.stringify(placedBets[0])}`, async () => {});
          }
          if (placedBets[1]) {
            await allure.step(`Added second bet successfully: ${JSON.stringify(placedBets[1])}`, async () => {});
          }

          await test.step('Open Bet Slip and verify bets', async () => {
            await allure.step('Open Bet Slip and verify bets', async () => {
              await betSlipCart.verifyBetsAdded(placedBets);
              await betSlipCart.openBetSlip();
              await page.waitForTimeout(500);
              await attachScreenshot('Bet slip - actual');
              await betSlipCart.getBetSummary();
              if (placedBets[0]) {
                await allure.step(
                  `First bet verified successfully: runner ${placedBets[0].runner} (${placedBets[0].betType} @ ${placedBets[0].odds})`,
                  async () => {}
                );
              }
              if (placedBets[1]) {
                await allure.step(
                  `Second bet verified successfully: runner ${placedBets[1].runner} (${placedBets[1].betType} @ ${placedBets[1].odds})`,
                  async () => {}
                );
              }
              await allure.step('Navigated to Bet Slip successfully', async () => {});
            });
          });
        });
      });
      } catch (error) {
      const failureDetails = {
        name: error?.name || 'Error',
        message: error?.message || 'Unknown error',
        stack: error?.stack,
      };

      let failureType = 'General Error';
      if (error instanceof ElementNotFoundError) {
        failureType = 'ElementNotFoundError';
      } else if (error instanceof AssertionError) {
        failureType = 'AssertionError';
      } else if (error instanceof TimeoutError) {
        failureType = 'TimeoutError';
      }

      await allure.attachment(
        'Failure details',
        Buffer.from(JSON.stringify({ failureType, ...failureDetails }, null, 2), 'utf-8'),
        'application/json'
      );

      if (!page.isClosed()) {
        const failure = await page.screenshot({ fullPage: true });
        await testInfo.attach('Failure screenshot', { body: failure, contentType: 'image/png' });
        await allure.attachment('Failure screenshot', failure, 'image/png');
      }
      throw error;
      } finally {
        if (logEntries.length) {
          await allure.attachment(
            'Execution log',
            Buffer.from(logEntries.map((entry) => entry.line).join('\n'), 'utf-8'),
            'text/plain'
          );
        }
        setLogSink(previousSink);
      }
    });
  });
});

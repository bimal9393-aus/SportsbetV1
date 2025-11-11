# SportsbetChallenge Playwright Suite

End-to-end Playwright tests that automate the “Bet Slip journey” on sportsbet.com.au, including cross-browser validation, Allure reporting, and simple data-driven scenarios defined in `src/tests/e2e/data/placebettestdata.json`.

---

## Prerequisites

- Node.js 18+ (tested on 20.x).  
- npm 8+.  
- Git installed and able to access the GitHub repo.  
- Java Runtime Environment (JRE 11+) for the Allure CLI.  
- macOS/Linux/WSL (Windows PowerShell works but `run-tests.sh` assumes a Unix shell).  

Install Playwright browsers once after cloning:

```bash
npm install
npx playwright install --with-deps
```

---

## Quick Start

```bash
git clone https://github.com/bimal9393-aus/SportsbetV1.git`
cd SportsbetChallenge
npm install
./run-tests.sh        # runs tests (Chromium/Firefox/WebKit) + opens Allure report
```

### TL;DR local run (exact repo + commands)

1. Clone the assessment repo: `git clone https://github.com/bimal9393-aus/SportsbetV1.git`
2. Open a new terminal/command prompt on your machine.
3. Change into the cloned folder (update the path to match where you saved it), e.g.:
   ```bash
   cd /Users/<your-user>/Documents/GitHub_Playwright/SportsbetV1
   ```
4. Execute the runner script from the repo root:
   ```bash
   ./run-tests.sh
   ```
   The script cleans old artifacts, runs Playwright in all browsers, and opens the Allure report automatically.

Key scripts (`package.json`):

| Script | Description |
| ------ | ----------- |
| `npm run test` | Playwright tests across all configured browsers. |
| `npm run test:e2e` | Playwright tests scoped to `src/tests/e2e`. |
| `npm run test:allure` | Same as `npm run test` then generates/opens Allure. |
| `npm run allure:generate` / `npm run allure:open` | Build or view Allure report manually. |

`run-tests.sh` wraps the whole workflow (clean, test, report) and always opens the latest Allure UI even on failure.

---

## Configuration & Data

- `playwright.config.js`  
  - Projects: Chromium, Firefox, WebKit, 420×800 viewport, trace/video on failure.  
  - Reporters: Line + HTML + Allure (detail=false).  

- `src/tests/e2e/data/placebettestdata.json`  
  - Array of scenarios (`name`, `url`, `horseName`, `fallbackIndex`).  
  - Add new entries to run the same flow against more horses/races.

- `run-tests.sh`  
  - Cleans generated folders, installs deps if missing, runs tests, opens Allure.
   - Before each run, update `horseName` to a runner you can currently see on sportsbet.com.au. Names are free text, so keep them aligned with what the UI shows (e.g., `"1. Charlie Mes"`).
  - Set `fallbackIndex` (0-based) to a runner position you know will exist in case the preferred horse is scratched or missing. Example: `0` targets the first runner card, `3` targets the fourth.
  - Save the file and rerun `./run-tests.sh`; every dataset in this JSON executes once per browser project, so keep the list focused on active races.

---

## Assumptions

1. Sportsbet’s UI structure (selectors, carousel order, bet slip layout) stays consistent enough for locator-based POMs to function.  
2. `data-automation-id` attributes remain stable even if marketing tweaks copy/classes; ~80% of locators intentionally target those IDs to minimize churn.  
3. A handful of selectors still rely on hashed CSS class names such as `.outcomeCard_f7jc198`, assuming those hashes do not rotate between deployments.  
4. Real production content at `https://www.sportsbet.com.au` is reachable at run time; every dataset/helper uses that URL directly.  
5. The provided horse names/fallback indices exist in the race card when tests run; timezone/race schedule drift is minimal and `findHorseCardOrFallback` can always fall back to a valid index.  
6. Allure-driven reporting is available locally and in CI; the CLI + Java runtime must be installed because `run-tests.sh` always calls `npm run allure:open`.  
7. Chrom(ium), Firefox, and WebKit browsers are installed via Playwright (`playwright.config.js` enables all three).  
8. Suites currently target local/manual execution; on CI the specs are skipped via `shouldSkipOnCi` (historically due to GitHub Actions hitting production).  

---

## Problems Encountered & Potential Fixes

| Issue | Notes & Future Work |
| ----- | ------------------- |
| Flaky “Query locator…count” steps cluttering reports | Mitigated via `detail:false` and custom `allure.step` calls, but long term we should wrap repetitive locator loops with custom helpers or use Playwright’s tracing to keep reports concise. |
| Network/timeouts in live prod site | Added fallback index logic + rich logging. Could introduce mock APIs or record/playback to stabilise runs offline. |
| Allure CLI warnings (DEP0190) & auto-open after failure | Implemented `scripts/allure-runner.js` and `run-tests.sh` to always generate/open reports. For CI, switch to `allure serve` artifacts without GUI. |
| Git push conflicts due to generated files | `.gitignore` excludes Playwright/Allure outputs. Continue to clean before commits. |
| CI coverage currently zero (tests skip when `CI` env is set) | Introduce a dedicated toggle like `SKIP_LIVE=true` plus mock data or recorded API traffic so CI can execute deterministically without hitting production (`src/tests/e2e/betSlip.spec.js`). |
| Fragile selectors that depend on hashed classes (e.g., `.outcomeCard_f7jc198`) | Replace remaining hashed-class selectors with `data-automation-id` hooks or negotiated test-only attributes to avoid breakage when CSS bundles change (`src/pages/RaceCardPage.js`). |
| Race card data loads asynchronously after carousel click | Added waits for the first `racecard-outcome-name`; with more time we can block on specific API calls (`page.waitForResponse`) for airtight stability. |
| Bet slip animations left UI elements “visible but not clickable” | Guarded with explicit `waitFor({ state })` calls today; longer term we should wrap these flows into helpers (e.g., `openBetSlipForHorse`) with retries to remove duplication. |

If given more time:

1. Add retry logic and resilient waits to `BasePage` helpers (`clickSafe`, `fillSafe`, etc.).  
2. Implement a login fixture and environment-aware config (QA/Staging/Prod).  
3. Add synthetic test data or mock layer to avoid depending on live races.  
4. Integrate CI (GitHub Actions) to run nightly and publish Allure artifacts.  

---

## Scaling Concerns as Suite Grows

1. **Test duration**: Adding more horses × browsers increases runtime exponentially. Consider sharding across workers/CI nodes and allowing selective scenario tags.  
2. **Locator brittleness**: Dynamic racing UI changes may break selectors. Need a shared selector contract or data-test ids; every remaining hashed class should be replaced.  
3. **Data freshness**: Static horse names eventually go stale; add a data service (REST/GraphQL) to pull upcoming races or create mock fixtures. Live odds/cards can disappear mid-test, so mocking or recording traffic will drastically cut flakes.  
4. **Reporting volume**: Allure attachments (screenshots, logs) scale quickly; implement retention policies and artifact pruning since `run-tests.sh` only deletes `allure-results`, not long-lived `allure-report` folders.  
5. **Shared test state**: As more specs are added, shared UI state (e.g., bet slip already open) may bleed between tests. Run each spec with a fresh context, avoid `test.only`, and reset the slip between scenarios.  
6. **Randomised DOM classes**: Any selector that still targets hashed class names will fail as soon as hashes rotate, so enforce attribute-based locators in code review.  

---

## Improvement Ideas for Adoption & Future Tests

1. **POM Enhancements**: Finish the `BasePage` TODO list (selector utilities, retries, logging) so every page object inherits the same resilient primitives.  
2. **Fixtures & Test Data**:  
   - Introduce environment config (dev/stage/prod) via `TestDataLoader`.  
   - Support per-scenario overrides (stakes, bet types, login credentials).  
3. **Domain-specific fixtures**: Extend the shared fixture with journey helpers (e.g., `journeys.placeDoubleBet`) so new tests focus on assertions rather than reimplementing the flow.  
4. **CI/CD Integration**:  
   - GitHub Actions/ Azure DevOps pipeline to run `./run-tests.sh` on push/PR, publish Allure report as artifact.  
   - Provide a sample workflow in-repo plus a headless `npm run allure:generate` path so CI can skip `allure:open` when no GUI exists.  
   - Slack/MS Teams notification on failures with direct link to report & screenshot.  
5. **Parallelization Controls**: Use Playwright’s project-level filtering (`npx playwright test --project=chromium`) and scenario tagging to speed up targeted runs.  
6. **Reusable allure helpers**: Create wrapper functions (e.g., `logSuccessStep(message)`) to reduce duplication and enforce consistent reporting.  
7. **Local/CI profiles**: env-based toggles for headless vs headed, video capture, network mocking.  

---

## Troubleshooting

 
- **Allure CLI errors (missing Java)**: install JRE (`brew install temurin@17`).  
- **Browser launch failures**: run `npx playwright install --with-deps` and ensure you’re not on a locked-down corporate network.  
- **Bet not found**: update `placebettestdata.json` with horses currently available or use fallback indices that exist in the race card.

---



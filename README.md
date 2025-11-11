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
git clone https://github.com/<you>/SportsbetChallenge.git
cd SportsbetChallenge
npm install
./run-tests.sh        # runs tests (Chromium/Firefox/WebKit) + opens Allure report
```

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

---

## Assumptions

1. Sportsbet’s UI structure (selectors, carousel order, bet slip layout) stays consistent enough for locator-based POMs to function.  
2. The provided horse names/fallback indices exist in the race card when tests run; timezone/race schedule drift is minimal.  
3. Allure CLI + Java are available wherever the suite runs (CI and local).  
4. Users running the suite have access to Chrom(ium), Firefox, and WebKit (Playwright handles installing runtimes).  

---

## Problems Encountered & Potential Fixes

| Issue | Notes & Future Work |
| ----- | ------------------- |
| Flaky “Query locator…count” steps cluttering reports | Mitigated via `detail:false` and custom `allure.step` calls, but long term we should wrap repetitive locator loops with custom helpers or use Playwright’s tracing to keep reports concise. |
| Network/timeouts in live prod site | Added fallback index logic + rich logging. Could introduce mock APIs or record/playback to stabilise runs offline. |
| Allure CLI warnings (DEP0190) & auto-open after failure | Implemented `scripts/allure-runner.js` and `run-tests.sh` to always generate/open reports. For CI, switch to `allure serve` artifacts without GUI. |
| Git push conflicts due to generated files | `.gitignore` excludes Playwright/Allure outputs. Continue to clean before commits. |

If given more time:

1. Add retry logic and resilient waits to `BasePage` helpers (`clickSafe`, `fillSafe`, etc.).  
2. Implement a login fixture and environment-aware config (QA/Staging/Prod).  
3. Add synthetic test data or mock layer to avoid depending on live races.  
4. Integrate CI (GitHub Actions) to run nightly and publish Allure artifacts.  

---

## Scaling Concerns as Suite Grows

1. **Test duration**: Adding more horses × browsers increases runtime exponentially. Consider sharding across workers/CI nodes and allowing selective scenario tags.  
2. **Locator brittleness**: Dynamic racing UI changes may break selectors. Need a shared selector contract or data-test ids.  
3. **Data freshness**: Static horse names eventually go stale; add a data service (REST/GraphQL) to pull upcoming races or create mock fixtures.  
4. **Reporting volume**: Allure attachments (screenshots, logs) scale quickly; implement retention policies and artifact pruning.  

---

## Improvement Ideas for Adoption & Future Tests

1. **POM Enhancements**: Finish `BasePage` utility methods, centralize waits/logging, and share helpers across new pages.  
2. **Fixtures & Test Data**:  
   - Introduce environment config (dev/stage/prod) via `TestDataLoader`.  
   - Support per-scenario overrides (stakes, bet types, login credentials).  
3. **CI/CD Integration**:  
   - GitHub Actions/ Azure DevOps pipeline to run `./run-tests.sh` on push/PR, publish Allure report as artifact.  
   - Slack/MS Teams notification on failures with direct link to report & screenshot.  
4. **Parallelization Controls**: Use Playwright’s project-level filtering (`npx playwright test --project=chromium`) and scenario tagging to speed up targeted runs.  
5. **Reusable allure helpers**: Create wrapper functions (e.g., `logSuccessStep(message)`) to reduce duplication and enforce consistent reporting.  
6. **Local/CI profiles**: env-based toggles for headless vs headed, video capture, network mocking.

---

## Troubleshooting

- **`git push` rejected / divergent branches**: run `git fetch origin` + `git pull --rebase origin main`, resolve conflicts, then `git push`.  
- **Allure CLI errors (missing Java)**: install JRE (`brew install temurin@17`).  
- **Browser launch failures**: run `npx playwright install --with-deps` and ensure you’re not on a locked-down corporate network.  
- **Bet not found**: update `placebettestdata.json` with horses currently available or use fallback indices that exist in the race card.

---

Happy testing, and feel free to extend the scenarios or POMs for additional customer journeys! 💥

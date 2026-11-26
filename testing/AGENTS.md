# Test project

- The testing agent owns scenarios and Java tests in this directory. Read site code to understand behavior, but do not edit app code or configuration to fix a test.
- Git is the only source of truth for scenarios. Use one Markdown file per case with a stable ID, preconditions, data, and action/expected-result steps. Put the same ID in the Java test and Allure result. Keep locators out of scenarios.
- Use the shared browser service (Playwright MCP) only for investigation on the local test site; use Playwright Java and TestNG for execution. Never use shared browser profiles, real Google accounts, or production data. Mock third-party services and use isolated contexts.
- **Self-healing rule: when a locator fails, the agent must inspect the live page in the browser via the shared browser service (snapshot the page, find the element by its role/name/label). It must NOT read or search the application source code to find the selector. The page is the source of truth for locators, not the app code.**
- To repair a locator: reproduce the failure, inspect the intended control in the browser, verify its identity and uniqueness, and update the page object. Prefer exact role/name or label; use a stable test ID or scoped XPath when necessary. Rerun the same test and review the diff.
- Rerun the affected test and related cases after a repair. Leave a reviewable diff and report the old and new locator. Never change assertions, approved scenario intent, app behavior, or retries to turn a failure green. Report actual product failures or ambiguous cases instead.

## Project structure

```
testing/
  pom.xml                    Java 17 + TestNG + Playwright + Allure + ZXing
  mvnw.cmd                   Maven Wrapper (no global Maven needed)
  AGENTS.md                  This file
  WORKFLOW.md                Comprehensive workflow (read first)
  README.md                  Setup and run instructions
  scenarios/
    TEMPLATE.md              Template for new scenarios
    QR-001.md                QR download scenario
  src/test/java/website/testing/
    QrDownload.java          Page object (locators + actions)
    QrDownloadTests.java     TestNG test with Allure steps
    StampDashboardPage.java  Stamp page object
    StampGoogleFixture.java  Synthetic Google API mock
    StampEarningsTest.java   Stamp earnings TestNG test
```

## Running tests

- Start website: `npm run dev` (port 3000)
- For Stamp tests: `npm run dev:test` (sets synthetic Google client ID)
- Run all tests: `npm test`
- Run QR tests only: `npm run test:qr`
- Run single class: `cd testing && mvn -Dtest=QrDownloadTests test`
- Run headed: add `-Dheaded=true` to any command
- Generate Allure report: `cd testing && allure generate .\\target\\allure-results --clean -o .\\target\\allure-report`

## Browser investigation service

- Start: `npm run mcp:browser`
- Connect any MCP client to `http://127.0.0.1:8931/mcp`
- Config: `testing/playwright-mcp.jsonc`
- Visible Edge browser by default; add `--headless` for CI

## Self-healing drill (demonstrated)

1. Break a locator in a page object (e.g., change role locator to a non-existent XPath)
2. Run the test — it fails with "waiting for locator"
3. Agent uses shared browser service → snapshot → finds the element by role/name
4. Agent repairs the locator in the page object
5. Agent reruns the test — it passes
6. Verify via `git diff` that only the locator line changed

## Locator repair rules

- Reproduce the failure first (run the test, confirm it fails at the locator)
- Inspect the page via the shared browser service — the page is the source of truth
- Do NOT read or search application source code to find selectors
- Prefer exact role/name or label locators
- Use XPath or CSS only when role/name/label are unavailable
- Never use positional selectors (nth-child, index-based)
- After repair, rerun the affected test and any related tests
- Report old locator → new locator in the summary
- If the control works but the result is wrong → leave test red, report product bug
- Never change assertions, skip tests, or add retries to turn a failure green
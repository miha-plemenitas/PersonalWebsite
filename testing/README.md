# Website test pilot

This module runs Playwright Java and TestNG on Java 17. Local Markdown scenarios in `scenarios/` are the source of truth. Allure records scenario IDs and execution evidence. No Azure service or browser service is used by the Java test suite.

## Quick start

From the repository root, start the website:

```powershell
npm run dev
```

In a second terminal, run all tests:

```powershell
npm test
```

Or run just the QR tests:

```powershell
npm run test:qr
```

Or run a single test class directly:

```powershell
cd testing
.\mvnw.cmd -Dtest=QrDownloadTests test
```

Run in headed mode (visible browser window):

```powershell
cd testing
.\mvnw.cmd -Dtest=QrDownloadTests -Dheaded=true test
```

The Java suite launches its own headless Chromium and connects to `http://127.0.0.1:3000` by default. No browser setup is needed beyond the one-time Chromium install (already done).

## Reports

Surefire writes the JUnit XML under `target/surefire-reports`. Allure results and failure attachments are under `target/allure-results`. With Allure CLI installed, generate an HTML report without opening it:

```powershell
cd testing
allure generate .\target\allure-results --clean -o .\target\allure-report
```

## Browser investigation service

For agent-based locator repair, start the shared browser service:

```powershell
npm run mcp:browser
```

This starts Playwright MCP in a visible Edge browser on port 8931. Any MCP-compatible agent can connect to `http://127.0.0.1:8931/mcp`. See `testing/WORKFLOW.md` section 6 for connection instructions per agent.

## Self-healing (locator repair)

When a locator breaks, the testing agent must:

1. Reproduce the failure (run the test, confirm it fails at the locator)
2. Inspect the **live page in the browser** via Playwright MCP — snapshot the page and find the element by its role/name/label
3. **Do NOT read or search application source code** to find selectors — the page is the source of truth
4. Update the page object with the correct locator
5. Rerun the test to confirm it passes
6. Verify via `git diff` that only the locator line changed

See `testing/WORKFLOW.md` section 5 for full details.

## Scenario edits and locator repair

1. For a rewrite, preserve the original expected behavior and make its steps and data explicit. For a correction or new scenario, document the approved behavior first and use the scenario template.
2. For a locator failure, reproduce it with the single Java test. The testing agent can inspect the loopback test URL using the shared browser service in isolated Edge.
3. Verify the intended element and update the Java page object. Prefer exact role/name or label; use a stable test ID or scoped XPath when necessary. Rerun the same test and review the diff.
4. If the right control works but the resulting payload or business value is wrong, leave the test red. Never add fallback selectors, retries, or weaker assertions merely to get a pass.

Exercise the workflow on a disposable test branch: break the QR button locator, verify it fails, repair it using the page snapshot (not app code), and rerun. Separately supply a valid PNG encoding a different URL via a test-only fixture and confirm that the original payload assertion fails. Do not modify the production site to create either drill.
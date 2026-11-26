# Test Pilot Replication Guide

This document describes how to replicate the website test pilot in a different environment. It covers tools, setup, scenarios, test implementation, self-healing, definition of done, flow, Jenkins CI, and Azure DevOps integration.

---

## 1. Tools and versions

| Tool | Version | Purpose |
|---|---|---|
| JDK | 17 (any 17.x patch) | Compile and run Java tests |
| Maven | 3.9.9 (via Maven Wrapper) | Build and test runner |
| Node.js | 22.x | Run the website dev server |
| Playwright Java | 1.64.0 | Browser automation library |
| TestNG | 7.10.2 | Test framework |
| Allure TestNG | 2.29.1 | Test reporting |
| ZXing (javase) | 3.5.3 | QR code decoding in tests |
| Playwright MCP | 0.0.86 | Agent investigation tool (not a test dependency) |
| Allure CLI | 2.46.2 | Generate HTML reports locally |
| OpenCode | Latest | AI agent harness with subagent support |
| Codex CLI | Latest (optional) | Alternative agent for running subagents |

---

## 2. Environment setup

### Prerequisites
- Windows 10/11 (or macOS/Linux with adjusted commands)
- Node.js 22.x installed
- JDK 17 installed (verify with `java -version`)
- Maven 3.9.x installed (verify with `mvn -version`)
- Scoop (optional, for Allure CLI)

### Install Allure CLI (optional)
```powershell
scoop install allure
```

### Register Playwright MCP (for agent investigation)
Add to `opencode.jsonc` at the repo root:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "servers": {
      "playwright": {
        "type": "local",
        "command": [
          "cmd.exe", "/c", "npx", "-y", "@playwright/mcp@0.0.86",
          "--isolated", "--browser", "msedge", "--codegen", "java",
          "--no-webmcp", "--allowed-origins", "http://127.0.0.1:*;http://localhost:*",
          "--output-dir", "testing/target/mcp"
        ]
      }
    }
  },
  "permissions": [
    { "action": "playwright_browser_run_code_unsafe", "resource": "*", "effect": "deny" }
  ]
}
```

### Create the test project
```powershell
# From repo root
New-Item -ItemType Directory -Force testing | Out-Null
cd testing
```

Create `testing/pom.xml` with Java 17, TestNG, Playwright, Allure TestNG, and ZXing dependencies. See the existing `testing/pom.xml` for the exact configuration.

Install Maven Wrapper:
```powershell
mvn org.apache.maven.plugins:maven-wrapper-plugin:3.3.4:wrapper "-Dmaven=3.9.9" "-Dtype=only-script"
```

Install Chromium browser:
```powershell
.\mvnw.cmd exec:java "-Dexec.classpathScope=test" "-Dexec.mainClass=com.microsoft.playwright.CLI" "-Dexec.args=install chromium"
```

### Add npm scripts to root `package.json`
```json
"dev": "next dev --hostname 127.0.0.1",
"dev:test": "cross-env NEXT_PUBLIC_GOOGLE_CLIENT_ID=stamp-test-only.apps.googleusercontent.com next dev --hostname 127.0.0.1",
"test": "cd testing && mvnw test",
"test:qr": "cd testing && mvn test -Dtest=QrDownloadTests"
```

Install cross-env:
```powershell
npm install --save-dev cross-env
```

---

## 3. Test project structure

```
testing/
  pom.xml                          Java 17 + TestNG + Playwright + Allure + ZXing
  mvnw.cmd                         Maven Wrapper
  AGENTS.md                        Agent scope and rules
  README.md                        Setup and run instructions
  scenarios/
    TEMPLATE.md                    Template for new scenarios
    QR-001.md                      QR download scenario
  src/test/java/website/testing/
    QrDownload.java                Page object (locators + actions)
    QrDownloadTests.java           TestNG test with Allure steps
    StampDashboardPage.java         Stamp page object
    StampGoogleFixture.java         Synthetic Google API mock
    StampEarningsTest.java          Stamp earnings TestNG test
```

---

## 4. How scenarios work

### Scenario format
Each scenario is a Markdown file in `testing/scenarios/` with a stable ID.

```markdown
# QR-001 — Downloaded PNG encodes the entered content

## Preconditions
- Website running at http://127.0.0.1:3000
- Browser: Chromium (headless)

## Test data
- Input: "https://example.com/qr-pilot?case=QR-001"
- Expected filename: "qr-code.png"
- Expected QR payload: "https://example.com/qr-pilot?case=QR-001"

## Steps
| Action | Expected result |
|---|---|
| Open the QR generator page | QR preview renders, Download PNG is enabled |
| Enter whitespace-only text | Download PNG is disabled |
| Enter the test URL (with surrounding whitespace) | Download PNG is enabled |
| Click Download PNG | A file named "qr-code.png" downloads |
| Decode the downloaded PNG | QR contains exactly "https://example.com/qr-pilot?case=QR-001" |

## Automation
- Java test: `QrDownloadTests#downloadsPngWithTheEnteredContent`
- Allure scenario label: `QR-001`
```

### Rules
- One file per scenario, named by ID (e.g., `QR-001.md`)
- Scenarios describe user-observable behavior, not implementation details
- Locators are NOT in scenarios — they live in Java page objects
- The scenario ID appears in the Java test (as Allure label) and in the scenario file
- Use `TEMPLATE.md` as a starting point for new scenarios

---

## 5. How tests are implemented

### Architecture
- **Page objects** (`QrDownload.java`, `StampDashboardPage.java`) — contain locators and actions. Locators are defined once and reused.
- **Test classes** (`QrDownloadTests.java`, `StampEarningsTest.java`) — contain test methods with Allure steps and assertions
- **Fixtures** (`StampGoogleFixture.java`) — mock third-party services (Google OAuth, Drive, Sheets) with synthetic data

### Page object pattern
```java
final class QrDownload {
    private final Page page;
    private final Locator content;
    private final Locator downloadPng;

    QrDownload(Page page) {
        this.page = page;
        content = page.getByRole(AriaRole.TEXTBOX, ...);
        downloadPng = page.getByRole(AriaRole.BUTTON, ...);
    }

    void open() { page.navigate("/toolbox/qr-code-generator"); }
    void enterContent(String value) { content.fill(value); }
    void expectDownloadDisabled() { assertThat(downloadPng).isDisabled(); }
    Download downloadPng() { return page.waitForDownload(downloadPng::click); }
}
```

### Test class pattern
```java
public class QrDownloadTests {
    private Page page;
    private QrDownload qrDownload;

    @BeforeMethod
    public void setUp() {
        // Create browser, context, page, page object
    }

    @AfterMethod
    public void tearDown() {
        // Close context, browser, playwright
    }

    @Test
    public void downloadsPngWithTheEnteredContent() throws Exception {
        Allure.label("scenario", "QR-001");
        Allure.step("Open the generator", () -> { ... });
        Allure.step("Verify download", () -> { ... });
    }
}
```

### Allure integration
- Use `Allure.label("scenario", "QR-001")` to link the test to the scenario
- Use `Allure.step("description", () -> { ... })` to create readable steps in the report
- Use `Allure.addAttachment(...)` for screenshots and traces on failure

### Synthetic fixtures (Stamp tests)
- Mock Google OAuth script, Drive API, and Sheets API using Playwright's `context.route()`
- Use fictional data (fake email, fake spreadsheet, fake timecard rows)
- Block all non-localhost requests to prevent real API calls
- Freeze the clock with `page.clock().setFixedTime(...)` for deterministic date-based tests
- Use `ServiceWorkerPolicy.BLOCK` to prevent service worker interference

---

## 6. Self-healing (locator repair)

### Rule: The page is the source of truth, not the app code

When a locator breaks:
1. **Reproduce the failure** — run the test, confirm it fails at the locator
2. **Inspect the live page** — use Playwright MCP to navigate to the local page and take a snapshot
3. **Do NOT read or search application source code** to find selectors
4. **Find the correct element** — by its role, name, label, or text in the snapshot
5. **Update the page object** — replace the broken locator with the correct one
6. **Rerun the test** — confirm it passes
7. **Verify the diff** — only the locator line should change

### Locator priority
1. `getByRole(AriaRole.BUTTON, new GetByRoleOptions().setName("...").setExact(true))` — preferred
2. `getByLabel("...", new GetByLabelOptions().setExact(true))` — for form fields
3. `getByText("...", new GetByTextOptions().setExact(true))` — for text content
4. `locator("css=...")` — when role/name/label are unavailable
5. `locator("xpath=...")` — last resort, only when CSS is insufficient

### What NOT to do
- Do not read app source code to find selectors
- Do not use positional selectors (nth-child, index-based)
- Do not change assertions to make a test pass
- Do not skip or disable tests
- Do not add retries or sleep calls
- Do not modify app code to fix a test
- If the control works but the result is wrong → leave test red, report product bug

### Self-healing drill (demonstrated)
1. Break locator: change role locator to `xpath=//button[@id='legacy-qr-download']`
2. Run test → fails: `waiting for locator`
3. Agent uses Playwright MCP → snapshot → finds `button "Download PNG" [ref=e42]`
4. Agent repairs → restores role/name locator
5. Test passes
6. `git diff` → only the locator line changed

---

## 7. Definition of done

A test is complete when:
- [ ] Scenario file exists in `testing/scenarios/` with stable ID
- [ ] Java test class exists with matching scenario ID as Allure label
- [ ] Test passes locally with `mvn test`
- [ ] Test is deterministic (no flaky failures on 3 consecutive runs)
- [ ] Test uses isolated browser context (no shared state)
- [ ] Test doesn't depend on real external services (mocked)
- [ ] Allure report shows the scenario ID, steps, and pass status
- [ ] Locator uses role/name/label (not positional or fragile selectors)
- [ ] `git diff` is minimal (only test files changed)

---

## 8. Flow

```
1. Write scenario (Markdown, stable ID)
2. Implement page object (locators + actions)
3. Implement test class (TestNG + Allure steps + assertions)
4. Run test locally → verify pass
5. Commit to Git
6. (Future) Publish scenario to Azure Test Plans
7. (Future) Run in CI pipeline
8. (Future) Update Azure test point with result
```

### For locator repair:
```
1. Test fails → identify locator failure
2. Reproduce with single test
3. Inspect page via Playwright MCP (snapshot)
4. Repair locator in page object
5. Rerun test → verify pass
6. Review diff → only locator changed
7. Commit
```

---

## 9. Jenkins CI implementation

### Prerequisites
- Jenkins with Pipeline plugin
- Maven (or use Maven Wrapper from repo)
- Node.js 22.x
- JDK 17
- Playwright Chromium (install via `mvn exec:java`)

### Jenkinsfile (in repo root)
```groovy
pipeline {
    agent any
    tools {
        jdk 'JDK17'
        nodejs 'Node22'
    }
    stages {
        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        stage('Build website') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Start website') {
            steps {
                sh 'npm run dev &'
                sh 'sleep 10'  // wait for server to start
            }
        }
        stage('Run tests') {
            steps {
                sh 'npm test'
            }
        }
        stage('Publish Allure') {
            steps {
                allure([
                    includeProperties: false,
                    jdk: '',
                    properties: [],
                    reportBuildPolicy: 'ALWAYS',
                    results: [[path: 'testing/target/allure-results']]
                ])
            }
        }
    }
    post {
        always {
            junit 'testing/target/surefire-reports/*.xml'
        }
    }
}
```

### Key Jenkins plugins needed
- Pipeline
- Allure Jenkins Plugin
- JUnit
- NodeJS
- JDK

### Environment variables for Jenkins
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — set to synthetic value for Stamp tests
- `website.baseUrl` — set to `http://localhost:3000`

---

## 10. Azure DevOps integration

### Reading scenarios from Azure Test Plans

Use the Azure DevOps MCP server or REST API to:
- List test plans: `testplan list_plans`
- List test suites: `testplan list_suites`
- List test cases: `testplan list_cases`
- Get a single test case by ID

### Writing/editing scenarios in Azure

Use the Azure DevOps MCP server:
- Create test case: `testplan_test_case_write create`
- Update test case steps: `testplan_test_case_write update_steps`

### Bulk import/export
- Export: Test Plans → select suite → Export to CSV/XLSX
- Import: Test Plans → select suite → Import from CSV/XLSX
- Required columns: ID, Work Item Type, Title, Test Step, Step Action, Step Expected, Area Path, Assigned To, State
- Reimporting with matching ID **replaces all steps** — always export first

### Linking Git to Azure
- Store scenario ID in both the Markdown file and the Azure test case
- Java test uses `Allure.label("scenario", "QR-001")` to link
- CI publishes JUnit results; associate with Azure test point separately
- Use WIQL queries to find test cases by title or area path

### Recommended workflow for Azure
1. **Start with CSV export/import** — lowest barrier, no MCP needed
2. **Move to MCP** — use Azure DevOps MCP for read/write/test case management
3. **Use Git as source of truth** — scenarios in Git, sync to Azure via MCP or bulk import
4. **Publish results** — CI publishes JUnit to Azure Test Plans via build association

### Azure DevOps MCP setup
```powershell
opencode mcp add azure-devops --url https://dev.azure.com/{org}/_apis/mcp
```

Authenticate via OAuth when prompted. Use `/mcps` in OpenCode to manage the connection.
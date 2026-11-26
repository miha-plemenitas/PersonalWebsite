# Testing Workflow — Agent-Neutral

This document is the single source of truth for how to write, run, and repair tests in this project. Any agent (Claude, Codex, OpenCode, or a human developer) can follow these instructions. No agent-specific terminology is used.

---

## 1. What this project contains

```
testing/
  pom.xml                    Java 17 + TestNG + Playwright + Allure + ZXing
  mvnw.cmd                   Maven Wrapper (no global Maven needed)
  WORKFLOW.md                This file — read first
  AGENTS.md                  Scope and rules for the testing agent
  README.md                  Quick start and run commands
  scenarios/                 One Markdown file per test case (source of truth)
  src/test/java/website/testing/   Page objects and test classes
```

- **Scenarios** are Markdown files in `testing/scenarios/` with a stable ID.
- **Page objects** in `testing/src/test/java/website/testing/` contain locators and actions.
- **Test classes** contain TestNG `@Test` methods with Allure steps and assertions.
- **The Java suite runs independently** of any browser service or agent.

---

## 2. Starting the website

```powershell
npm run dev
```

The website starts at `http://127.0.0.1:3000`. For Stamp tests (which need a synthetic Google client ID):

```powershell
npm run dev:test
```

---

## 3. Running tests

| Command | What it does |
|---|---|
| `npm test` | Run all tests (headless) |
| `npm run test:qr` | Run only QR tests |
| `cd testing && mvn -Dtest=QrDownloadTests test` | Run a single test class |
| `cd testing && mvn -Dtest=QrDownloadTests -Dheaded=true test` | Run in headed mode (visible browser) |
| `cd testing && allure generate .\target\allure-results --clean -o .\target\allure-report` | Generate Allure HTML report |

---

## 4. Writing a new test

### Step 1: Write the scenario

Create `testing/scenarios/{ID}.md` using `TEMPLATE.md` as a starting point:

```markdown
# AREA-000 — Scenario name

## Preconditions
- State the starting page, account state, fixture, and date if relevant.

## Test data
- List exact input values and expected calculations.

## Steps
| Action | Expected result |
|---|---|
| Describe an action observable by the user. | Describe an observable result. |

## Automation
- Java test: `ClassName#methodName`
- Allure scenario label: `AREA-000`
```

### Step 2: Create the page object

Create `testing/src/test/java/website/testing/{Name}.java`:

```java
final class MyPage {
    private final Page page;
    private final Locator myButton;

    MyPage(Page page) {
        this.page = page;
        myButton = page.getByRole(AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("My Button").setExact(true));
    }

    void open() { page.navigate("/my-page"); }
    void clickButton() { myButton.click(); }
    void expectButtonEnabled() { assertThat(myButton).isEnabled(); }
}
```

### Step 3: Create the test class

Create `testing/src/test/java/website/testing/{Name}Tests.java`:

```java
public class MyPageTests {
    private Page page;
    private MyPage myPage;

    @BeforeMethod
    public void setUp() {
        Playwright playwright = Playwright.create();
        Browser browser = playwright.chromium().launch(
            new BrowserType.LaunchOptions().setHeadless(
                !Boolean.parseBoolean(System.getProperty("headed", "false"))));
        BrowserContext context = browser.newContext(
            new Browser.NewContextOptions().setBaseURL(
                System.getProperty("website.baseUrl", "http://127.0.0.1:3000")));
        page = context.newPage();
        myPage = new MyPage(page);
    }

    @AfterMethod
    public void tearDown() { /* close page, context, browser, playwright */ }

    @Test
    public void myTest() {
        Allure.label("scenario", "AREA-000");
        Allure.step("Open the page", () -> myPage.open());
        Allure.step("Verify button", () -> myPage.expectButtonEnabled());
    }
}
```

### Step 4: Run and verify

```powershell
npm run test:qr   # or: cd testing && mvn -Dtest=MyPageTests test
```

---

## 5. Self-healing (locator repair)

### Rule: The live page is the source of truth, NOT the application source code

When a locator breaks:

1. **Reproduce the failure** — run the test, confirm it fails at the locator
2. **Inspect the live page** — use Playwright MCP to navigate to the local page and take a snapshot
3. **Do NOT read or search application source code** to find selectors
4. **Find the correct element** — by its role, name, label, or text in the snapshot
5. **Update the page object** — replace the broken locator with the correct one
6. **Rerun the test** — confirm it passes
7. **Verify the diff** — only the locator line should change

### Locator priority (prefer in this order)

1. `getByRole(AriaRole.BUTTON, new GetByRoleOptions().setName("...").setExact(true))`
2. `getByLabel("...", new GetByLabelOptions().setExact(true))`
3. `getByText("...", new GetByTextOptions().setExact(true))`
4. `locator("css=...")` — when role/name/label are unavailable
5. `locator("xpath=...")` — last resort

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
4. Agent repairs → restores role/name locator (NOT by reading app code)
5. Test passes
6. `git diff` → only the locator line changed

---

## 6. Starting the browser investigation service

The Java test suite does NOT use this service. It runs Playwright Java independently. This service is only for agents to inspect the live page.

```powershell
npm run mcp:browser
```

This starts Playwright MCP in a visible Edge browser on port 8931. Any MCP-compatible agent can connect.

### Connecting agents

**Claude Code:**
```powershell
claude mcp add --transport http playwright http://127.0.0.1:8931/mcp
```

**Codex:**
```powershell
codex mcp add playwright --url http://127.0.0.1:8931/mcp
```

**Any other MCP client:** Connect to `http://127.0.0.1:8931/mcp`

### Agent instruction template

Give any agent this instruction:

> Read `testing/WORKFLOW.md`. Run the QR test (`npm run test:qr`). If its locator fails, use Playwright MCP to inspect the live page at `http://127.0.0.1:3000/toolbox/qr-code-generator`, identify the correct control by its role/name, repair the locator in the page object, and rerun the test. Do not read application source code to find selectors. Report the old locator, new locator, and test result.

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

## 9. Synthetic fixtures (Stamp tests)

- Mock Google OAuth script, Drive API, and Sheets API using Playwright's `context.route()`
- Use fictional data (fake email, fake spreadsheet, fake timecard rows)
- Block all non-localhost requests to prevent real API calls
- Freeze the clock with `page.clock().setFixedTime(...)` for deterministic date-based tests
- Use `ServiceWorkerPolicy.BLOCK` to prevent service worker interference

---

## 10. Jenkins CI implementation

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
            steps { sh 'npm ci' }
        }
        stage('Build website') {
            steps { sh 'npm run build' }
        }
        stage('Start website') {
            steps {
                sh 'npm run dev &'
                sh 'sleep 10'
            }
        }
        stage('Run tests') {
            steps { sh 'npm test' }
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

- Pipeline, Allure Jenkins Plugin, JUnit, NodeJS, JDK

### Environment variables for Jenkins

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` — set to synthetic value for Stamp tests
- `website.baseUrl` — set to `http://localhost:3000`

---

## 11. Azure DevOps integration

### Reading scenarios from Azure Test Plans

Use the Azure DevOps MCP server or REST API to:
- List test plans, suites, and cases
- Get a single test case by ID

### Writing/editing scenarios in Azure

Use the Azure DevOps MCP server:
- Create test case
- Update test case steps

### Bulk import/export

- Export: Test Plans → select suite → Export to CSV/XLSX
- Import: Test Plans → select suite → Import from CSV/XLSX
- Reimporting with matching ID **replaces all steps** — always export first

### Linking Git to Azure

- Store scenario ID in both the Markdown file and the Azure test case
- Java test uses `Allure.label("scenario", "QR-001")` to link
- CI publishes JUnit results; associate with Azure test point separately

### Recommended workflow for Azure

1. Start with CSV export/import — lowest barrier, no MCP needed
2. Move to MCP — use Azure DevOps MCP for read/write/test case management
3. Use Git as source of truth — scenarios in Git, sync to Azure via MCP or bulk import
4. Publish results — CI publishes JUnit to Azure Test Plans via build association

### Azure DevOps MCP setup

Connect to your Azure DevOps organization's MCP endpoint. Authenticate via OAuth when prompted. Use your client's MCP management command to verify the connection.

---

## 12. Agent-neutral configuration

### Shared browser config

The file `testing/playwright-mcp.jsonc` contains the shared Playwright MCP configuration. It is not tied to any specific agent. Any MCP-compatible client can read it and connect to the browser service started by `npm run mcp:browser`.

### Why not opencode.jsonc?

The `opencode.jsonc` file was originally used to register Playwright MCP with OpenCode specifically. To make the workflow agent-neutral:

1. The shared config lives in `testing/playwright-mcp.jsonc`
2. The browser service is started with `npm run mcp:browser`
3. Any agent connects to `http://127.0.0.1:8931/mcp`
4. The `opencode.jsonc` file is kept for backward compatibility but is not required

### Agent instruction files

Instead of agent-specific instruction files, use:
- `testing/WORKFLOW.md` — comprehensive workflow (this file)
- `testing/AGENTS.md` — scope and rules for the testing agent
- `testing/README.md` — quick start

Any agent can read these files and follow the instructions. No OpenCode-specific terminology is used.
package website.testing;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.options.ServiceWorkerPolicy;
import io.qameta.allure.Allure;
import org.testng.annotations.Test;

import java.io.ByteArrayInputStream;

class StampEarningsTest {
    @Test
    public void estimatesEarningsFromFictionalTimecard() {
        Allure.label("scenario", "STAMP-001");
        Allure.label("feature", "Stamp");
        Allure.label("story", "Monthly earnings estimate");

        String baseUrl = System.getProperty("website.baseUrl", "http://127.0.0.1:3000");
        try (Playwright playwright = Playwright.create();
             Browser browser = playwright.chromium().launch();
             BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                     .setBaseURL(baseUrl)
                     .setTimezoneId("Europe/Ljubljana")
                     .setServiceWorkers(ServiceWorkerPolicy.BLOCK))) {
            StampGoogleFixture google = new StampGoogleFixture(context, baseUrl);
            Page page = context.newPage();
            page.clock().setFixedTime("2025-02-13T23:30:00Z");
            StampDashboardPage dashboard = new StampDashboardPage(page);

            try {
                Allure.step("Connect a fictional Google account and load the timecard", dashboard::connect);
                Allure.step("Verify the default estimate for 69h 30m at 7,73 €/hour",
                        () -> dashboard.expectMonthlyEarnings("7,73", "537,24"));
                Allure.step("Change the hourly rate to 10,00 and verify the updated estimate", () -> {
                    dashboard.changeRate("10,00");
                    dashboard.expectMonthlyEarnings("10,00", "695,00");
                });
                Allure.step("Reload and verify the updated rate persists", () -> {
                    dashboard.reload();
                    dashboard.expectMonthlyEarnings("10,00", "695,00");
                });
                Allure.step("Verify only the fictional Google fixtures were used", google::expectOnlyFictionalGoogleTraffic);
            } catch (RuntimeException | AssertionError failure) {
                try {
                    if (!google.blockedRequests().isEmpty()) {
                        Allure.addAttachment("Blocked browser requests", String.join("\n", google.blockedRequests()));
                    }
                    byte[] png = page.screenshot(new Page.ScreenshotOptions().setTimeout(5_000));
                    Allure.addAttachment("Failure screenshot", "image/png", new ByteArrayInputStream(png), ".png");
                } catch (RuntimeException | AssertionError attachmentFailure) {
                    failure.addSuppressed(attachmentFailure);
                }
                throw failure;
            }
        }
    }
}
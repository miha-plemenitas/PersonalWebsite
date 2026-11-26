package website.testing;

import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.testng.Assert.assertEquals;

final class StampDashboardPage {
    private final Page page;
    private final Locator sections;
    private final Locator earnings;

    StampDashboardPage(Page page) {
        this.page = page;
        sections = page.getByRole(AriaRole.NAVIGATION,
                new Page.GetByRoleOptions().setName("Stamp sections").setExact(true));
        earnings = page.getByRole(AriaRole.REGION,
                new Page.GetByRoleOptions().setName("Earnings this month").setExact(true));
    }

    void connect() {
        page.navigate("/stamp");
        // The button renders before Next's Script onReady callback initializes OAuth.
        page.waitForFunction("() => window.__stampTestOAuthState !== undefined");
        assertEquals(page.evaluate("() => window.__stampTestOAuthState"), "ready",
                "Start the site with the synthetic NEXT_PUBLIC_GOOGLE_CLIENT_ID from STAMP-001");
        page.getByRole(AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Continue with Google").setExact(true)).click();
    }

    void expectMonthlyEarnings(String rate, String total) {
        Locator.GetByTextOptions exact = new Locator.GetByTextOptions().setExact(true);
        assertThat(earnings.getByText("Estimate · 69h 30m at " + rate + " €/hour", exact)).isVisible();
        assertThat(earnings.getByText(total + " €", exact)).isVisible();
    }

    void changeRate(String rate) {
        openSection("Settings");
        Locator settings = page.getByRole(AriaRole.REGION,
                new Page.GetByRoleOptions().setName("Earnings").setExact(true));
        Locator hourlyRate = settings.getByRole(AriaRole.TEXTBOX,
                new Locator.GetByRoleOptions().setName(Pattern.compile("^Hourly rate\\b")));
        hourlyRate.fill(rate);
        hourlyRate.press("Enter");
        openSection("Overview");
    }

    void reload() {
        page.reload();
    }

    private void openSection(String name) {
        sections.getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true)).click();
    }
}

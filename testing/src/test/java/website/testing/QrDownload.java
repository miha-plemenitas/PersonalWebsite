package website.testing;

import com.microsoft.playwright.Download;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

import java.util.regex.Pattern;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

final class QrDownload {
    private final Page page;
    private final Locator content;
    private final Locator downloadPng;
    private final Locator preview;

    QrDownload(Page page) {
        this.page = page;
        content = page.getByRole(AriaRole.TEXTBOX,
                new Page.GetByRoleOptions().setName("Text or URL").setExact(true));
        downloadPng = page.getByRole(AriaRole.BUTTON,
                new Page.GetByRoleOptions().setName("Download PNG").setExact(true));
        preview = page.getByLabel("Generated QR code", new Page.GetByLabelOptions().setExact(true));
    }

    void open() {
        page.navigate("/toolbox/qr-code-generator");
        waitForRenderedPreview();
    }

    void enterContent(String value) {
        content.fill(value);
    }

    void expectDownloadDisabled() {
        assertThat(downloadPng).isDisabled();
    }

    void expectDownloadEnabled() {
        assertThat(downloadPng).isEnabled();
    }

    Download downloadPng() {
        waitForRenderedPreview();
        return page.waitForDownload(new Page.WaitForDownloadOptions().setTimeout(10_000),
                downloadPng::click);
    }

    private void waitForRenderedPreview() {
        assertThat(preview).hasAttribute("width", Pattern.compile("[1-9]\\d*"));
    }
}
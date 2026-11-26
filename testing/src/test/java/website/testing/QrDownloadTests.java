package website.testing;

import com.google.zxing.BinaryBitmap;
import com.google.zxing.ChecksumException;
import com.google.zxing.FormatException;
import com.google.zxing.NotFoundException;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Download;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.microsoft.playwright.Tracing;
import io.qameta.allure.Allure;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Pattern;

import static org.testng.Assert.assertEquals;
import static org.testng.Assert.assertNotNull;
import static org.testng.Assert.assertNull;

public class QrDownloadTests {

    private static final String PAYLOAD = "https://example.com/qr-pilot?case=QR-001";
    private static final String EXPECTED_FILENAME = "qr-code.png";
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G', '\r', '\n', 0x1a, '\n'};

    private Playwright playwright;
    private Browser browser;
    private BrowserContext context;
    private Page page;
    private QrDownload qrDownload;
    private Path downloadPath;

    @BeforeMethod
    public void setUp() {
        playwright = Playwright.create();
        browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions().setHeadless(
                        !Boolean.parseBoolean(System.getProperty("headed", "false"))));
        context = browser.newContext(new Browser.NewContextOptions()
                .setBaseURL(System.getProperty("website.baseUrl", "http://127.0.0.1:3000"))
                .setAcceptDownloads(true));
        context.tracing().start(new Tracing.StartOptions().setScreenshots(true).setSnapshots(true));
        page = context.newPage();
        qrDownload = new QrDownload(page);
    }

    @AfterMethod
    public void tearDown() {
        if (context != null) {
            try {
                context.tracing().stop();
            } catch (Exception ignored) {
            }
            context.close();
        }
        if (browser != null) browser.close();
        if (playwright != null) playwright.close();
    }

    @Test
    public void downloadsPngWithTheEnteredContent() throws Exception {
        Allure.label("scenario", "QR-001");
        Allure.label("feature", "QR Code Generator");
        Allure.label("story", "Download a PNG");

        Path output = Files.createTempDirectory("qr-001");

        Allure.step("Open the generator with its default QR preview", () -> {
            qrDownload.open();
            qrDownload.expectDownloadEnabled();
        });

        Allure.step("Whitespace-only input disables Download PNG", () -> {
            qrDownload.enterContent(" \t\n ");
            qrDownload.expectDownloadDisabled();
        });

        Allure.step("Entering content re-enables Download PNG", () -> {
            qrDownload.enterContent("  " + PAYLOAD + " \t");
            qrDownload.expectDownloadEnabled();
        });

        downloadPath = output.resolve(EXPECTED_FILENAME);
        Allure.step("Save the browser download with the expected PNG filename", () -> {
            var download = qrDownload.downloadPng();
            assertEquals(EXPECTED_FILENAME, download.suggestedFilename(),
                    "Downloaded file should be named qr-code.png");
            assertNull(download.failure(), "Chromium should complete the download");
            download.saveAs(downloadPath);
        });

        Allure.step("Decode the PNG and verify the exact trimmed content",
                () -> assertEquals(PAYLOAD, decodePng(downloadPath)));

        attachFailureEvidence();
    }

    private String decodePng(Path png)
            throws IOException, NotFoundException, ChecksumException, FormatException {
        try (var data = Files.newInputStream(png)) {
            byte[] signature = data.readNBytes(PNG_SIGNATURE.length);
            for (int i = 0; i < PNG_SIGNATURE.length; i++) {
                if (signature[i] != PNG_SIGNATURE[i]) {
                    throw new IOException("PNG signature mismatch at byte " + i);
                }
            }
        }

        BufferedImage image = ImageIO.read(png.toFile());
        assertNotNull(image, "ImageIO should read the downloaded PNG");
        BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(
                new BufferedImageLuminanceSource(image)));
        return new QRCodeReader().decode(bitmap).getText();
    }

    private void attachFailureEvidence() {
        try {
            byte[] screenshot = page.screenshot(new Page.ScreenshotOptions().setTimeout(5_000));
            Allure.addAttachment("Failure screenshot", "image/png",
                    new ByteArrayInputStream(screenshot), ".png");
        } catch (RuntimeException ignored) {
        }

        try {
            Path trace = downloadPath.getParent().resolve("qr-001-trace.zip");
            context.tracing().stop(new Tracing.StopOptions().setPath(trace));
            try (var data = Files.newInputStream(trace)) {
                Allure.addAttachment("Playwright trace", "application/zip", data, ".zip");
            }
        } catch (IOException | RuntimeException ignored) {
        }
    }
}
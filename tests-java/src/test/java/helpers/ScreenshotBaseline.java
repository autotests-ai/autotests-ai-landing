package helpers;

import com.codeborne.selenide.SelenideElement;
import config.ConfigReader;
import io.qameta.allure.Allure;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static com.codeborne.selenide.Condition.visible;
import static io.qameta.allure.Allure.step;

public final class ScreenshotBaseline {

    private static final Path DIFF_DIR = Path.of("build", "baseline-diff");
    private static final int DIFF_HIGHLIGHT_RGB = 0xFFFF00FF;
    private static final int SIZE_MISMATCH_RGB = 0xFFFF0000;

    private ScreenshotBaseline() {
    }

    public static void captureAndCompare(
            SelenideElement element, String area, int viewport, String attachmentName) {
        element.shouldBe(visible);

        var screenshotFile = element.screenshot();
        byte[] actual;
        try {
            actual = Files.readAllBytes(screenshotFile.toPath());
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }

        var label = area + "/" + viewport;
        var baselinePath = baselineFilePath(area, viewport);
        var baselinePresent = baselineExists(area, viewport);

        if (shouldUpdateBaselines()) {
            step("Update baseline: " + attachmentName, () ->
                    attachUpdateMode(attachmentName, actual, baselinePresent, area, viewport));
            writeBaseline(baselinePath, actual);
            return;
        }

        if (!baselinePresent) {
            step("Missing baseline: " + attachmentName, () ->
                    attachPng(attachmentName + "-actual-unmatched", actual));
            throw new AssertionError(
                    "Baseline missing for %s. Commit PNG to src/test/resources/screenshots/%s/ "
                            + "or run with -DupdateBaselines=true"
                            .formatted(label, area));
        }

        try {
            var expected = readBaseline(area, viewport);
            var comparison = compareImages(expected, actual, label);
            step("Compare screenshot: " + attachmentName, () -> {
                if (comparison.passed()) {
                    attachPng(attachmentName, actual);
                    return;
                }

                attachPng(attachmentName + "-baseline", expected);
                attachPng(attachmentName + "-actual", actual);
                attachPng(attachmentName + "-diff", comparison.diffPng());
                saveFailArtifacts(label, actual, comparison.diffPng());
                throw new AssertionError(comparison.message());
            });
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void attachUpdateMode(
            String attachmentName, byte[] actual, boolean baselinePresent, String area, int viewport) {
        if (baselinePresent) {
            try {
                attachPng(attachmentName + "-baseline-old", readBaseline(area, viewport));
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            attachPng(attachmentName + "-baseline-new", actual);
            return;
        }
        attachPng(attachmentName + "-baseline-new", actual);
    }

    private static void attachPng(String name, byte[] png) {
        Allure.addAttachment(name, "image/png", new ByteArrayInputStream(png), ".png");
    }

    private static boolean shouldUpdateBaselines() {
        return ConfigReader.testConfig.updateBaselines();
    }

    private static String baselinesDir() {
        var dir = ConfigReader.testConfig.baselinesDir().trim();
        if (dir.isEmpty()) {
            throw new IllegalStateException("baselinesDir must not be empty");
        }
        return dir.replace('\\', '/').replaceAll("/+$", "");
    }

    private static Path baselineFilePath(String area, int viewport) {
        return Path.of("src", "test", "resources", baselinesDir(), area, viewport + ".png");
    }

    private static String baselineResourcePath(String area, int viewport) {
        return baselinesDir() + "/" + area + "/" + viewport + ".png";
    }

    private static boolean baselineExists(String area, int viewport) {
        var resource = baselineResourcePath(area, viewport);
        if (Thread.currentThread().getContextClassLoader().getResource(resource) != null) {
            return true;
        }
        return Files.exists(baselineFilePath(area, viewport));
    }

    private static byte[] readBaseline(String area, int viewport) throws IOException {
        var resource = baselineResourcePath(area, viewport);
        var url = Thread.currentThread().getContextClassLoader().getResource(resource);
        if (url != null) {
            try (InputStream in = url.openStream()) {
                return in.readAllBytes();
            }
        }
        var path = baselineFilePath(area, viewport);
        if (Files.exists(path)) {
            return Files.readAllBytes(path);
        }
        throw new IOException("Baseline not found: " + resource);
    }

    private static void writeBaseline(Path baselinePath, byte[] png) {
        try {
            Files.createDirectories(baselinePath.getParent());
            Files.write(baselinePath, png);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private record ImageComparison(boolean passed, byte[] diffPng, String message) {
    }

    private static ImageComparison compareImages(byte[] expectedBytes, byte[] actualBytes, String label)
            throws IOException {
        var expected = readImage(expectedBytes);
        var actual = readImage(actualBytes);
        var diffPng = createDiffPng(expected, actual);

        if (expected.getWidth() != actual.getWidth() || expected.getHeight() != actual.getHeight()) {
            return new ImageComparison(
                    false,
                    diffPng,
                    "Screenshot size changed for %s: expected %dx%d, actual %dx%d"
                            .formatted(
                                    label,
                                    expected.getWidth(),
                                    expected.getHeight(),
                                    actual.getWidth(),
                                    actual.getHeight()));
        }

        var width = expected.getWidth();
        var height = expected.getHeight();
        var diffPixels = 0;
        var totalPixels = width * height;

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                if (expected.getRGB(x, y) != actual.getRGB(x, y)) {
                    diffPixels++;
                }
            }
        }

        var maxDiffRatio = ConfigReader.testConfig.visualDiffThreshold();
        var diffRatio = (double) diffPixels / totalPixels;
        if (diffRatio > maxDiffRatio) {
            return new ImageComparison(
                    false,
                    diffPng,
                    "Screenshot diff too high for %s: %.2f%% > %.2f%%"
                            .formatted(label, diffRatio * 100, maxDiffRatio * 100));
        }

        return new ImageComparison(true, diffPng, null);
    }

    private static byte[] createDiffPng(BufferedImage expected, BufferedImage actual) throws IOException {
        var expW = expected.getWidth();
        var expH = expected.getHeight();
        var actW = actual.getWidth();
        var actH = actual.getHeight();
        var width = Math.max(expW, actW);
        var height = Math.max(expH, actH);
        var diff = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var inExpected = x < expW && y < expH;
                var inActual = x < actW && y < actH;
                if (inExpected && inActual) {
                    var expectedRgb = expected.getRGB(x, y);
                    if (expectedRgb == actual.getRGB(x, y)) {
                        diff.setRGB(x, y, dimRgb(expectedRgb));
                    } else {
                        diff.setRGB(x, y, DIFF_HIGHLIGHT_RGB);
                    }
                } else {
                    diff.setRGB(x, y, SIZE_MISMATCH_RGB);
                }
            }
        }

        return toPngBytes(diff);
    }

    private static int dimRgb(int rgb) {
        var r = (rgb >> 16) & 0xFF;
        var g = (rgb >> 8) & 0xFF;
        var b = rgb & 0xFF;
        var dim = (r + g + b) / 9;
        return (dim << 16) | (dim << 8) | dim;
    }

    private static byte[] toPngBytes(BufferedImage image) throws IOException {
        var out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static void saveFailArtifacts(String label, byte[] actual, byte[] diff) {
        try {
            Files.createDirectories(DIFF_DIR);
            var prefix = label.replace('/', '_');
            Files.write(DIFF_DIR.resolve(prefix + "-actual.png"), actual);
            Files.write(DIFF_DIR.resolve(prefix + "-diff.png"), diff);
        } catch (IOException ignored) {
            // CI artifact is best-effort; Allure attachments are primary.
        }
    }

    private static BufferedImage readImage(byte[] bytes) throws IOException {
        try (InputStream in = new ByteArrayInputStream(bytes)) {
            var image = ImageIO.read(in);
            if (image == null) {
                throw new IOException("Unsupported screenshot format");
            }
            return image;
        }
    }
}

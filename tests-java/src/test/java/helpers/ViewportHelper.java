package helpers;

import com.codeborne.selenide.Configuration;
import com.codeborne.selenide.WebDriverRunner;
import io.qameta.allure.Step;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.chromium.ChromiumDriver;

import java.util.Map;

import static com.codeborne.selenide.Selenide.open;

public final class ViewportHelper {

    private ViewportHelper() {
    }

    @Step("Reset viewport to default browser size")
    public static void resetViewport() {
        if (!WebDriverRunner.hasWebDriverStarted()) {
            return;
        }

        var driver = WebDriverRunner.getWebDriver();
        if (driver instanceof ChromiumDriver chromium) {
            chromium.executeCdpCommand("Emulation.clearDeviceMetricsOverride", Map.of());
        }

        driver.manage().window().setSize(parseBrowserSize(Configuration.browserSize));
    }

    public static void setViewport(int width, int height) {
        if (!WebDriverRunner.hasWebDriverStarted()) {
            open("about:blank");
        }

        var driver = WebDriverRunner.getWebDriver();
        if (!(driver instanceof ChromiumDriver chromium)) {
            throw new IllegalStateException(
                    "CDP viewport override requires Chrome/Chromium (browser=chrome). Got: "
                            + driver.getClass().getName());
        }

        chromium.executeCdpCommand("Emulation.setDeviceMetricsOverride", Map.of(
                "width", width,
                "height", height,
                "deviceScaleFactor", 1,
                "mobile", false
        ));
    }

    private static Dimension parseBrowserSize(String browserSize) {
        var parts = browserSize.split("x");
        if (parts.length != 2) {
            throw new IllegalStateException("Invalid browserSize: " + browserSize);
        }
        return new Dimension(Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim()));
    }
}

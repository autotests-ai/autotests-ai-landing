package allure;

import com.codeborne.selenide.Selenide;
import com.codeborne.selenide.WebDriverRunner;
import io.qameta.allure.Attachment;
import java.nio.charset.StandardCharsets;
import org.openqa.selenium.OutputType;

import static com.codeborne.selenide.Selenide.sessionId;
import static org.openqa.selenium.logging.LogType.BROWSER;

import config.ConfigReader;
import config.TestConfig;


public class Attachments {
    
    private static final TestConfig config = ConfigReader.testConfig;


    @Attachment(value = "{attachName}", type = "image/png")
    public static byte[] screenshot(String attachName) {
        return Selenide.screenshot(OutputType.BYTES);
    }

    @Attachment(value = "Page source", type = "text/html")
    public static byte[] pageSource() {
        return WebDriverRunner.getWebDriver().getPageSource().getBytes(StandardCharsets.UTF_8);
    }

    @Attachment(value = "{attachName}", type = "text/plain")
    public static String text(String attachName, String message) {
        return message;
    }

    public static void browserConsoleLogs() {
        text(
                "Browser console logs",
                String.join("\n", Selenide.getWebDriverLogs(BROWSER))
        );
    }

    @Attachment(value = "Video", type = "text/html", fileExtension = ".html")
    public static String video() {
        String videoUrl = config.videoFolder() + sessionId() + ".mp4";
        return "<html><body><video width='100%' height='100%' controls autoplay><source src='"
                + videoUrl
                + "' type='video/mp4'></video></body></html>";
    }

    public static void harLogs() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'harLogs'");
    }
}

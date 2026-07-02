package pages;

import static com.codeborne.selenide.Condition.text;
import static com.codeborne.selenide.Condition.visible;
import static com.codeborne.selenide.Selenide.$;
import static com.codeborne.selenide.Selenide.open;

import com.codeborne.selenide.SelenideElement;
import io.qameta.allure.Step;

import java.time.Duration;

public class LandingPage {

    private final SelenideElement layout = $("[data-testid='landing-layout']");
    private final SelenideElement terminalPanel = $("[data-testid='terminal-panel']");
    private final SelenideElement terminalOutput = $("[data-testid='terminal-output']");
    @Step("Open landing page")
    public LandingPage openPage() {
        open("");
        return this;
    }

    @Step("Verify landing layout is mounted")
    public LandingPage shouldShowLayout() {
        layout.shouldBe(visible, Duration.ofSeconds(10));
        terminalPanel.shouldBe(visible);
        return this;
    }

    @Step("Verify terminal contains: {textFragment}")
    public LandingPage shouldShowTerminalText(String textFragment) {
        terminalOutput.shouldHave(text(textFragment), Duration.ofSeconds(10));
        return this;
    }
}

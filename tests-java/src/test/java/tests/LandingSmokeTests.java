package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Landing")
@Feature("Terminal load")
@DisplayName("Landing smoke")
class LandingSmokeTests extends TestBase {

    @Test
    @Tag("smoke")
    @DisplayName("Page load fetches terminal lines from /api/terminal")
    void pageLoadFetchesTerminalLines() {
        landingPage.openPage()
                .shouldShowLayout()
                .shouldShowTerminalText("source: postgresql");
    }
}

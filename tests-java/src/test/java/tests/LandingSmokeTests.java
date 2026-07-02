package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Landing")
@Feature("Terminal refresh")
@DisplayName("Landing smoke")
class LandingSmokeTests extends TestBase {

    @Test
    @Tag("smoke")
    @DisplayName("Refresh loads terminal lines from /api/terminal")
    void refreshLoadsTerminalLines() {
        landingPage.openPage()
                .shouldShowLayout()
                .clickRefresh()
                .shouldShowTerminalText("source: postgresql")
                .shouldShowStatus("OK 200");
    }
}

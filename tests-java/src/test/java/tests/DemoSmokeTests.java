package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("e2e")
@Epic("Landing")
@Feature("Demo refresh")
@DisplayName("Landing smoke")
class DemoSmokeTests extends TestBase {

    @Test
    @Tag("smoke")
    @DisplayName("Refresh loads demo lines from /api/demo")
    void refreshLoadsDemoLines() {
        landingPage.openPage()
                .shouldShowLayout()
                .clickRefresh()
                .shouldShowTerminalText("source: postgresql")
                .shouldShowStatus("OK 200");
    }
}

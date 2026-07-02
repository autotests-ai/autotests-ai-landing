package tests;

import annotations.Layer;
import io.qameta.allure.Epic;
import io.qameta.allure.Feature;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

@Layer("integration")
@Epic("Landing")
@Feature("Layout mount")
@DisplayName("Landing mount")
class LandingMountTests extends TestBase {

    @Test
    @Tag("layout")
    @Tag("mount")
    @DisplayName("Landing page mounts terminal panel")
    void landingMounts() {
        landingPage.openPage()
                .shouldShowLayout()
                .shouldShowTerminalText("autotests.ai");
    }
}

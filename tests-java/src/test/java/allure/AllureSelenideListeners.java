package allure;

import com.codeborne.selenide.logevents.SelenideLogger;
import config.TestConfig;
import io.qameta.allure.selenide.AllureSelenide;

public final class AllureSelenideListeners {

    public static final String LISTENER_NAME = "AllureSelenide";

    private AllureSelenideListeners() {
    }

    public static boolean isGloballyEnabled(TestConfig config) {
        return !"none".equals(config.allureReportMode()) && config.enableAllureSelenideListener();
    }

    public static AllureSelenide create() {
        return new AllureSelenide()
                .screenshots(false)
                .savePageSource(false);
    }

    public static void setEnabled(boolean enabled) {
        SelenideLogger.removeListener(LISTENER_NAME);
        if (enabled) {
            SelenideLogger.addListener(LISTENER_NAME, create());
        }
    }

    public static void restoreGlobal(TestConfig config) {
        setEnabled(isGloballyEnabled(config));
    }
}

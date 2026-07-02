package extensions;

import allure.AllureSelenideListeners;
import annotations.EnableAllureSelenideListener;
import config.ConfigReader;
import org.junit.jupiter.api.extension.AfterEachCallback;
import org.junit.jupiter.api.extension.BeforeEachCallback;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.platform.commons.support.AnnotationSupport;

import java.util.Optional;

public class AllureSelenideListenerExtension implements BeforeEachCallback, AfterEachCallback {

    @Override
    public void beforeEach(ExtensionContext context) {
        findAnnotation(context).ifPresent(a -> AllureSelenideListeners.setEnabled(a.value()));
    }

    @Override
    public void afterEach(ExtensionContext context) {
        findAnnotation(context).ifPresent(
                a -> AllureSelenideListeners.restoreGlobal(ConfigReader.testConfig));
    }

    private static Optional<EnableAllureSelenideListener> findAnnotation(ExtensionContext context) {
        return context.getTestMethod()
                .flatMap(method -> AnnotationSupport.findAnnotation(
                        method, EnableAllureSelenideListener.class));
    }
}

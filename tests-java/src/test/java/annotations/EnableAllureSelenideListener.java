package annotations;

import extensions.AllureSelenideListenerExtension;
import org.junit.jupiter.api.extension.ExtendWith;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Per-test override for {@link io.qameta.allure.selenide.AllureSelenide} listener.
 * After the test, the listener state is restored to the global config
 * ({@code enableAllureSelenideListener}).
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@ExtendWith(AllureSelenideListenerExtension.class)
public @interface EnableAllureSelenideListener {
  boolean value() default true;
}

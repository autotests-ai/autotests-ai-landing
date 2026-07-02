package config;

import org.aeonbits.owner.Config;

@Config.LoadPolicy(Config.LoadType.MERGE)
@Config.Sources({
        "system:properties",
        "classpath:config/${env}.properties",
        "classpath:config/default.properties",
})
public interface TestConfig extends Config {

    @Key("allureReportMode")
    @DefaultValue("allure3")
    String allureReportMode();

    @Key("allureAgentMode")
    @DefaultValue("none")
    String allureAgentMode();

    @Key("attachBrowserConsoleLogs")
    @DefaultValue("false")
    boolean attachBrowserConsoleLogs();

    @Key("attachHarLogs")
    @DefaultValue("false")
    boolean attachHarLogs();

    @Key("attachLastScreenshot")
    @DefaultValue("false")
    boolean attachLastScreenshot();

    @Key("attachPageSource")
    @DefaultValue("false")
    boolean attachPageSource();

    @Key("attachVideo")
    @DefaultValue("false")
    boolean attachVideo();

    @Key("enableAllureSelenideListener")
    @DefaultValue("false")
    boolean enableAllureSelenideListener();

    @Key("baseUrl")
    @DefaultValue("")
    String baseUrl();

    @Key("basePath")
    @DefaultValue("")
    String basePath();

    @Key("apiBaseUrl")
    @DefaultValue("")
    String apiBaseUrl();

    @Key("hubUrl")
    @DefaultValue("http://127.0.0.1:4444/")
    String hubUrl();

    @Key("uiUrl")
    @DefaultValue("http://127.0.0.1:8080/")
    String uiUrl();

    @Key("remoteUrl")
    @DefaultValue("")
    String remoteUrl();

    @Key("smokeUrl")
    @DefaultValue("https://example.com/")
    String smokeUrl();

    @Key("playwrightWsEndpoint")
    @DefaultValue("ws://127.0.0.1:4444/playwright/playwright-chromium/1.61.1")
    String playwrightWsEndpoint();

    @Key("playwrightSessionName")
    @DefaultValue("java-playwright-tests")
    String playwrightSessionName();

    @Key("playwrightSessionTimeout")
    @DefaultValue("5m")
    String playwrightSessionTimeout();

    @Key("playwrightEnableVnc")
    @DefaultValue("false")
    boolean playwrightEnableVnc();

    @Key("playwrightEnableVideo")
    @DefaultValue("false")
    boolean playwrightEnableVideo();

    @Key("browser")
    @DefaultValue("chrome")
    String browser();

    @Key("browserVersion")
    @DefaultValue("148")
    String browserVersion();

    @Key("browserSize")
    @DefaultValue("1920x1280")
    String browserSize();

    @Key("headless")
    @DefaultValue("false")
    boolean headless();

    @Key("closeBrowserAfterEach")
    @DefaultValue("false")
    boolean closeBrowserAfterEach();

    @Key("closeBrowserAfterAll")
    @DefaultValue("true")
    boolean closeBrowserAfterAll();

    @Key("enableHar")
    @DefaultValue("false")
    boolean enableHar();

    @Key("enableVnc")
    @DefaultValue("false")
    boolean enableVnc();

    @Key("enableVideo")
    @DefaultValue("false")
    boolean enableVideo();

    @Key("videoFolder")
    @DefaultValue("")
    String videoFolder();

    @Key("updateBaselines")
    @DefaultValue("false")
    boolean updateBaselines();

    @Key("baselinesDir")
    @DefaultValue("screenshots")
    String baselinesDir();

    @Key("visualDiffThreshold")
    @DefaultValue("0.015")
    double visualDiffThreshold();

    @Key("logToConsole")
    @DefaultValue("true")
    boolean logToConsole();

    @Key("selenideLogToConsole")
    @DefaultValue("true")
    boolean selenideLogToConsole();

    @Key("rootLogLevel")
    @DefaultValue("info")
    String rootLogLevel();

}

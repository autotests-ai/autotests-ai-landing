package config;

import annotations.Layer;
import org.aeonbits.owner.ConfigFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.nio.file.Files;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Layer("unit")
@DisplayName("ConfigReader")
@Execution(ExecutionMode.SAME_THREAD)
class ConfigReaderTest {

    private static TestConfig configWith(Map<String, String> overrides) {
        return ConfigFactory.create(TestConfig.class, overrides);
    }

    @Test
    @DisplayName("resolveBaseUrl adds trailing slash to HTTP baseUrl")
    void resolveBaseUrlAddsTrailingSlash() {
        var config = configWith(Map.of("baseUrl", "http://localhost:3000"));
        assertEquals("http://localhost:3000/", ConfigReader.resolveBaseUrl(config));
    }

    @Test
    @DisplayName("resolveBaseUrl keeps trailing slash on baseUrl")
    void resolveBaseUrlKeepsTrailingSlash() {
        var config = configWith(Map.of("baseUrl", "http://localhost:3000/"));
        assertEquals("http://localhost:3000/", ConfigReader.resolveBaseUrl(config));
    }

    @Test
    @DisplayName("resolveBaseUrl fails fast when baseUrl and basePath are empty")
    void resolveBaseUrlFailsWhenBothEmpty() {
        var config = configWith(Map.of("baseUrl", "", "basePath", ""));
        var error = assertThrows(IllegalStateException.class, () -> ConfigReader.resolveBaseUrl(config));
        assertTrue(error.getMessage().contains("baseUrl or basePath"));
    }

    @Test
    @DisplayName("resolveBaseUrl maps basePath to file URL with trailing slash")
    void resolveBaseUrlFromBasePath() {
        var config = configWith(Map.of("baseUrl", "", "basePath", "../backend/src/main/resources/static"));
        var url = ConfigReader.resolveBaseUrl(config);
        assertTrue(url.startsWith("file:"));
        assertTrue(url.endsWith("/"));
    }

    @Test
    @DisplayName("resolveBaseUrl fails when basePath directory is missing")
    void resolveBaseUrlFailsWhenBasePathMissing() {
        var config = configWith(Map.of("baseUrl", "", "basePath", "/nonexistent/e2e-config-missing-dir"));
        var error = assertThrows(IllegalStateException.class, () -> ConfigReader.resolveBaseUrl(config));
        assertTrue(error.getMessage().contains("basePath not found"));
    }

    @Test
    @DisplayName("resolveBaseUrl fails when index.html is missing in basePath")
    void resolveBaseUrlFailsWhenIndexHtmlMissing() throws Exception {
        var dir = Files.createTempDirectory("e2e-config-");
        try {
            var config = configWith(Map.of("baseUrl", "", "basePath", dir.toString()));
            var error = assertThrows(IllegalStateException.class, () -> ConfigReader.resolveBaseUrl(config));
            assertTrue(error.getMessage().contains("index.html"));
        } finally {
            Files.delete(dir);
        }
    }

    @Test
    @DisplayName("resolveApiBaseUrl prefers apiBaseUrl over hubUrl")
    void resolveApiBaseUrlPrefersExplicitKey() {
        var config = configWith(Map.of(
                "apiBaseUrl", "http://api.example.com",
                "hubUrl", "http://hub.example.com/"));
        assertEquals("http://api.example.com/", ConfigReader.resolveApiBaseUrl(config));
    }

    @Test
    @DisplayName("resolveApiBaseUrl falls back to hubUrl when apiBaseUrl is empty")
    void resolveApiBaseUrlFallsBackToHubUrl() {
        var config = configWith(Map.of("apiBaseUrl", "", "hubUrl", "http://127.0.0.1:4444"));
        assertEquals("http://127.0.0.1:4444/", ConfigReader.resolveApiBaseUrl(config));
    }

    @Test
    @DisplayName("resolveApiBaseUrl fails fast when apiBaseUrl and hubUrl are empty")
    void resolveApiBaseUrlFailsWhenBothEmpty() {
        var config = configWith(Map.of("apiBaseUrl", "", "hubUrl", ""));
        var error = assertThrows(IllegalStateException.class, () -> ConfigReader.resolveApiBaseUrl(config));
        assertTrue(error.getMessage().contains("apiBaseUrl or hubUrl"));
    }
}

package config;

import org.aeonbits.owner.ConfigFactory;

import java.nio.file.Files;
import java.nio.file.Path;

public class ConfigReader {
    public static final TestConfig testConfig = ConfigFactory.create(TestConfig.class);

    public static String resolveBaseUrl() {
        return resolveBaseUrl(testConfig);
    }

    public static String resolveBaseUrl(TestConfig config) {
        var url = config.baseUrl().trim();
        if (!url.isEmpty()) return withSlash(url);

        var basePath = config.basePath().trim();
        if (!basePath.isEmpty()) return withSlash(toDirectoryUrl(basePath));

        throw new IllegalStateException("Set baseUrl or basePath in config/${env}.properties");
    }

    public static String resolveApiBaseUrl() {
        return resolveApiBaseUrl(testConfig);
    }

    public static String resolveApiBaseUrl(TestConfig config) {
        var apiUrl = config.apiBaseUrl().trim();
        if (!apiUrl.isEmpty()) return withSlash(apiUrl);

        var hubUrl = config.hubUrl().trim();
        if (!hubUrl.isEmpty()) return withSlash(hubUrl);

        throw new IllegalStateException("Set apiBaseUrl or hubUrl in config/${env}.properties");
    }

    private static String toDirectoryUrl(String pathString) {
        var path = Path.of(pathString);
        if (!path.isAbsolute()) path = Path.of(System.getProperty("user.dir")).resolve(path);
        path = path.normalize();
        if (!Files.isDirectory(path)) throw new IllegalStateException("basePath not found: " + path);
        verifyStaticAppDir(path);
        return path.toUri().toString();
    }

    private static void verifyStaticAppDir(Path dir) {
        if (!Files.isDirectory(dir)) {
            throw new IllegalStateException("Static app target must be a directory: " + dir);
        }
        var indexHtml = dir.resolve("index.html");
        if (!Files.isRegularFile(indexHtml)) {
            throw new IllegalStateException("index.html not found in: " + dir);
        }
    }

    private static String withSlash(String s) {
        return s.endsWith("/") ? s : s + "/";
    }
}

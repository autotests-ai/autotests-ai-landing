package config;

import annotations.Layer;
import org.aeonbits.owner.Config.Key;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Execution;
import org.junit.jupiter.api.parallel.ExecutionMode;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Properties;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contract: {@code _ethalon.properties} ↔ {@link TestConfig}.
 * Fails until ethalon contains every {@code @Key} from TestConfig (max-key superset policy).
 */
@Layer("unit")
@DisplayName("Config contract")
@Execution(ExecutionMode.SAME_THREAD)
class ConfigContractTest {

    private static final String ETHALON_RESOURCE = "config/_ethalon.properties";

    private static Set<String> ethalonKeys() throws Exception {
        var props = new Properties();
        try (InputStream in = ConfigContractTest.class.getClassLoader().getResourceAsStream(ETHALON_RESOURCE)) {
            if (in == null) {
                throw new IllegalStateException("Missing classpath resource: " + ETHALON_RESOURCE);
            }
            props.load(in);
        }
        return props.stringPropertyNames();
    }

    private static Set<String> testConfigKeys() {
        return Arrays.stream(TestConfig.class.getDeclaredMethods())
                .map(ConfigContractTest::keyFromMethod)
                .flatMap(java.util.Optional::stream)
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static java.util.Optional<String> keyFromMethod(Method method) {
        var annotation = method.getAnnotation(Key.class);
        return annotation == null ? java.util.Optional.empty() : java.util.Optional.of(annotation.value());
    }

    @Test
    @DisplayName("every _ethalon key is declared in TestConfig")
    void ethalonKeysAreDeclaredInTestConfig() throws Exception {
        var ethalon = ethalonKeys();
        var testConfig = testConfigKeys();
        var unknown = ethalon.stream().filter(k -> !testConfig.contains(k)).sorted().toList();
        assertTrue(
                unknown.isEmpty(),
                () -> "_ethalon keys missing from TestConfig @Key: " + unknown);
    }

    @Test
    @DisplayName("every TestConfig @Key is present in _ethalon (max-key superset)")
    void testConfigKeysArePresentInEthalon() throws Exception {
        var ethalon = ethalonKeys();
        var testConfig = testConfigKeys();
        var missing = testConfig.stream().filter(k -> !ethalon.contains(k)).sorted().toList();
        assertTrue(
                missing.isEmpty(),
                () -> "Add to _ethalon.properties (structure only; keep profile values elsewhere): " + missing);
    }
}

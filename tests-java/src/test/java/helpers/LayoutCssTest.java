package helpers;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;

import annotations.Layer;

@Layer("unit")
@DisplayName("LayoutCss")
class LayoutCssTest {

    @ParameterizedTest
    @MethodSource("gridTemplateColumnsCases")
    @DisplayName("gridColumnCount parses grid-template-columns")
    void gridColumnCountParsesGridTemplateColumns(String gridTemplateColumns, int expected) {
        assertEquals(expected, LayoutCss.gridColumnCount(gridTemplateColumns));
    }

    static Stream<Arguments> gridTemplateColumnsCases() {
        return Stream.of(
                Arguments.of("repeat(3, minmax(0, 1fr))", 3),
                Arguments.of("603px 603px", 2),
                Arguments.of("1fr", 1),
                Arguments.of("316px", 1),
                Arguments.of("none", 0)
        );
    }
}

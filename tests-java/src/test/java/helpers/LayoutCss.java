package helpers;

import java.util.regex.Pattern;

public final class LayoutCss {

    /** Must match `@media (max-width: …)` in frontend/css/header.css. */
    public static final int RESPONSIVE_BREAKPOINT_PX = 768;

    /** Desktop layout starts at breakpoint + 1px. */
    public static final int WIDE_LAYOUT_MIN_VIEWPORT_PX = RESPONSIVE_BREAKPOINT_PX + 1;

    private static final Pattern REPEAT_COLUMNS = Pattern.compile("repeat\\((\\d+)");

    private LayoutCss() {
    }

    public static int gridColumnCount(String gridTemplateColumns) {
        if (gridTemplateColumns == null || gridTemplateColumns.isBlank() || "none".equals(gridTemplateColumns)) {
            return 0;
        }

        var normalized = gridTemplateColumns.trim();
        var repeatMatcher = REPEAT_COLUMNS.matcher(normalized);
        if (repeatMatcher.find()) {
            return Integer.parseInt(repeatMatcher.group(1));
        }

        return normalized.split("\\s+").length;
    }
}

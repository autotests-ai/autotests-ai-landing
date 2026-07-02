package ai.autotests.landing;

import java.time.Instant;
import java.util.List;

public record TerminalResponse(List<TerminalLine> lines, Instant fetchedAt, String source) {
}

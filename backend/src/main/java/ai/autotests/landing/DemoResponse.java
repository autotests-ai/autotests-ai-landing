package ai.autotests.landing;

import java.time.Instant;
import java.util.List;

public record DemoResponse(List<DemoLine> lines, Instant fetchedAt, String source) {
}

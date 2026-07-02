package ai.autotests.landing;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class DemoService {

    private final DemoLineRepository repository;

    public DemoService(DemoLineRepository repository) {
        this.repository = repository;
    }

    public DemoResponse fetchDemo() {
        List<DemoLine> lines = repository.findAllByOrderByLineOrderAsc().stream()
                .map(entity -> new DemoLine(entity.getLineOrder(), entity.getContent()))
                .toList();
        return new DemoResponse(lines, Instant.now(), "postgresql");
    }
}

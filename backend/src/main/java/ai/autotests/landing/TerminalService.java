package ai.autotests.landing;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class TerminalService {

    private final TerminalLineRepository repository;

    public TerminalService(TerminalLineRepository repository) {
        this.repository = repository;
    }

    public TerminalResponse fetchTerminal() {
        List<TerminalLine> lines = repository.findAllByOrderByLineOrderAsc().stream()
                .map(entity -> new TerminalLine(entity.getLineOrder(), entity.getContent()))
                .toList();
        return new TerminalResponse(lines, Instant.now(), "postgresql");
    }
}

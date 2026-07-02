package ai.autotests.landing;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TerminalService")
class TerminalServiceTest {

    @Mock
    private TerminalLineRepository repository;

    private TerminalService service;

    @BeforeEach
    void setUp() {
        service = new TerminalService(repository);
    }

    @Test
    @DisplayName("fetchTerminal maps repository rows to ordered lines")
    void fetchTerminalMapsOrderedLines() {
        when(repository.findAllByOrderByLineOrderAsc()).thenReturn(List.of(
                new TerminalLineEntity(1, "$ psql -h db -U landing"),
                new TerminalLineEntity(2, "postgresql://landing@db:5432/landing")));

        TerminalResponse response = service.fetchTerminal();

        assertEquals(List.of(
                new TerminalLine(1, "$ psql -h db -U landing"),
                new TerminalLine(2, "postgresql://landing@db:5432/landing")),
                response.lines());
        assertEquals("postgresql", response.source());
        verify(repository).findAllByOrderByLineOrderAsc();
    }

    @Test
    @DisplayName("fetchTerminal returns empty lines when repository is empty")
    void fetchTerminalReturnsEmptyWhenNoRows() {
        when(repository.findAllByOrderByLineOrderAsc()).thenReturn(List.of());

        TerminalResponse response = service.fetchTerminal();

        assertTrue(response.lines().isEmpty());
        assertEquals("postgresql", response.source());
    }

    @Test
    @DisplayName("fetchTerminal sets fetchedAt near current time")
    void fetchTerminalSetsFetchedAt() {
        when(repository.findAllByOrderByLineOrderAsc()).thenReturn(List.of());
        Instant before = Instant.now();

        TerminalResponse response = service.fetchTerminal();

        Instant after = Instant.now();
        assertTrue(!response.fetchedAt().isBefore(before));
        assertTrue(!response.fetchedAt().isAfter(after));
    }
}

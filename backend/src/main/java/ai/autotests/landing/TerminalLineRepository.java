package ai.autotests.landing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TerminalLineRepository extends JpaRepository<TerminalLineEntity, Long> {

    List<TerminalLineEntity> findAllByOrderByLineOrderAsc();
}

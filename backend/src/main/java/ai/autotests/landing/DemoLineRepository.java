package ai.autotests.landing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DemoLineRepository extends JpaRepository<DemoLineEntity, Long> {

    List<DemoLineEntity> findAllByOrderByLineOrderAsc();
}

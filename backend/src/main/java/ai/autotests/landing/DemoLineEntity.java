package ai.autotests.landing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "demo_lines")
public class DemoLineEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "line_order", nullable = false)
    private int lineOrder;

    @Column(nullable = false, length = 512)
    private String content;

    protected DemoLineEntity() {
    }

    public DemoLineEntity(int lineOrder, String content) {
        this.lineOrder = lineOrder;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public int getLineOrder() {
        return lineOrder;
    }

    public String getContent() {
        return content;
    }
}

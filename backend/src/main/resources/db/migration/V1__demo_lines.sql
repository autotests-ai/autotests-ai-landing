CREATE TABLE demo_lines (
    id BIGSERIAL PRIMARY KEY,
    line_order INT NOT NULL,
    content VARCHAR(512) NOT NULL
);

INSERT INTO demo_lines (line_order, content) VALUES
    (1, '$ curl -s https://autotests.ai/api/demo'),
    (2, '→ Loading demo payload from PostgreSQL…'),
    (3, '→ HTTP 200 OK'),
    (4, 'source: postgresql | seed: autotests-ai-landing');

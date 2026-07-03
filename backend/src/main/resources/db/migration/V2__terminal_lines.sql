ALTER TABLE demo_lines RENAME TO terminal_lines;

UPDATE terminal_lines SET content = '$ curl -s https://autotests.ai/api/terminal' WHERE line_order = 1;
UPDATE terminal_lines SET content = '→ Загрузка из PostgreSQL…' WHERE line_order = 2;
UPDATE terminal_lines SET content = 'source: postgresql | autotests-ai-app' WHERE line_order = 4;

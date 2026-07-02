const terminal = document.querySelector('[data-testid="terminal-output"]');

function formatLines(payload) {
  const header = [
    '$ curl -s /api/terminal',
    `→ fetchedAt: ${payload.fetchedAt}`,
    `→ source: ${payload.source}`,
    '',
  ];
  const body = (payload.lines || []).map((line) => `${String(line.order).padStart(2, ' ')} | ${line.content}`);
  return [...header, ...body].join('\n');
}

function setTerminal(text, loading = false) {
  terminal.textContent = text;
  terminal.classList.toggle('is-loading', loading);
}

async function loadTerminal() {
  setTerminal('→ Loading…', true);

  try {
    const response = await fetch('/api/terminal');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    setTerminal(formatLines(payload));
  } catch (error) {
    setTerminal(`✗ ${error.message}`, false);
  }
}

loadTerminal();

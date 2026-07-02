const terminal = document.querySelector('[data-testid="terminal-output"]');
const refreshButton = document.querySelector('[data-testid="refresh-button"]');
const status = document.querySelector('[data-testid="status-line"]');

const WELCOME = [
  'autotests-ai landing — terminal demo',
  'Нажмите «Обновить» для GET /api/demo',
].join('\n');

function formatLines(payload) {
  const header = [
    '$ curl -s /api/demo',
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

function setStatus(text) {
  status.textContent = text;
}

async function loadDemo() {
  refreshButton.disabled = true;
  setTerminal('→ Loading…', true);
  setStatus('GET /api/demo …');

  try {
    const response = await fetch('/api/demo');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    setTerminal(formatLines(payload));
    setStatus(`OK ${response.status}`);
  } catch (error) {
    setTerminal(`✗ ${error.message}`, false);
    setStatus('Ошибка загрузки');
  } finally {
    refreshButton.disabled = false;
  }
}

refreshButton.addEventListener('click', loadDemo);
setTerminal(WELCOME);

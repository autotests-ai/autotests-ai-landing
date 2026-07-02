import { THEME_ICON_MOON, THEME_ICON_SUN } from './theme-icons.js';

const mount = document.getElementById('app-header');
if (!mount) {
  throw new Error('header.js: missing #app-header mount point');
}

const TEMPLATE_URLS = [
  new URL('../templates/header.html', import.meta.url),
];

/**
 * @typedef {{ href?: string }} HeaderBrandConfig
 * @typedef {{ href: string, label: string, active?: boolean, testid?: string }} HeaderNavItem
 * @typedef {{ default?: 'ru' | 'en' }} HeaderLangConfig
 * @typedef {{ default?: 'dark' | 'light' }} HeaderThemeConfig
 * @typedef {{ brand?: HeaderBrandConfig, nav?: HeaderNavItem[], lang?: HeaderLangConfig, theme?: HeaderThemeConfig }} HeaderConfig
 */

export const HEADER_LANG_CHANGE = 'header:lang-change';

if (typeof window !== 'undefined') {
  window.HEADER_LANG_CHANGE = HEADER_LANG_CHANGE;
}

/** @type {HeaderConfig} */
export const DEFAULT_HEADER_CONFIG = {
  brand: {
    href: 'https://qa.guru/',
  },
  nav: [
    {
      href: 'https://qa.guru/',
      label: 'Главная',
      active: true,
      testid: 'header-nav-home',
    },
    {
      href: '#',
      label: 'Курсы',
      testid: 'header-nav-courses',
    },
    {
      href: 'https://qa.guru/about',
      label: 'О школе',
      testid: 'header-nav-about',
    },
  ],
  lang: {
    default: 'en',
  },
  theme: {
    default: 'light',
  },
};

/** @param {HeaderConfig | undefined} override @returns {HeaderConfig} */
function resolveHeaderConfig(override) {
  if (!override) {
    return DEFAULT_HEADER_CONFIG;
  }
  return {
    ...DEFAULT_HEADER_CONFIG,
    ...override,
    brand: {
      ...DEFAULT_HEADER_CONFIG.brand,
      ...override.brand,
    },
    lang: {
      ...DEFAULT_HEADER_CONFIG.lang,
      ...override.lang,
    },
    theme: {
      ...DEFAULT_HEADER_CONFIG.theme,
      ...override.theme,
    },
    nav: override.nav ?? DEFAULT_HEADER_CONFIG.nav,
  };
}

/** @param {ParentNode} root @param {HeaderConfig} config */
function applyHeaderConfig(root, config) {
  const brandLink = root.querySelector('[data-testid="header-brand-link"]');
  if (brandLink && config.brand?.href) {
    brandLink.href = config.brand.href;
  }

  const nav = root.querySelector('[data-testid="header-nav"]');
  if (!nav || !Array.isArray(config.nav)) {
    return;
  }

  nav.replaceChildren(
    ...config.nav.map((item, index) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.className = item.active ? 'link link--nav is-active' : 'link link--nav';
      link.dataset.testid = item.testid ?? `header-nav-${index}`;
      if (item.active) {
        link.setAttribute('aria-current', 'page');
      }
      return link;
    })
  );
}

/** @param {'ru' | 'en'} lang */
function dispatchLangChange(lang) {
  document.dispatchEvent(
    new CustomEvent(HEADER_LANG_CHANGE, { detail: { lang } })
  );
}

/** @param {HTMLElement} langBtn @param {HTMLElement} langLabel @param {'ru' | 'en'} lang */
function setLangState(langBtn, langLabel, lang) {
  const code = lang === 'en' ? 'en' : 'ru';
  langBtn.dataset.lang = code;
  langLabel.textContent = code === 'ru' ? 'RU' : 'EN';
  langBtn.setAttribute(
    'aria-label',
    code === 'ru' ? 'Переключить на English' : 'Switch to Russian'
  );
}

/** @param {ParentNode} root @param {HeaderLangConfig | undefined} langConfig */
function applyLangDefault(root, langConfig) {
  const langBtn = root.querySelector('[data-testid="header-lang-toggle"]');
  const langLabel = root.querySelector('[data-testid="header-lang-label"]');
  if (!langBtn || !langLabel) {
    return;
  }
  const code = langConfig?.default === 'ru' ? 'ru' : 'en';
  setLangState(langBtn, langLabel, code);
  dispatchLangChange(code);
}

/** @param {HTMLElement} themeBtn */
function setThemeIcon(themeBtn) {
  const isLight = document.documentElement.classList.contains('theme-light');
  const icon = themeBtn.querySelector('.icon');
  if (!icon) {
    return;
  }
  icon.innerHTML = isLight ? THEME_ICON_SUN : THEME_ICON_MOON;
  themeBtn.setAttribute(
    'aria-label',
    isLight ? 'Switch to dark theme' : 'Switch to light theme'
  );
}

/** @param {HeaderThemeConfig | undefined} themeConfig */
function applyThemeDefault(themeConfig) {
  const isLight = themeConfig?.default !== 'dark';
  document.documentElement.classList.toggle('theme-light', isLight);
}

async function fetchHeaderTemplate() {
  for (const url of TEMPLATE_URLS) {
    const response = await fetch(url);
    if (response.ok) {
      return response.text();
    }
  }
  throw new Error('header.js: failed to load template (404 on all candidate paths)');
}

async function mountHeader() {
  mount.innerHTML = await fetchHeaderTemplate();

  const config = resolveHeaderConfig(window.headerConfig);
  applyHeaderConfig(mount, config);
  applyLangDefault(mount, config.lang);
  applyThemeDefault(config.theme);

  const themeBtn = mount.querySelector('[data-testid="header-theme-toggle"]');
  if (themeBtn) {
    setThemeIcon(themeBtn);
  }

  bindHeaderControls(mount);
}

function bindHeaderControls(root) {
  const langBtn = root.querySelector('[data-testid="header-lang-toggle"]');
  const langLabel = root.querySelector('[data-testid="header-lang-label"]');
  if (langBtn && langLabel) {
    langBtn.addEventListener('click', () => {
      const next = langBtn.dataset.lang === 'ru' ? 'en' : 'ru';
      setLangState(langBtn, langLabel, next);
      dispatchLangChange(next);
    });
  }

  const themeBtn = root.querySelector('[data-testid="header-theme-toggle"]');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('theme-light');
      setThemeIcon(themeBtn);
    });
  }
}

/** Re-read `window.headerConfig` and remount #app-header (playground live sync). */
export async function remountHeader() {
  await mountHeader();
}

mountHeader();

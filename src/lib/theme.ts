// Manual theme override. 'system' follows the OS (prefers-color-scheme);
// 'light'/'dark' force a theme via [data-theme] on <html>.
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'tracker.theme'

export function getTheme(): Theme {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' ? v : 'system'
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
  localStorage.setItem(KEY, theme)
}

/** Mac/iPhone/iPad usam ⌘ (Command); Windows e Linux usam Ctrl. */
export function ehApple() {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const plataforma = nav.userAgentData?.platform || navigator.platform || navigator.userAgent
  return /mac|iphone|ipad|ipod/i.test(plataforma)
}

/** Rótulo da tecla modificadora para atalhos: "⌘" ou "Ctrl". */
export const teclaModificadora = () => (ehApple() ? '⌘' : 'Ctrl')

/** O evento tem a tecla modificadora do sistema pressionada? (⌘ no Mac, Ctrl no resto) */
export const comModificadora = (e: KeyboardEvent) => (ehApple() ? e.metaKey : e.ctrlKey)

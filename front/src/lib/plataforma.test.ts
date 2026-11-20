import { comModificadora, ehApple, teclaModificadora } from './plataforma'

const simular = (platform: string) =>
  Object.defineProperty(navigator, 'platform', { value: platform, configurable: true })

describe('atalho da busca por sistema', () => {
  afterEach(() => simular(''))

  it('Mac usa ⌘ (metaKey)', () => {
    simular('MacIntel')
    expect(ehApple()).toBe(true)
    expect(teclaModificadora()).toBe('⌘')
    expect(comModificadora(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))).toBe(true)
    expect(comModificadora(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))).toBe(false)
  })

  it('Windows usa Ctrl (ctrlKey)', () => {
    simular('Win32')
    expect(ehApple()).toBe(false)
    expect(teclaModificadora()).toBe('Ctrl')
    expect(comModificadora(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))).toBe(true)
    expect(comModificadora(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))).toBe(false)
  })
})

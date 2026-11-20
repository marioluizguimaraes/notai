import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

afterEach(() => cleanup())

// Cada arquivo de teste começa com os dados de demonstração originais.
beforeEach(() => sessionStorage.clear())

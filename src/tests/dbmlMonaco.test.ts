import { describe, expect, it, vi } from 'vitest'
import { configureDbmlLanguage, dbmlEditorTheme, dbmlLanguageId } from '../features/editor/dbmlMonaco'

describe('configureDbmlLanguage', () => {
  it('registers DBML language tokens and editor theme once', () => {
    const monaco = createMonacoMock()

    configureDbmlLanguage(monaco)
    configureDbmlLanguage(monaco)

    expect(monaco.languages.register).toHaveBeenCalledTimes(1)
    expect(monaco.languages.register).toHaveBeenCalledWith({ id: dbmlLanguageId })
    expect(monaco.languages.setLanguageConfiguration).toHaveBeenCalledTimes(1)
    expect(monaco.languages.setLanguageConfiguration.mock.calls[0][0]).toBe(dbmlLanguageId)
    expect(monaco.languages.setMonarchTokensProvider).toHaveBeenCalledTimes(1)
    expect(monaco.languages.setMonarchTokensProvider.mock.calls[0][0]).toBe(dbmlLanguageId)
    expect(monaco.editor.defineTheme).toHaveBeenCalledTimes(1)
    expect(monaco.editor.defineTheme.mock.calls[0][0]).toBe(dbmlEditorTheme)
  })
})

function createMonacoMock() {
  return {
    languages: {
      register: vi.fn(),
      setLanguageConfiguration: vi.fn(),
      setMonarchTokensProvider: vi.fn(),
    },
    editor: {
      defineTheme: vi.fn(),
    },
  }
}

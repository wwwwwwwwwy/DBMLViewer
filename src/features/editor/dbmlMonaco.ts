import { dbmlLanguageConfig, dbmlMonarchTokensProvider } from '@dbml/parse'
import type { Monaco } from '@monaco-editor/react'

export const dbmlLanguageId = 'dbml'
export const dbmlEditorTheme = 'dbml-dark'

const configuredMonacoInstances = new WeakSet<object>()

export function configureDbmlLanguage(monaco: Monaco): void {
  if (configuredMonacoInstances.has(monaco)) return

  monaco.languages.register({ id: dbmlLanguageId })
  monaco.languages.setLanguageConfiguration(dbmlLanguageId, dbmlLanguageConfig)
  monaco.languages.setMonarchTokensProvider(dbmlLanguageId, dbmlMonarchTokensProvider)
  monaco.editor.defineTheme(dbmlEditorTheme, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.dbml', foreground: '7dd3fc', fontStyle: 'bold' },
      { token: 'identifier.dbml', foreground: 'e5e7eb' },
      { token: 'string.dbml', foreground: 'bef264' },
      { token: 'number.dbml', foreground: 'fbbf24' },
      { token: 'comment.dbml', foreground: '94a3b8', fontStyle: 'italic' },
      { token: 'operators.dbml', foreground: 'fda4af' },
      { token: 'delimiter.dbml', foreground: 'cbd5e1' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editorLineNumber.foreground': '#64748b',
      'editorLineNumber.activeForeground': '#cbd5e1',
      'editorCursor.foreground': '#2dd4bf',
      'editor.selectionBackground': '#155e75',
      'editor.inactiveSelectionBackground': '#164e63',
      'editor.lineHighlightBackground': '#1e293b',
    },
  })

  configuredMonacoInstances.add(monaco)
}

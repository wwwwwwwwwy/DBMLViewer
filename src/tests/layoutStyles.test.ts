import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

describe('workspace layout styles', () => {
  it('prioritizes the diagram canvas while keeping both utility panels available', () => {
    expect(css).toContain('--editor-panel-width: 420px;')
    expect(css).toContain('--inspector-panel-width: 340px;')
    expect(css).toContain('grid-template-columns: var(--editor-panel-width) minmax(960px, 1fr) var(--inspector-panel-width);')
  })

  it('separates editor title and icon tools so the large-screen header stays readable', () => {
    expect(css).toContain('.editorPanel .panelHeader {')
    expect(css).toContain('min-height: 96px;')
    expect(css).toContain('.editorPanel .toolbar {')
    expect(css).toContain('overflow-x: auto;')
    expect(css).toContain('.editorPanel .panelHeader h1 {')
    expect(css).toContain('white-space: nowrap;')
  })

  it('keeps daily-use toolbar actions compact and responsive', () => {
    expect(css).toContain('height: 40px;')
    expect(css).toContain('min-height: 40px;')
    expect(css).toContain('flex: 1 1 280px;')
    expect(css).toContain('@media (max-width: 900px)')
  })
})

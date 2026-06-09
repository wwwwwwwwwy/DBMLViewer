import { describe, expect, it } from 'vitest'
import { parseDbmlSource } from '../features/dbml/dbmlParser'
import { sampleDbml } from '../features/dbml/dbmlSamples'
import { normalizeDbmlDatabase } from '../features/dbml/dbmlNormalizer'
import { buildFlowElements } from '../features/diagram/flowMapper'

describe('buildFlowElements', () => {
  it('maps normalized tables and relations to React Flow elements', () => {
    const parsed = parseDbmlSource(sampleDbml)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const model = normalizeDbmlDatabase(parsed.database)
    const elements = buildFlowElements(model, {})

    expect(elements.nodes).toHaveLength(3)
    expect(elements.edges).toHaveLength(3)
    expect(elements.nodes[0].type).toBe('table')
    expect(elements.edges[0].type).toBe('relation')
  })

  it('passes note display state to table nodes', () => {
    const parsed = parseDbmlSource(sampleDbml)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const model = normalizeDbmlDatabase(parsed.database)
    const elements = buildFlowElements(model, {}, [], undefined, 'zh', true)

    expect(elements.nodes[0].data.showNotes).toBe(true)
  })
})

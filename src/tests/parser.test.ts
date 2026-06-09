import { describe, expect, it } from 'vitest'
import { parseDbmlSource } from '../features/dbml/dbmlParser'
import { sampleDbml } from '../features/dbml/dbmlSamples'

describe('parseDbmlSource', () => {
  it('parses the bundled DBML sample into a raw database object', () => {
    const result = parseDbmlSource(sampleDbml)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.database.schemas[0].tables).toHaveLength(3)
    expect(result.parser).toMatch(/dbml/)
  })

  it('returns a structured error for invalid DBML', () => {
    const result = parseDbmlSource('Table broken { id int [pk')

    expect(result.ok).toBe(false)
    if (result.ok) return

    expect(result.error.message).toContain('Failed to parse DBML')
    expect(result.error.details.length).toBeGreaterThan(0)
  })
})


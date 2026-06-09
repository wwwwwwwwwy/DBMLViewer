import { describe, expect, it } from 'vitest'
import { parseDbmlSource } from '../features/dbml/dbmlParser'
import { sampleDbml } from '../features/dbml/dbmlSamples'
import { normalizeDbmlDatabase } from '../features/dbml/dbmlNormalizer'

describe('normalizeDbmlDatabase', () => {
  it('normalizes tables, fields, indexes, enums, and refs', () => {
    const parsed = parseDbmlSource(sampleDbml)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const model = normalizeDbmlDatabase(parsed.database)

    expect(model.project?.name).toBe('Commerce Workspace')
    expect(model.tables.map((table) => table.name)).toEqual(['users', 'orders', 'order_items'])
    expect(model.enums).toHaveLength(1)
    expect(model.relations).toHaveLength(3)

    const users = model.tables.find((table) => table.name === 'users')
    expect(users?.columns.find((column) => column.name === 'id')?.isPk).toBe(true)
    expect(users?.columns.find((column) => column.name === 'email')?.isUnique).toBe(true)
  })

  it('maps relation cardinalities from DBML relation operators', () => {
    const parsed = parseDbmlSource(sampleDbml)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const model = normalizeDbmlDatabase(parsed.database)

    expect(model.relations.map((relation) => relation.cardinality).sort()).toEqual([
      'many-to-many',
      'many-to-one',
      'one-to-one',
    ])
  })
})


import { describe, expect, it } from 'vitest'
import {
  filterModelByConnectedTables,
  filterModelBySelectedRelations,
} from '../features/diagram/diagramFilter'
import type { SchemaModel } from '../features/dbml/dbmlTypes'

describe('filterModelBySelectedRelations', () => {
  it('keeps the selected table and all tables in its connected relation chain when enabled', () => {
    const filtered = filterModelBySelectedRelations(model, true, 'users')

    expect(filtered.tables.map((table) => table.id)).toEqual(['users', 'orders', 'payments'])
    expect(filtered.relations.map((relation) => relation.id)).toEqual(['users_orders', 'orders_payments'])
  })

  it('keeps the complete model when disabled or no table is selected', () => {
    expect(filterModelBySelectedRelations(model, false, 'users').tables).toHaveLength(4)
    expect(filterModelBySelectedRelations(model, true, undefined).tables).toHaveLength(4)
  })

  it('removes tables without any relation when isolated tables are hidden', () => {
    const filtered = filterModelByConnectedTables(model, true)

    expect(filtered.tables.map((table) => table.id)).toEqual(['users', 'orders', 'payments'])
    expect(filtered.relations.map((relation) => relation.id)).toEqual(['users_orders', 'orders_payments'])
  })

  it('keeps the complete model when isolated table filtering is disabled', () => {
    expect(filterModelByConnectedTables(model, false).tables).toHaveLength(4)
  })
})

const model: SchemaModel = {
  tables: [
    {
      id: 'users',
      name: 'users',
      columns: [],
      indexes: [],
    },
    {
      id: 'orders',
      name: 'orders',
      columns: [],
      indexes: [],
    },
    {
      id: 'audit_logs',
      name: 'audit_logs',
      columns: [],
      indexes: [],
    },
    {
      id: 'payments',
      name: 'payments',
      columns: [],
      indexes: [],
    },
  ],
  relations: [
    {
      id: 'users_orders',
      fromTableId: 'orders',
      fromColumnIds: [],
      toTableId: 'users',
      toColumnIds: [],
      cardinality: 'many-to-one',
    },
    {
      id: 'orders_payments',
      fromTableId: 'payments',
      fromColumnIds: [],
      toTableId: 'orders',
      toColumnIds: [],
      cardinality: 'many-to-one',
    },
  ],
  enums: [],
}

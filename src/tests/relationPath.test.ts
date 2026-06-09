import { describe, expect, it } from 'vitest'
import type { SchemaModel } from '../features/dbml/dbmlTypes'
import { findRelationPath, findTableByQuery, suggestTables } from '../features/inspector/relationPath'

describe('relationPath', () => {
  it('matches tables by name or table note', () => {
    expect(findTableByQuery(model, 'ord')?.id).toBe('orders')
    expect(findTableByQuery(model, '用户')?.id).toBe('users')
  })

  it('suggests tables by name or table note', () => {
    expect(suggestTables(model, '数据').map((table) => table.id)).toEqual(['users'])
    expect(suggestTables(model, 'item').map((table) => table.id)).toEqual(['order_items'])
  })

  it('finds a direct relation between two tables', () => {
    const path = findRelationPath(model, 'orders', 'users')

    expect(path?.kind).toBe('direct')
    expect(path?.steps).toEqual([
      {
        fromTableId: 'orders',
        toTableId: 'users',
        relationId: 'orders_users',
        fromColumnIds: ['orders.user_id'],
        toColumnIds: ['users.id'],
      },
    ])
  })

  it('finds an indirect relation through intermediate tables', () => {
    const path = findRelationPath(model, 'order_items', 'users')

    expect(path?.kind).toBe('indirect')
    expect(path?.steps.map((step) => step.relationId)).toEqual([
      'items_orders',
      'orders_users',
    ])
  })

  it('returns null when tables are not related', () => {
    expect(findRelationPath(model, 'audit_logs', 'users')).toBeNull()
  })
})

const model: SchemaModel = {
  project: { name: 'Relation path project' },
  tables: [
    {
      id: 'users',
      name: 'users',
      note: '用户数据',
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
      id: 'order_items',
      name: 'order_items',
      columns: [],
      indexes: [],
    },
    {
      id: 'audit_logs',
      name: 'audit_logs',
      columns: [],
      indexes: [],
    },
  ],
  relations: [
    {
      id: 'orders_users',
      fromTableId: 'orders',
      fromColumnIds: ['orders.user_id'],
      toTableId: 'users',
      toColumnIds: ['users.id'],
      cardinality: 'many-to-one',
    },
    {
      id: 'items_orders',
      fromTableId: 'order_items',
      fromColumnIds: ['order_items.order_id'],
      toTableId: 'orders',
      toColumnIds: ['orders.id'],
      cardinality: 'many-to-one',
    },
  ],
  enums: [],
}

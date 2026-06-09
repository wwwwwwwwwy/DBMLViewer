import { describe, expect, it } from 'vitest'
import { findMatchingTableId } from '../features/diagram/diagramSearch'
import type { SchemaModel } from '../features/dbml/dbmlTypes'

describe('findMatchingTableId', () => {
  it('matches a table by table note', () => {
    expect(findMatchingTableId(modelWithNotes, '主数据')).toBe('users')
  })

  it('matches a table by column note', () => {
    expect(findMatchingTableId(modelWithNotes, '物流跟踪')).toBe('orders')
  })
})

const modelWithNotes: SchemaModel = {
  tables: [
    {
      id: 'users',
      name: 'users',
      note: '用户主数据表',
      columns: [],
      indexes: [],
    },
    {
      id: 'orders',
      name: 'orders',
      columns: [
        {
          id: 'orders.tracking_no',
          name: 'tracking_no',
          type: 'varchar',
          isPk: false,
          isUnique: false,
          isNullable: true,
          isIncrement: false,
          note: '物流跟踪编号',
        },
      ],
      indexes: [],
    },
  ],
  relations: [],
  enums: [],
}

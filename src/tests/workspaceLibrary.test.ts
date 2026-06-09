import { describe, expect, it } from 'vitest'
import {
  createWorkspaceSummary,
  normalizeWorkspaceName,
  sortWorkspaceSummaries,
} from '../features/workspace/workspaceLibrary'
import type { WorkspaceSummary } from '../features/workspace/workspaceTypes'

describe('workspaceLibrary', () => {
  it('sorts saved DBML summaries by update time descending', () => {
    const summaries: WorkspaceSummary[] = [
      {
        id: 'older',
        name: 'Older DBML',
        tableCount: 1,
        relationCount: 0,
        updatedAt: '2026-06-09T01:00:00.000Z',
      },
      {
        id: 'newer',
        name: 'Newer DBML',
        tableCount: 2,
        relationCount: 1,
        updatedAt: '2026-06-09T02:00:00.000Z',
      },
    ]

    expect(sortWorkspaceSummaries(summaries).map((item) => item.id)).toEqual([
      'newer',
      'older',
    ])
  })

  it('normalizes blank DBML names to an untitled fallback', () => {
    expect(normalizeWorkspaceName('  ', '未命名 DBML')).toBe('未命名 DBML')
    expect(normalizeWorkspaceName('  订单模型  ', '未命名 DBML')).toBe('订单模型')
  })

  it('creates summaries with table and relation counts', () => {
    const summary = createWorkspaceSummary({
      id: 'workspace-1',
      name: '用户模型',
      source: '',
      updatedAt: '2026-06-09T02:00:00.000Z',
      model: {
        tables: [
          { id: 'users', name: 'users', columns: [], indexes: [] },
          { id: 'orders', name: 'orders', columns: [], indexes: [] },
        ],
        relations: [
          {
            id: 'orders_users',
            fromTableId: 'orders',
            fromColumnIds: [],
            toTableId: 'users',
            toColumnIds: [],
            cardinality: 'many-to-one',
          },
        ],
        enums: [],
      },
    })

    expect(summary).toEqual({
      id: 'workspace-1',
      name: '用户模型',
      tableCount: 2,
      relationCount: 1,
      updatedAt: '2026-06-09T02:00:00.000Z',
    })
  })
})

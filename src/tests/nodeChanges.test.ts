import type { NodeChange } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import type { DbmlTableNode } from '../features/diagram/flowMapper'
import { applyDiagramNodeChanges } from '../features/diagram/nodeChanges'

describe('applyDiagramNodeChanges', () => {
  it('updates node position while a node is still being dragged', () => {
    const nodes = [
      {
        id: 'users',
        type: 'table',
        position: { x: 80, y: 120 },
        data: {
          table: {
            id: 'users',
            name: 'users',
            columns: [],
            indexes: [],
          },
          highlightedColumnIds: [],
          showNotes: false,
        },
      },
    ] satisfies DbmlTableNode[]

    const changes = [
      {
        id: 'users',
        type: 'position',
        position: { x: 260, y: 310 },
        dragging: true,
      },
    ] satisfies NodeChange<DbmlTableNode>[]

    const updatedNodes = applyDiagramNodeChanges(changes, nodes)

    expect(updatedNodes[0].position).toEqual({ x: 260, y: 310 })
  })
})

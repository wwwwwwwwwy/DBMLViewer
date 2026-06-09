import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RelationEdge } from '../features/diagram/RelationEdge'
import type { DbmlRelationEdge } from '../features/diagram/flowMapper'
import type { EdgeProps } from '@xyflow/react'

vi.mock('@xyflow/react', () => ({
  BaseEdge: ({ className, id }: { className?: string; id: string }) => (
    <path className={className} data-testid={id} />
  ),
  EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  getBezierPath: () => ['M 0 0 L 10 10', 5, 5],
}))

describe('RelationEdge', () => {
  it('shows the selected style from relation edge data', () => {
    render(
      <svg>
        <RelationEdge {...(selectedEdgeProps as unknown as EdgeProps<DbmlRelationEdge>)} />
      </svg>,
    )

    expect(document.querySelector('.relationEdge.selected')).toBeInTheDocument()
  })
})

const selectedEdgeProps = {
  id: 'users_orders',
  sourceX: 0,
  sourceY: 0,
  targetX: 10,
  targetY: 10,
  sourcePosition: 'right',
  targetPosition: 'left',
  selected: false,
  data: {
    isSelected: true,
    relation: {
      id: 'users_orders',
      fromTableId: 'users',
      fromColumnIds: ['users.id'],
      toTableId: 'orders',
      toColumnIds: ['orders.user_id'],
      cardinality: 'one-to-many',
    },
  },
}

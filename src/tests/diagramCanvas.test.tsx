import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiagramCanvas } from '../features/diagram/DiagramCanvas'
import type { SchemaModel } from '../features/dbml/dbmlTypes'

const reactFlowMock = vi.hoisted(() => ({
  setCenter: vi.fn(),
  getNode: vi.fn(),
  fitView: vi.fn(),
}))

vi.mock('@xyflow/react', () => ({
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReactFlow: ({
    children,
    nodes,
    edges,
  }: {
    children: React.ReactNode
    nodes: Array<{ id: string }>
    edges: Array<{ id: string; selected?: boolean }>
  }) => (
    <div>
      {nodes.map((node) => (
        <span key={node.id}>{node.id}</span>
      ))}
      {edges.map((edge) => (
        <span data-selected={edge.selected ? 'true' : 'false'} key={edge.id}>
          {edge.id}
        </span>
      ))}
      {children}
    </div>
  ),
  useReactFlow: () => reactFlowMock,
}))

describe('DiagramCanvas', () => {
  beforeEach(() => {
    reactFlowMock.setCenter.mockReset()
    reactFlowMock.getNode.mockReset()
    reactFlowMock.fitView.mockReset()
  })

  it('centers the selected table in the canvas', async () => {
    render(
      <DiagramCanvas
        model={model}
        positions={{ orders: { x: 640, y: 320 } }}
        query=""
        highlightedColumnIds={[]}
        selectedTableId="orders"
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(reactFlowMock.setCenter).toHaveBeenCalledWith(790, 420, {
        duration: 400,
        zoom: 1.05,
      })
    })
  })

  it('marks the selected relation edge in the canvas', async () => {
    render(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        selectedRelationId="users_orders"
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-selected="true"]')?.textContent).toBe('users_orders')
    })
  })

  it('hides isolated tables when the connected tables filter is enabled', async () => {
    const user = userEvent.setup()

    render(
      <DiagramCanvas
        model={modelWithIsolatedTable}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    expect(screen.getByText('audit_logs')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: '隐藏独立表' }))

    await waitFor(() => {
      expect(screen.queryByText('audit_logs')).not.toBeInTheDocument()
    })
    expect(screen.getByText('users')).toBeInTheDocument()
    expect(screen.getByText('orders')).toBeInTheDocument()
  })
})

const model: SchemaModel = {
  project: { name: 'Canvas test' },
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
  ],
  relations: [],
  enums: [],
}

const modelWithRelation: SchemaModel = {
  project: { name: 'Relation canvas test' },
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
  ],
  relations: [
    {
      id: 'users_orders',
      fromTableId: 'users',
      fromColumnIds: ['users.id'],
      toTableId: 'orders',
      toColumnIds: ['orders.user_id'],
      cardinality: 'one-to-many',
    },
  ],
  enums: [],
}

const modelWithIsolatedTable: SchemaModel = {
  project: { name: 'Connected table test' },
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
  ],
  relations: [
    {
      id: 'users_orders',
      fromTableId: 'users',
      fromColumnIds: ['users.id'],
      toTableId: 'orders',
      toColumnIds: ['orders.user_id'],
      cardinality: 'one-to-many',
    },
  ],
  enums: [],
}

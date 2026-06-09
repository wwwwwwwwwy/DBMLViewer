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

const layoutGraphMock = vi.hoisted(() =>
  vi.fn(async (nodes: Array<{ id: string }>) =>
    nodes.map((node, index) => ({
      ...node,
      position: index === 0 ? { x: 80, y: 120 } : { x: 520, y: 240 },
    })),
  ),
)

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

vi.mock('../features/diagram/layoutGraph', () => ({
  layoutGraph: layoutGraphMock,
}))

describe('DiagramCanvas', () => {
  beforeEach(() => {
    reactFlowMock.setCenter.mockReset()
    reactFlowMock.getNode.mockReset()
    reactFlowMock.fitView.mockReset()
    layoutGraphMock.mockClear()
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

  it('orders canvas toolbar controls as search, buttons, then filters', () => {
    const { container } = render(
      <DiagramCanvas
        model={model}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    const toolbar = container.querySelector('.canvasToolbar')
    const controlNames = Array.from(toolbar?.children ?? []).map((element) => {
      if (element.classList.contains('searchBox')) return 'search'
      if (element.tagName === 'BUTTON') return element.textContent?.trim() || element.getAttribute('title')
      if (element.tagName === 'LABEL') return element.textContent?.trim()
      return element.tagName
    })

    expect(controlNames).toEqual([
      'search',
      '自动布局',
      '适应视图',
      '导出 PNG',
      'SVG',
      '仅显示关联表',
      '隐藏独立表',
      '显示注释',
    ])
  })

  it('automatically lays out the graph when any filter checkbox changes', async () => {
    const user = userEvent.setup()

    render(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: '仅显示关联表' }))
    await user.click(screen.getByRole('checkbox', { name: '隐藏独立表' }))
    await user.click(screen.getByRole('checkbox', { name: '显示注释' }))

    await waitFor(() => {
      expect(layoutGraphMock).toHaveBeenCalledTimes(3)
    })
  })

  it('automatically lays out the graph when an import layout request arrives', async () => {
    const { rerender } = render(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        layoutRequestId={0}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    expect(layoutGraphMock).not.toHaveBeenCalled()

    rerender(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        layoutRequestId={1}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(layoutGraphMock).toHaveBeenCalledTimes(1)
    })
  })

  it('centers the first visible table after automatic layout when nothing is selected', async () => {
    const user = userEvent.setup()

    render(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: '自动布局' }))

    await waitFor(() => {
      expect(reactFlowMock.setCenter).toHaveBeenCalledWith(230, 220, {
        duration: 400,
        zoom: 1.05,
      })
    })
  })

  it('keeps and recenters the selected table after automatic layout from a filter change', async () => {
    const user = userEvent.setup()

    render(
      <DiagramCanvas
        model={modelWithRelation}
        positions={{}}
        query=""
        highlightedColumnIds={[]}
        selectedTableId="orders"
        onQueryChange={vi.fn()}
        onNodePositionChange={vi.fn()}
        onSelectTable={vi.fn()}
        onSelectRelation={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: '显示注释' }))

    await waitFor(() => {
      expect(reactFlowMock.setCenter).toHaveBeenCalledWith(670, 340, {
        duration: 400,
        zoom: 1.05,
      })
    })
  })

  it('keeps and recenters the selected relation after automatic layout from a filter change', async () => {
    const user = userEvent.setup()

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

    await user.click(screen.getByRole('checkbox', { name: '显示注释' }))

    await waitFor(() => {
      expect(document.querySelector('[data-selected="true"]')?.textContent).toBe('users_orders')
      expect(reactFlowMock.setCenter).toHaveBeenCalledWith(450, 280, {
        duration: 400,
        zoom: 1.05,
      })
    })
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

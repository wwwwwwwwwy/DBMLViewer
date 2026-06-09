import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { parseDbmlSource } from '../features/dbml/dbmlParser'
import { sampleDbml } from '../features/dbml/dbmlSamples'
import { normalizeDbmlDatabase } from '../features/dbml/dbmlNormalizer'
import { InspectorPanel } from '../features/inspector/InspectorPanel'
import type { SchemaModel } from '../features/dbml/dbmlTypes'

describe('InspectorPanel', () => {
  it('shows selected table columns', () => {
    const parsed = parseDbmlSource(sampleDbml)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const model = normalizeDbmlDatabase(parsed.database)

    render(
      <InspectorPanel
        model={model}
        selectedTableId="users"
        onCopyModel={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'users' })).toBeInTheDocument()
    expect(screen.getByText('email')).toBeInTheDocument()
    expect(screen.getAllByText('varchar').length).toBeGreaterThanOrEqual(2)
  })

  it('shows selected table column notes', () => {
    render(
      <InspectorPanel
        model={modelWithNotes}
        selectedTableId="users"
        onCopyModel={vi.fn()}
      />,
    )

    expect(screen.getByText('用户邮箱，用于登录')).toBeInTheDocument()
  })

  it('shows table names and table notes in the overview', () => {
    render(
      <InspectorPanel
        model={modelWithNotes}
        onCopyModel={vi.fn()}
      />,
    )

    expect(screen.getByText('users')).toBeInTheDocument()
    expect(screen.getByText('用户主数据表')).toBeInTheDocument()
    expect(screen.getByText('orders')).toBeInTheDocument()
    expect(screen.getByText('无注释')).toBeInTheDocument()
  })

  it('selects a table from the overview table list', async () => {
    const user = userEvent.setup()
    const onSelectTable = vi.fn()

    render(
      <InspectorPanel
        model={modelWithNotes}
        onCopyModel={vi.fn()}
        onSelectTable={onSelectTable}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'users 用户主数据表' }))

    expect(onSelectTable).toHaveBeenCalledWith('users')
  })

  it('filters the overview table list by table name', async () => {
    const user = userEvent.setup()

    render(
      <InspectorPanel
        model={modelWithNotes}
        onCopyModel={vi.fn()}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: '搜索表清单' }), 'ord')

    expect(screen.queryByRole('button', { name: 'users 用户主数据表' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'orders 无注释' })).toBeInTheDocument()
  })

  it('filters the overview table list by column notes', async () => {
    const user = userEvent.setup()

    render(
      <InspectorPanel
        model={modelWithNotes}
        onCopyModel={vi.fn()}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: '搜索表清单' }), '登录')

    expect(screen.getByRole('button', { name: 'users 用户主数据表' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'orders 无注释' })).not.toBeInTheDocument()
  })

  it('selects a relation from the selected table relation list', async () => {
    const user = userEvent.setup()
    const onSelectRelation = vi.fn()

    render(
      <InspectorPanel
        model={modelWithRelation}
        selectedTableId="users"
        onCopyModel={vi.fn()}
        onSelectRelation={onSelectRelation}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'users → orders' }))

    expect(onSelectRelation).toHaveBeenCalledWith('users_orders')
  })

  it('selects endpoint tables from the selected relation details', async () => {
    const user = userEvent.setup()
    const onSelectTable = vi.fn()

    render(
      <InspectorPanel
        model={modelWithRelation}
        selectedRelationId="users_orders"
        onCopyModel={vi.fn()}
        onSelectTable={onSelectTable}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'users id' }))
    await user.click(screen.getByRole('button', { name: 'orders user_id' }))

    expect(onSelectTable).toHaveBeenNthCalledWith(1, 'users')
    expect(onSelectTable).toHaveBeenNthCalledWith(2, 'orders')
  })
})

const modelWithNotes: SchemaModel = {
  project: { name: 'Commented project' },
  tables: [
    {
      id: 'users',
      name: 'users',
      note: '用户主数据表',
      columns: [
        {
          id: 'users.email',
          name: 'email',
          type: 'varchar',
          isPk: false,
          isUnique: true,
          isNullable: false,
          isIncrement: false,
          note: '用户邮箱，用于登录',
        },
      ],
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
  project: { name: 'Relation project' },
  tables: [
    {
      id: 'users',
      name: 'users',
      columns: [
        {
          id: 'users.id',
          name: 'id',
          type: 'integer',
          isPk: true,
          isUnique: false,
          isNullable: false,
          isIncrement: true,
        },
      ],
      indexes: [],
    },
    {
      id: 'orders',
      name: 'orders',
      columns: [
        {
          id: 'orders.user_id',
          name: 'user_id',
          type: 'integer',
          isPk: false,
          isUnique: false,
          isNullable: false,
          isIncrement: false,
        },
      ],
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

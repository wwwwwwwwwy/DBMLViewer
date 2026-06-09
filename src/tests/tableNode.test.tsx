import { ReactFlowProvider, type NodeProps } from '@xyflow/react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TableNode } from '../features/diagram/TableNode'
import type { TableModel } from '../features/dbml/dbmlTypes'
import type { DbmlTableNode } from '../features/diagram/flowMapper'

describe('TableNode', () => {
  it('shows table and column notes when note display is enabled', () => {
    renderTableNode(true)

    expect(screen.getByText('用户主数据表')).toBeInTheDocument()
    expect(screen.getByText('用户邮箱，用于登录')).toBeInTheDocument()
  })

  it('hides table and column notes when note display is disabled', () => {
    renderTableNode(false)

    expect(screen.queryByText('用户主数据表')).not.toBeInTheDocument()
    expect(screen.queryByText('用户邮箱，用于登录')).not.toBeInTheDocument()
    expect(screen.getByText('email')).toBeInTheDocument()
    expect(screen.getByText('varchar')).toBeInTheDocument()
  })
})

function renderTableNode(showNotes: boolean) {
  const props = {
    id: 'users',
    type: 'table',
    selected: false,
    dragging: false,
    zIndex: 0,
    isConnectable: true,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    data: {
      table: tableWithNotes,
      highlightedColumnIds: [],
      showNotes,
    },
  }

  render(
    <ReactFlowProvider>
      <TableNode {...(props as unknown as NodeProps<DbmlTableNode>)} />
    </ReactFlowProvider>,
  )
}

const tableWithNotes: TableModel = {
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
}

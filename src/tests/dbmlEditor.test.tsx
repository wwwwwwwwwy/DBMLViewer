import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DbmlEditor } from '../features/editor/DbmlEditor'
import type { WorkspaceSummary } from '../features/workspace/workspaceTypes'

vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value?: string) => void }) => (
    <textarea
      aria-label="Editor content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}))

describe('DbmlEditor workspace library', () => {
  it('shows saved DBML items and exposes save, load, rename, and delete actions', async () => {
    const user = userEvent.setup()
    const onSaveWorkspace = vi.fn()
    const onImportWorkspace = vi.fn()
    const onLoadWorkspace = vi.fn()
    const onRenameWorkspace = vi.fn()
    const onDeleteWorkspace = vi.fn()

    render(
      <DbmlEditor
        source="Table users { id integer [pk] }"
        language="zh"
        isDirty
        workspaceSummaries={workspaceSummaries}
        currentWorkspaceId="users-workspace"
        parseError={undefined}
        onChange={vi.fn()}
        onLoadSample={vi.fn()}
        onLanguageChange={vi.fn()}
        onSaveWorkspace={onSaveWorkspace}
        onImportWorkspace={onImportWorkspace}
        onLoadWorkspace={onLoadWorkspace}
        onRenameWorkspace={onRenameWorkspace}
        onDeleteWorkspace={onDeleteWorkspace}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'DBML 列表' }))
    const dialog = screen.getByRole('dialog', { name: 'DBML 列表' })

    expect(within(dialog).getByText('用户模型')).toBeInTheDocument()
    expect(within(dialog).getByText('2 张表 / 1 个关系')).toBeInTheDocument()
    expect(within(dialog).getByText('订单模型')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '保存当前 DBML' }))
    expect(onSaveWorkspace).toHaveBeenCalledTimes(1)

    await user.clear(screen.getByLabelText('重命名 用户模型'))
    await user.type(screen.getByLabelText('重命名 用户模型'), '核心用户模型')
    await user.click(screen.getByRole('button', { name: '保存名称 用户模型' }))
    expect(onRenameWorkspace).toHaveBeenCalledWith('users-workspace', '核心用户模型')

    await user.click(screen.getByRole('button', { name: '展开 订单模型' }))
    await user.click(screen.getByRole('button', { name: '删除 订单模型' }))
    expect(onDeleteWorkspace).toHaveBeenCalledWith('orders-workspace')

    await user.click(screen.getByRole('button', { name: '加载 订单模型' }))
    expect(onLoadWorkspace).toHaveBeenCalledWith('orders-workspace')
  })

  it('expands and collapses saved DBML item actions', async () => {
    const user = userEvent.setup()

    render(
      <DbmlEditor
        source="Table users { id integer [pk] }"
        language="zh"
        isDirty={false}
        workspaceSummaries={workspaceSummaries}
        currentWorkspaceId="users-workspace"
        parseError={undefined}
        onChange={vi.fn()}
        onLoadSample={vi.fn()}
        onLanguageChange={vi.fn()}
        onSaveWorkspace={vi.fn()}
        onImportWorkspace={vi.fn()}
        onLoadWorkspace={vi.fn()}
        onRenameWorkspace={vi.fn()}
        onDeleteWorkspace={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'DBML 列表' }))
    const dialog = screen.getByRole('dialog', { name: 'DBML 列表' })

    expect(within(dialog).getByLabelText('重命名 用户模型')).toBeInTheDocument()
    expect(within(dialog).queryByLabelText('重命名 订单模型')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '展开 订单模型' }))
    expect(within(dialog).getByLabelText('重命名 订单模型')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '收起 订单模型' })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '收起 订单模型' }))
    expect(within(dialog).queryByLabelText('重命名 订单模型')).not.toBeInTheDocument()
  })
})

const workspaceSummaries: WorkspaceSummary[] = [
  {
    id: 'users-workspace',
    name: '用户模型',
    tableCount: 2,
    relationCount: 1,
    updatedAt: '2026-06-09T02:00:00.000Z',
  },
  {
    id: 'orders-workspace',
    name: '订单模型',
    tableCount: 1,
    relationCount: 0,
    updatedAt: '2026-06-09T01:00:00.000Z',
  },
]

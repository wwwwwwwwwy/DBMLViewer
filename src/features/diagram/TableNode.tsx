import { Handle, Position, type NodeProps } from '@xyflow/react'
import { KeyRound, Link, Star } from 'lucide-react'
import type { DbmlTableNode } from './flowMapper'

export function TableNode({ data }: NodeProps<DbmlTableNode>) {
  const { table, highlightedColumnIds, selectedTableId, showNotes } = data
  const isSelected = selectedTableId === table.id

  return (
    <div className={isSelected ? 'tableNode selected' : 'tableNode'}>
      <div className="tableNodeHeader">
        <div>
          {table.schema ? <span>{table.schema}</span> : null}
          <strong>{table.name}</strong>
        </div>
        <span>{table.columns.length}</span>
      </div>
      {showNotes && table.note ? (
        <div className="tableNodeNote">{table.note}</div>
      ) : null}
      <div className="columnList">
        {table.columns.map((column) => {
          const isHighlighted = highlightedColumnIds.includes(column.id)

          return (
            <div
              className={isHighlighted ? 'columnRow highlighted' : 'columnRow'}
              key={column.id}
            >
              <Handle
                id={column.id}
                type="target"
                position={Position.Left}
                className="columnHandle"
              />
              <div className="columnName">
                {column.isPk ? <KeyRound size={13} /> : null}
                {!column.isPk && column.isUnique ? <Star size={13} /> : null}
                {!column.isPk && !column.isUnique ? <Link size={13} /> : null}
                <span>{column.name}</span>
              </div>
              <code>{column.type}</code>
              {showNotes && column.note ? (
                <p className="columnNote">{column.note}</p>
              ) : null}
              <Handle
                id={column.id}
                type="source"
                position={Position.Right}
                className="columnHandle"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

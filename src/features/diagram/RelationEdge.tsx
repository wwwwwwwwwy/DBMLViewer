import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import type { DbmlRelationEdge } from './flowMapper'

export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<DbmlRelationEdge>) {
  const isSelected = selected || data?.isSelected
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={typeof markerEnd === 'string' ? markerEnd : undefined}
        className={isSelected ? 'relationEdge selected' : 'relationEdge'}
      />
      <EdgeLabelRenderer>
        <div
          className="edgeLabel"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {data?.relation.cardinality}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { DbmlTableNode } from './flowMapper'

export function applyDiagramNodeChanges(
  changes: NodeChange<DbmlTableNode>[],
  nodes: DbmlTableNode[],
): DbmlTableNode[] {
  return applyNodeChanges(changes, nodes) as DbmlTableNode[]
}

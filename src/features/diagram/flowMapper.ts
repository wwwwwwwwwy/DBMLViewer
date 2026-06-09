import type { Edge, Node } from '@xyflow/react'
import { defaultLanguage, t, type Language } from '../../i18n'
import type { RelationModel, SavedNodePositions, SchemaModel, TableModel } from '../dbml/dbmlTypes'

export type TableNodeData = Record<string, unknown> & {
  table: TableModel
  highlightedColumnIds: string[]
  selectedTableId?: string
  showNotes: boolean
}

export type RelationEdgeData = Record<string, unknown> & {
  relation: RelationModel
  isSelected: boolean
}

export type DbmlTableNode = Node<TableNodeData, 'table'>
export type DbmlRelationEdge = Edge<RelationEdgeData, 'relation'>

export function buildFlowElements(
  model: SchemaModel,
  savedPositions: SavedNodePositions,
  highlightedColumnIds: string[] = [],
  selectedTableId?: string,
  language: Language = defaultLanguage,
  showNotes = false,
  selectedRelationId?: string,
): {
  nodes: DbmlTableNode[]
  edges: DbmlRelationEdge[]
} {
  return {
    nodes: model.tables.map((table, index) => ({
      id: table.id,
      type: 'table',
      position: savedPositions[table.id] ?? {
        x: 80 + (index % 3) * 360,
        y: 80 + Math.floor(index / 3) * 300,
      },
      data: {
        table,
        highlightedColumnIds,
        selectedTableId,
        showNotes,
      },
    })),
    edges: model.relations.map((relation) => ({
      id: relation.id,
      type: 'relation',
      source: relation.fromTableId,
      target: relation.toTableId,
      sourceHandle: relation.fromColumnIds[0],
      targetHandle: relation.toColumnIds[0],
      label: edgeLabel(relation, language),
      selected: relation.id === selectedRelationId,
      data: {
        relation,
        isSelected: relation.id === selectedRelationId,
      },
    })),
  }
}

function edgeLabel(relation: RelationModel, language: Language): string {
  const actionParts = [
    relation.onDelete ? `${t(language, 'relation.delete')} ${relation.onDelete}` : '',
    relation.onUpdate ? `${t(language, 'relation.update')} ${relation.onUpdate}` : '',
  ].filter(Boolean)

  return actionParts.length
    ? actionParts.join(' / ')
    : t(language, `relation.${relation.cardinality}`)
}

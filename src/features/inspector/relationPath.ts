import type { RelationModel, SchemaModel, TableModel } from '../dbml/dbmlTypes'

export type RelationPathStep = {
  relationId: string
  fromTableId: string
  toTableId: string
  fromColumnIds: string[]
  toColumnIds: string[]
}

export type RelationPathResult = {
  kind: 'direct' | 'indirect'
  steps: RelationPathStep[]
}

export function findTableByQuery(model: SchemaModel, query: string): TableModel | undefined {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return undefined

  return model.tables.find((table) => tableMatchesQuery(table, normalizedQuery))
}

export function suggestTables(model: SchemaModel, query: string, limit = 6): TableModel[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return model.tables.slice(0, limit)

  return model.tables
    .filter((table) => tableMatchesQuery(table, normalizedQuery))
    .slice(0, limit)
}

export function findRelationPath(
  model: SchemaModel,
  fromTableId: string,
  toTableId: string,
): RelationPathResult | null {
  if (fromTableId === toTableId) return { kind: 'direct', steps: [] }

  const visitedTableIds = new Set<string>([fromTableId])
  const queue: Array<{ tableId: string; steps: RelationPathStep[] }> = [
    { tableId: fromTableId, steps: [] },
  ]

  while (queue.length) {
    const current = queue.shift()
    if (!current) continue

    for (const relation of model.relations) {
      const step = createPathStep(relation, current.tableId)
      if (!step || visitedTableIds.has(step.toTableId)) continue

      const nextSteps = [...current.steps, step]
      if (step.toTableId === toTableId) {
        return {
          kind: nextSteps.length === 1 ? 'direct' : 'indirect',
          steps: nextSteps,
        }
      }

      visitedTableIds.add(step.toTableId)
      queue.push({ tableId: step.toTableId, steps: nextSteps })
    }
  }

  return null
}

function createPathStep(relation: RelationModel, tableId: string): RelationPathStep | undefined {
  if (relation.fromTableId === tableId) {
    return {
      relationId: relation.id,
      fromTableId: relation.fromTableId,
      toTableId: relation.toTableId,
      fromColumnIds: relation.fromColumnIds,
      toColumnIds: relation.toColumnIds,
    }
  }

  if (relation.toTableId === tableId) {
    return {
      relationId: relation.id,
      fromTableId: relation.toTableId,
      toTableId: relation.fromTableId,
      fromColumnIds: relation.toColumnIds,
      toColumnIds: relation.fromColumnIds,
    }
  }

  return undefined
}

function tableMatchesQuery(table: TableModel, normalizedQuery: string): boolean {
  return normalizeSearchText(table.name).includes(normalizedQuery) ||
    normalizeSearchText(table.note ?? '').includes(normalizedQuery)
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

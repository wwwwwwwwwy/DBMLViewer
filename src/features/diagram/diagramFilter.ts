import type { SchemaModel } from '../dbml/dbmlTypes'

export function filterModelBySelectedRelations(
  model: SchemaModel,
  enabled: boolean,
  selectedTableId?: string,
): SchemaModel {
  if (!enabled || !selectedTableId) return model

  const relatedTableIds = findConnectedTableIds(model, selectedTableId)

  return {
    ...model,
    tables: model.tables.filter((table) => relatedTableIds.has(table.id)),
    relations: model.relations.filter(
      (relation) =>
        relatedTableIds.has(relation.fromTableId) &&
        relatedTableIds.has(relation.toTableId),
    ),
  }
}

function findConnectedTableIds(model: SchemaModel, selectedTableId: string): Set<string> {
  const connectedTableIds = new Set<string>([selectedTableId])
  const pendingTableIds = [selectedTableId]

  while (pendingTableIds.length) {
    const tableId = pendingTableIds.shift()
    if (!tableId) continue

    model.relations.forEach((relation) => {
      const adjacentTableId = getAdjacentTableId(relation.fromTableId, relation.toTableId, tableId)
      if (!adjacentTableId || connectedTableIds.has(adjacentTableId)) return

      connectedTableIds.add(adjacentTableId)
      pendingTableIds.push(adjacentTableId)
    })
  }

  return connectedTableIds
}

function getAdjacentTableId(fromTableId: string, toTableId: string, tableId: string): string | undefined {
  if (fromTableId === tableId) return toTableId
  if (toTableId === tableId) return fromTableId
  return undefined
}

export function filterModelByConnectedTables(
  model: SchemaModel,
  enabled: boolean,
): SchemaModel {
  if (!enabled) return model

  const connectedTableIds = new Set<string>()

  model.relations.forEach((relation) => {
    connectedTableIds.add(relation.fromTableId)
    connectedTableIds.add(relation.toTableId)
  })

  return {
    ...model,
    tables: model.tables.filter((table) => connectedTableIds.has(table.id)),
    relations: model.relations.filter(
      (relation) =>
        connectedTableIds.has(relation.fromTableId) &&
        connectedTableIds.has(relation.toTableId),
    ),
  }
}

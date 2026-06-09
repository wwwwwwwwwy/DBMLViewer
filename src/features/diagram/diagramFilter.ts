import type { SchemaModel } from '../dbml/dbmlTypes'

export function filterModelBySelectedRelations(
  model: SchemaModel,
  enabled: boolean,
  selectedTableId?: string,
): SchemaModel {
  if (!enabled || !selectedTableId) return model

  const relatedTableIds = new Set<string>([selectedTableId])

  model.relations.forEach((relation) => {
    if (relation.fromTableId === selectedTableId) {
      relatedTableIds.add(relation.toTableId)
    }
    if (relation.toTableId === selectedTableId) {
      relatedTableIds.add(relation.fromTableId)
    }
  })

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

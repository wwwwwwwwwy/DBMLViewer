import type { SchemaModel, TableModel } from '../dbml/dbmlTypes'

export function findMatchingTableId(model: SchemaModel, query: string): string | undefined {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return undefined

  return model.tables.find((table) => matchesTable(table, normalizedQuery))?.id
}

function matchesTable(table: TableModel, normalizedQuery: string): boolean {
  return (
    includesQuery(table.name, normalizedQuery) ||
    includesQuery(table.note, normalizedQuery) ||
    table.columns.some((column) =>
      includesQuery(column.name, normalizedQuery) ||
      includesQuery(column.note, normalizedQuery),
    )
  )
}

function includesQuery(value: string | undefined, normalizedQuery: string): boolean {
  return value?.toLowerCase().includes(normalizedQuery) ?? false
}

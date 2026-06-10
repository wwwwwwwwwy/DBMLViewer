import type { ColumnModel, IndexModel, RelationModel, SchemaModel, TableModel } from './dbmlTypes'
import type { RelationPathResult } from '../inspector/relationPath'

export function buildRelationSubsetDbml(
  model: SchemaModel,
  relationPath: RelationPathResult,
  name: string,
): string {
  const tableIds = new Set<string>()
  const relationIds = new Set(relationPath.steps.map((step) => step.relationId))

  relationPath.steps.forEach((step) => {
    tableIds.add(step.fromTableId)
    tableIds.add(step.toTableId)
  })

  const tables = model.tables.filter((table) => tableIds.has(table.id))
  const relations = model.relations.filter((relation) => relationIds.has(relation.id))

  return [
    `Project ${quote(name)} {`,
    '  database_type: "PostgreSQL"',
    `  Note: ${quote(`Generated from relation lookup in ${model.project?.name || 'DBML Viewer'}`)}`,
    '}',
    '',
    ...tables.flatMap((table) => [...formatTable(table), '']),
    ...relations.map(formatRelation),
    '',
  ].join('\n')
}

function formatTable(table: TableModel): string[] {
  const lines = [`Table ${qualifiedName(table)} {`]

  table.columns.forEach((column) => {
    lines.push(`  ${formatIdentifier(column.name)} ${formatColumnType(column.type)}${formatColumnSettings(column)}`)
  })

  if (table.note) {
    lines.push('')
    lines.push(`  Note: ${quote(table.note)}`)
  }

  if (table.indexes.length) {
    const indexes = table.indexes.map(formatIndex).filter(Boolean)

    if (!indexes.length) {
      lines.push('}')
      return lines
    }

    lines.push('')
    lines.push('  indexes {')
    indexes.forEach((index) => lines.push(`    ${index}`))
    lines.push('  }')
  }

  lines.push('}')
  return lines
}

function formatColumnSettings(column: ColumnModel): string {
  const settings = [
    column.isPk ? 'pk' : '',
    column.isIncrement ? 'increment' : '',
    column.isUnique ? 'unique' : '',
    column.isNullable ? '' : 'not null',
    column.note ? `note: ${quote(column.note)}` : '',
  ].filter(Boolean)

  return settings.length ? ` [${settings.join(', ')}]` : ''
}

function formatIndex(index: IndexModel): string | undefined {
  if (!index.columns.length || index.columns.some((column) => !isSimpleIdentifier(column))) {
    return undefined
  }

  const settings = [
    index.isPk ? 'pk' : '',
    index.isUnique ? 'unique' : '',
    index.type ? `type: ${quote(index.type)}` : '',
    index.name ? `name: ${quote(index.name)}` : '',
    index.note ? `note: ${quote(index.note)}` : '',
  ].filter(Boolean)
  const columns = index.columns.map(formatIdentifier)
  const field = columns.length > 1 ? `(${columns.join(', ')})` : columns[0]

  return `${field}${settings.length ? ` [${settings.join(', ')}]` : ''}`
}

function formatRelation(relation: RelationModel): string {
  const settings = [
    relation.onDelete ? `delete: ${relation.onDelete}` : '',
    relation.onUpdate ? `update: ${relation.onUpdate}` : '',
  ].filter(Boolean)

  const left = relation.fromColumnIds.join(', ')
  const right = relation.toColumnIds.join(', ')
  const relationSettings = settings.length ? ` [${settings.join(', ')}]` : ''

  return `Ref: ${left} ${relationOperator(relation)} ${right}${relationSettings}`
}

function relationOperator(relation: RelationModel): string {
  if (relation.cardinality === 'one-to-one') return '-'
  if (relation.cardinality === 'many-to-many') return '<>'
  return '>'
}

function qualifiedName(table: TableModel): string {
  return table.schema
    ? `${formatIdentifier(table.schema)}.${formatIdentifier(table.name)}`
    : formatIdentifier(table.name)
}

function formatColumnType(type: string): string {
  return type.replace(/(\([^()]+\))\1+$/g, '$1')
}

function formatIdentifier(value: string): string {
  return isSimpleIdentifier(value) ? value : quote(value)
}

function isSimpleIdentifier(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value)
}

function quote(value: string): string {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`
}

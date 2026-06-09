import type { Database } from '@dbml/core'
import type {
  ColumnModel,
  EnumModel,
  IndexModel,
  RelationCardinality,
  RelationModel,
  SchemaModel,
  TableModel,
} from './dbmlTypes'

type ExportedDatabase = ReturnType<Database['export']>
type ExportedSchema = ExportedDatabase['schemas'][number]
type ExportedTable = ExportedSchema['tables'][number]
type ExportedField = ExportedTable['fields'][number]
type ExportedIndex = ExportedTable['indexes'][number]
type ExportedRef = ExportedSchema['refs'][number]

export function normalizeDbmlDatabase(database: Database): SchemaModel {
  const exported = database.export()
  const tables = exported.schemas.flatMap((schema) =>
    schema.tables.map((table) => normalizeTable(schema, table)),
  )
  const tableIds = new Set(tables.map((table) => table.id))

  return {
    project: {
      name: optionalString(database.name),
      databaseType: optionalString(database.databaseType),
      note: optionalString(database.note),
    },
    tables,
    enums: exported.schemas.flatMap((schema) =>
      schema.enums.map((dbmlEnum) => normalizeEnum(schema, dbmlEnum)),
    ),
    relations: exported.schemas.flatMap((schema) =>
      schema.refs
        .map((ref, index) => normalizeRelation(schema, ref, index))
        .filter((relation): relation is RelationModel =>
          Boolean(
            relation &&
              tableIds.has(relation.fromTableId) &&
              tableIds.has(relation.toTableId),
          ),
        ),
    ),
  }
}

function normalizeTable(schema: ExportedSchema, table: ExportedTable): TableModel {
  const tableId = tableKey(schema.name, table.name)

  return {
    id: tableId,
    schema: optionalSchema(schema.name),
    name: table.name,
    alias: optionalString(table.alias),
    note: optionalString(table.note),
    columns: table.fields.map((field) => normalizeField(tableId, field)),
    indexes: table.indexes.map((index, indexPosition) =>
      normalizeIndex(tableId, index, indexPosition),
    ),
  }
}

function normalizeField(tableId: string, field: ExportedField): ColumnModel {
  return {
    id: columnKey(tableId, field.name),
    name: field.name,
    type: formatType(field.type),
    isPk: Boolean(field.pk),
    isUnique: Boolean(field.unique),
    isNullable: !field.not_null,
    isIncrement: Boolean(field.increment),
    note: optionalString(field.note),
  }
}

function normalizeIndex(
  tableId: string,
  index: ExportedIndex,
  indexPosition: number,
): IndexModel {
  return {
    id: `${tableId}.index.${index.name || indexPosition}`,
    name: optionalString(index.name),
    columns: index.columns.map((column) => String(column.value)),
    isPk: Boolean(index.pk),
    isUnique: Boolean(index.unique),
    type: optionalString(index.type),
    note: optionalString(index.note),
  }
}

function normalizeEnum(
  schema: ExportedSchema,
  dbmlEnum: ExportedSchema['enums'][number],
): EnumModel {
  return {
    id: enumKey(schema.name, dbmlEnum.name),
    schema: optionalSchema(schema.name),
    name: dbmlEnum.name,
    values: dbmlEnum.values.map((value) => value.name),
    note: optionalString(dbmlEnum.note),
  }
}

function normalizeRelation(
  schema: ExportedSchema,
  ref: ExportedRef,
  index: number,
): RelationModel | null {
  const [left, right] = ref.endpoints

  if (!left || !right) {
    return null
  }

  const fromTableId = tableKey(left.schemaName || schema.name, left.tableName)
  const toTableId = tableKey(right.schemaName || schema.name, right.tableName)

  return {
    id: ref.name || `relation.${index}.${fromTableId}.${toTableId}`,
    name: optionalString(ref.name),
    fromTableId,
    fromColumnIds: left.fieldNames.map((fieldName) =>
      columnKey(fromTableId, fieldName),
    ),
    toTableId,
    toColumnIds: right.fieldNames.map((fieldName) =>
      columnKey(toTableId, fieldName),
    ),
    cardinality: toCardinality(left.relation, right.relation),
    onDelete: optionalString(ref.onDelete),
    onUpdate: optionalString(ref.onUpdate),
  }
}

function toCardinality(leftRelation: unknown, rightRelation: unknown): RelationCardinality {
  const left = String(leftRelation)
  const right = String(rightRelation)

  if (left === '1' && right === '*') return 'one-to-many'
  if (left === '*' && right === '1') return 'many-to-one'
  if (left === '*' && right === '*') return 'many-to-many'
  return 'one-to-one'
}

function tableKey(schemaName: string | null | undefined, tableName: string): string {
  const schema = optionalSchema(schemaName)
  return schema ? `${schema}.${tableName}` : tableName
}

function columnKey(tableId: string, columnName: string): string {
  return `${tableId}.${columnName}`
}

function enumKey(schemaName: string | null | undefined, enumName: string): string {
  const schema = optionalSchema(schemaName)
  return schema ? `${schema}.${enumName}` : enumName
}

function optionalSchema(value: string | null | undefined): string | undefined {
  if (!value || value === 'public') return undefined
  return value
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function formatType(type: unknown): string {
  if (typeof type === 'string') return type

  if (type && typeof type === 'object' && 'type_name' in type) {
    const dbmlType = type as { schemaName?: string | null; type_name: string; args?: string | null }
    const schema = dbmlType.schemaName ? `${dbmlType.schemaName}.` : ''
    const args = dbmlType.args ? `(${dbmlType.args})` : ''
    return `${schema}${dbmlType.type_name}${args}`
  }

  return String(type)
}


export type RelationCardinality =
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many'

export type ProjectModel = {
  name?: string
  databaseType?: string
  note?: string
}

export type SchemaModel = {
  project?: ProjectModel
  tables: TableModel[]
  relations: RelationModel[]
  enums: EnumModel[]
}

export type TableModel = {
  id: string
  schema?: string
  name: string
  alias?: string
  note?: string
  columns: ColumnModel[]
  indexes: IndexModel[]
}

export type ColumnModel = {
  id: string
  name: string
  type: string
  isPk: boolean
  isUnique: boolean
  isNullable: boolean
  isIncrement: boolean
  note?: string
}

export type IndexModel = {
  id: string
  name?: string
  columns: string[]
  isPk: boolean
  isUnique: boolean
  type?: string
  note?: string
}

export type EnumModel = {
  id: string
  schema?: string
  name: string
  values: string[]
  note?: string
}

export type RelationModel = {
  id: string
  name?: string
  fromTableId: string
  fromColumnIds: string[]
  toTableId: string
  toColumnIds: string[]
  cardinality: RelationCardinality
  onDelete?: string
  onUpdate?: string
}

export type ParseError = {
  message: string
  details: string
}

export type Point = {
  x: number
  y: number
}

export type SavedNodePositions = Record<string, Point>


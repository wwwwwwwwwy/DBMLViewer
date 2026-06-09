import type { SavedNodePositions, SchemaModel } from '../dbml/dbmlTypes'
import type { Language } from '../../i18n'

export type PersistedWorkspace = {
  id: string
  name: string
  source: string
  positions: SavedNodePositions
  language?: Language
  createdAt: string
  updatedAt: string
}

export type WorkspaceSummary = {
  id: string
  name: string
  tableCount: number
  relationCount: number
  updatedAt: string
}

export type WorkspaceSummaryInput = {
  id: string
  name: string
  source: string
  updatedAt: string
  model?: SchemaModel
}

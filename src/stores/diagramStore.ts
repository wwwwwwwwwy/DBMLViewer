import Dexie, { type Table } from 'dexie'
import { create } from 'zustand'
import { parseDbmlSource, type ParseResult } from '../features/dbml/dbmlParser'
import { normalizeDbmlDatabase } from '../features/dbml/dbmlNormalizer'
import { sampleDbml } from '../features/dbml/dbmlSamples'
import type { ParseError, SavedNodePositions, SchemaModel } from '../features/dbml/dbmlTypes'
import {
  createWorkspaceSummary,
  normalizeWorkspaceName,
  sortWorkspaceSummaries,
} from '../features/workspace/workspaceLibrary'
import type { PersistedWorkspace, WorkspaceSummary } from '../features/workspace/workspaceTypes'
import { defaultLanguage, type Language } from '../i18n'

class DiagramDatabase extends Dexie {
  workspaces!: Table<PersistedWorkspace, string>

  constructor() {
    super('dbml-diagram-workspace')
    this.version(1).stores({
      workspaces: 'id, updatedAt',
    })
    this.version(2).stores({
      workspaces: 'id, updatedAt, name',
    })
  }
}

const db = new DiagramDatabase()
const workspaceId = 'default'
const untitledWorkspaceName = '未命名 DBML'

type DiagramState = {
  source: string
  model?: SchemaModel
  parseError?: ParseError
  lastParseResult?: ParseResult
  positions: SavedNodePositions
  selectedTableId?: string
  selectedRelationId?: string
  highlightedColumnIds: string[]
  query: string
  language: Language
  isHydrated: boolean
  currentWorkspaceId?: string
  workspaceSummaries: WorkspaceSummary[]
  isWorkspaceDirty: boolean
  setSource: (source: string) => void
  loadSample: () => void
  hydrate: () => Promise<void>
  saveCurrentWorkspace: () => Promise<void>
  loadWorkspace: (workspaceId: string) => Promise<void>
  renameWorkspace: (workspaceId: string, name: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
  importWorkspace: (source: string, name?: string) => Promise<void>
  setNodePosition: (tableId: string, position: { x: number; y: number }) => void
  selectTable: (tableId?: string) => void
  selectRelation: (relationId?: string) => void
  highlightColumns: (columnIds: string[]) => void
  setQuery: (query: string) => void
  setLanguage: (language: Language) => void
  copyModelJson: () => Promise<void>
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  source: sampleDbml,
  model: undefined,
  parseError: undefined,
  lastParseResult: undefined,
  positions: {},
  selectedTableId: undefined,
  selectedRelationId: undefined,
  highlightedColumnIds: [],
  query: '',
  language: defaultLanguage,
  isHydrated: false,
  currentWorkspaceId: undefined,
  workspaceSummaries: [],
  isWorkspaceDirty: false,

  setSource: (source) => {
    const previousModel = get().model
    const result = parseDbmlSource(source)

    if (result.ok) {
      const model = normalizeDbmlDatabase(result.database)
      set({
        source,
        model,
        parseError: undefined,
        lastParseResult: result,
        isWorkspaceDirty: true,
      })
    } else {
      set({
        source,
        model: previousModel,
        parseError: result.error,
        lastParseResult: result,
        isWorkspaceDirty: true,
      })
    }
  },

  loadSample: () => {
    get().setSource(sampleDbml)
  },

  hydrate: async () => {
    await ensureDefaultWorkspace()
    const savedWorkspaces = await db.workspaces.toArray()
    const summaries = buildWorkspaceSummaries(savedWorkspaces)
    const saved = savedWorkspaces.find((workspace) => workspace.id === workspaceId)
      ?? savedWorkspaces[0]
    const source = saved?.source || sampleDbml
    const positions = saved?.positions || {}
    const language = saved?.language || defaultLanguage
    const result = parseDbmlSource(source)

    set({
      source,
      positions,
      language,
      isHydrated: true,
      currentWorkspaceId: saved?.id,
      workspaceSummaries: summaries,
      isWorkspaceDirty: false,
      ...(result.ok
        ? {
            model: normalizeDbmlDatabase(result.database),
            parseError: undefined,
            lastParseResult: result,
          }
        : {
            model: undefined,
            parseError: result.error,
            lastParseResult: result,
          }),
    })
  },

  saveCurrentWorkspace: async () => {
    const state = get()
    const id = state.currentWorkspaceId ?? createWorkspaceId()
    const existing = await db.workspaces.get(id)
    const now = new Date().toISOString()
    const name = existing?.name
      ?? inferWorkspaceName(state.model)
      ?? untitledWorkspaceName

    await db.workspaces.put({
      id,
      name,
      source: state.source,
      positions: state.positions,
      language: state.language,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })

    set({
      currentWorkspaceId: id,
      workspaceSummaries: await loadWorkspaceSummaries(),
      isWorkspaceDirty: false,
    })
  },

  loadWorkspace: async (selectedWorkspaceId) => {
    const workspace = await db.workspaces.get(selectedWorkspaceId)
    if (!workspace) return

    const result = parseDbmlSource(workspace.source)

    set({
      source: workspace.source,
      positions: workspace.positions,
      language: workspace.language || get().language,
      currentWorkspaceId: workspace.id,
      selectedTableId: undefined,
      selectedRelationId: undefined,
      highlightedColumnIds: [],
      query: '',
      isWorkspaceDirty: false,
      ...(result.ok
        ? {
            model: normalizeDbmlDatabase(result.database),
            parseError: undefined,
            lastParseResult: result,
          }
        : {
            model: undefined,
            parseError: result.error,
            lastParseResult: result,
          }),
    })
  },

  renameWorkspace: async (selectedWorkspaceId, name) => {
    const workspace = await db.workspaces.get(selectedWorkspaceId)
    if (!workspace) return

    await db.workspaces.put({
      ...workspace,
      name: normalizeWorkspaceName(name, workspace.name || untitledWorkspaceName),
      updatedAt: new Date().toISOString(),
    })

    set({ workspaceSummaries: await loadWorkspaceSummaries() })
  },

  deleteWorkspace: async (selectedWorkspaceId) => {
    await db.workspaces.delete(selectedWorkspaceId)
    const remaining = await db.workspaces.toArray()
    const nextWorkspace = sortWorkspaceSummaries(buildWorkspaceSummaries(remaining))[0]
    const shouldLoadNext = get().currentWorkspaceId === selectedWorkspaceId

    set({
      workspaceSummaries: buildWorkspaceSummaries(remaining),
      currentWorkspaceId: shouldLoadNext ? undefined : get().currentWorkspaceId,
    })

    if (shouldLoadNext && nextWorkspace) {
      await get().loadWorkspace(nextWorkspace.id)
    }
  },

  importWorkspace: async (source, name) => {
    const result = parseDbmlSource(source)
    const model = result.ok ? normalizeDbmlDatabase(result.database) : undefined
    const now = new Date().toISOString()
    const id = createWorkspaceId()
    const workspaceName = normalizeWorkspaceName(
      name || inferWorkspaceName(model) || untitledWorkspaceName,
      untitledWorkspaceName,
    )

    await db.workspaces.put({
      id,
      name: workspaceName,
      source,
      positions: {},
      language: get().language,
      createdAt: now,
      updatedAt: now,
    })

    set({
      source,
      model,
      parseError: result.ok ? undefined : result.error,
      lastParseResult: result,
      positions: {},
      currentWorkspaceId: id,
      selectedTableId: undefined,
      selectedRelationId: undefined,
      highlightedColumnIds: [],
      query: '',
      workspaceSummaries: await loadWorkspaceSummaries(),
      isWorkspaceDirty: false,
    })
  },

  setNodePosition: (tableId, position) => {
    set((state) => ({
      positions: {
        ...state.positions,
        [tableId]: position,
      },
      isWorkspaceDirty: true,
    }))
  },

  selectTable: (tableId) => {
    set({
      selectedTableId: tableId,
      selectedRelationId: undefined,
      highlightedColumnIds: [],
    })
  },

  selectRelation: (relationId) => {
    const relation = get().model?.relations.find((item) => item.id === relationId)
    set({
      selectedRelationId: relationId,
      selectedTableId: undefined,
      highlightedColumnIds: relation
        ? [...relation.fromColumnIds, ...relation.toColumnIds]
        : [],
    })
  },

  highlightColumns: (columnIds) => {
    set({ highlightedColumnIds: columnIds })
  },

  setQuery: (query) => {
    set({ query })
  },

  setLanguage: (language) => {
    set({ language, isWorkspaceDirty: true })
  },

  copyModelJson: async () => {
    const model = get().model
    if (!model) return
    await navigator.clipboard.writeText(JSON.stringify(model, null, 2))
  },
}))

async function ensureDefaultWorkspace(): Promise<void> {
  const workspaces = await db.workspaces.toArray()
  if (workspaces.length > 0) {
    await Promise.all(workspaces.map((workspace) => {
      const patchedWorkspace = {
        ...workspace,
        name: workspace.name || inferWorkspaceNameFromSource(workspace.source) || untitledWorkspaceName,
        positions: workspace.positions || {},
        createdAt: workspace.createdAt || workspace.updatedAt || new Date().toISOString(),
        updatedAt: workspace.updatedAt || new Date().toISOString(),
      }
      return db.workspaces.put(patchedWorkspace)
    }))
    return
  }

  const now = new Date().toISOString()
  await db.workspaces.put({
    id: workspaceId,
    name: inferWorkspaceNameFromSource(sampleDbml) || untitledWorkspaceName,
    source: sampleDbml,
    positions: {},
    language: defaultLanguage,
    createdAt: now,
    updatedAt: now,
  })
}

async function loadWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
  return buildWorkspaceSummaries(await db.workspaces.toArray())
}

function buildWorkspaceSummaries(workspaces: PersistedWorkspace[]): WorkspaceSummary[] {
  return sortWorkspaceSummaries(workspaces.map((workspace) => {
    const result = parseDbmlSource(workspace.source)
    const model = result.ok ? normalizeDbmlDatabase(result.database) : undefined

    return createWorkspaceSummary({
      id: workspace.id,
      name: workspace.name || untitledWorkspaceName,
      source: workspace.source,
      updatedAt: workspace.updatedAt,
      model,
    })
  }))
}

function inferWorkspaceName(model?: SchemaModel): string | undefined {
  return model?.project?.name || model?.tables[0]?.name
}

function inferWorkspaceNameFromSource(source: string): string | undefined {
  const result = parseDbmlSource(source)
  if (!result.ok) return undefined
  return inferWorkspaceName(normalizeDbmlDatabase(result.database))
}

function createWorkspaceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `workspace-${Date.now()}`
}

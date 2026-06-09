import type { WorkspaceSummary, WorkspaceSummaryInput } from './workspaceTypes'

export function sortWorkspaceSummaries(
  summaries: WorkspaceSummary[],
): WorkspaceSummary[] {
  return [...summaries].sort((left, right) => (
    right.updatedAt.localeCompare(left.updatedAt)
  ))
}

export function normalizeWorkspaceName(name: string, fallback: string): string {
  const trimmedName = name.trim()
  return trimmedName || fallback
}

export function createWorkspaceSummary(
  workspace: WorkspaceSummaryInput,
): WorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.name,
    tableCount: workspace.model?.tables.length ?? 0,
    relationCount: workspace.model?.relations.length ?? 0,
    updatedAt: workspace.updatedAt,
  }
}

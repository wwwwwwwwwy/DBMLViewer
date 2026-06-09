import { useEffect } from 'react'
import { DiagramCanvas } from './features/diagram/DiagramCanvas'
import { DbmlEditor } from './features/editor/DbmlEditor'
import { InspectorPanel } from './features/inspector/InspectorPanel'
import { t } from './i18n'
import { useDiagramStore } from './stores/diagramStore'
import './index.css'

function App() {
  const {
    source,
    model,
    parseError,
    positions,
    selectedTableId,
    selectedRelationId,
    highlightedColumnIds,
    query,
    language,
    isHydrated,
    currentWorkspaceId,
    workspaceSummaries,
    isWorkspaceDirty,
    setSource,
    loadSample,
    hydrate,
    saveCurrentWorkspace,
    loadWorkspace,
    renameWorkspace,
    deleteWorkspace,
    importWorkspace,
    setNodePosition,
    selectTable,
    selectRelation,
    setQuery,
    setLanguage,
    copyModelJson,
  } = useDiagramStore()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
    document.title = t(language, 'app.title')
  }, [language])

  if (!isHydrated) {
    return <div className="loadingScreen">{t(language, 'app.loading')}</div>
  }

  return (
    <main className="appShell">
      <DbmlEditor
        source={source}
        parseError={parseError}
        language={language}
        workspaceSummaries={workspaceSummaries}
        currentWorkspaceId={currentWorkspaceId}
        isDirty={isWorkspaceDirty}
        onChange={setSource}
        onLoadSample={loadSample}
        onLanguageChange={setLanguage}
        onSaveWorkspace={() => void saveCurrentWorkspace()}
        onImportWorkspace={(source, name) => void importWorkspace(source, name)}
        onLoadWorkspace={(workspaceId) => void loadWorkspace(workspaceId)}
        onRenameWorkspace={(workspaceId, name) => void renameWorkspace(workspaceId, name)}
        onDeleteWorkspace={(workspaceId) => void deleteWorkspace(workspaceId)}
      />
      <DiagramCanvas
        model={model}
        positions={positions}
        query={query}
        language={language}
        highlightedColumnIds={highlightedColumnIds}
        selectedTableId={selectedTableId}
        selectedRelationId={selectedRelationId}
        onQueryChange={setQuery}
        onNodePositionChange={setNodePosition}
        onSelectTable={selectTable}
        onSelectRelation={selectRelation}
      />
      <InspectorPanel
        model={model}
        selectedTableId={selectedTableId}
        selectedRelationId={selectedRelationId}
        language={language}
        onCopyModel={copyModelJson}
        onSelectTable={selectTable}
        onSelectRelation={selectRelation}
      />
    </main>
  )
}

export default App

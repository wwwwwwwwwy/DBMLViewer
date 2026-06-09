import Editor from '@monaco-editor/react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  FolderOpen,
  Languages,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { defaultLanguage, t, type Language } from '../../i18n'
import type { ParseError } from '../dbml/dbmlTypes'
import type { WorkspaceSummary } from '../workspace/workspaceTypes'
import { configureDbmlLanguage, dbmlEditorTheme, dbmlLanguageId } from './dbmlMonaco'
import { FileImport } from './FileImport'

type DbmlEditorProps = {
  source: string
  parseError?: ParseError
  language?: Language
  workspaceSummaries: WorkspaceSummary[]
  currentWorkspaceId?: string
  isDirty: boolean
  onChange: (source: string) => void
  onLoadSample: () => void
  onLanguageChange: (language: Language) => void
  onSaveWorkspace: () => void
  onImportWorkspace: (source: string, name?: string) => void
  onLoadWorkspace: (workspaceId: string) => void
  onRenameWorkspace: (workspaceId: string, name: string) => void
  onDeleteWorkspace: (workspaceId: string) => void
}

export function DbmlEditor({
  source,
  parseError,
  language = defaultLanguage,
  workspaceSummaries,
  currentWorkspaceId,
  isDirty,
  onChange,
  onLoadSample,
  onLanguageChange,
  onSaveWorkspace,
  onImportWorkspace,
  onLoadWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
}: DbmlEditorProps) {
  const [draft, setDraft] = useState(source)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({})
  const [expandedWorkspaceIds, setExpandedWorkspaceIds] = useState<Set<string>>(
    () => new Set(currentWorkspaceId ? [currentWorkspaceId] : []),
  )

  useEffect(() => {
    setDraft(source)
  }, [source])

  useEffect(() => {
    setRenameDrafts(Object.fromEntries(
      workspaceSummaries.map((workspace) => [workspace.id, workspace.name]),
    ))
  }, [workspaceSummaries])

  useEffect(() => {
    if (!currentWorkspaceId) return
    setExpandedWorkspaceIds((current) => new Set(current).add(currentWorkspaceId))
  }, [currentWorkspaceId])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (draft !== source) {
        onChange(draft)
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [draft, onChange, source])

  const status = useMemo(() => {
    if (parseError) return t(language, 'editor.statusParseFailed')
    return t(language, 'editor.statusSynced')
  }, [language, parseError])

  const nextLanguage = language === 'zh' ? 'en' : 'zh'
  const languageTitle = t(
    language,
    nextLanguage === 'en' ? 'language.switchToEnglish' : 'language.switchToChinese',
  )

  return (
    <section className="editorPanel">
      <div className="panelHeader">
        <div>
          <h1>{t(language, 'app.title')}</h1>
          <Badge className="mt-1" variant={parseError ? 'destructive' : 'secondary'}>
            {status}
          </Badge>
        </div>
        <div className="toolbar">
          <FileImport language={language} onImport={onImportWorkspace} />
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            title={t(language, 'editor.workspaceList')}
            aria-label={t(language, 'editor.workspaceList')}
          >
            <FolderOpen size={18} />
          </Button>
          <Button
            size="icon"
            variant={isDirty ? 'default' : 'outline'}
            type="button"
            onClick={onSaveWorkspace}
            title={t(language, 'editor.saveWorkspace')}
            aria-label={t(language, 'editor.saveWorkspace')}
          >
            <Save size={18} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={() => onLanguageChange(nextLanguage)}
            title={languageTitle}
            aria-label={languageTitle}
          >
            <Languages size={18} />
            <span className="sr-only">{languageTitle}</span>
          </Button>
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={onLoadSample}
            title={t(language, 'editor.loadSample')}
            aria-label={t(language, 'editor.loadSample')}
          >
            <RotateCcw size={18} />
          </Button>
          <Button
            size="icon"
            variant="outline"
            type="button"
            onClick={() => void navigator.clipboard.writeText(draft)}
            title={t(language, 'editor.copyDbml')}
            aria-label={t(language, 'editor.copyDbml')}
          >
            <Clipboard size={18} />
          </Button>
        </div>
      </div>

      <div
        className="dropZone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault()
          const file = event.dataTransfer.files[0]
          if (file) {
            void file.text().then((source) => {
              onImportWorkspace(source, file.name.replace(/\.[^.]+$/, ''))
            })
          }
        }}
      >
        <Editor
          height="100%"
          language={dbmlLanguageId}
          theme={dbmlEditorTheme}
          value={draft}
          beforeMount={configureDbmlLanguage}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 2,
            automaticLayout: true,
          }}
          onChange={(value) => setDraft(value ?? '')}
        />
      </div>

      {parseError ? (
        <Alert className="errorPanel" variant="destructive">
          <AlertTitle>{parseError.message}</AlertTitle>
          <AlertDescription>
          <pre>{parseError.details}</pre>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLibraryOpen ? (
        <div className="workspaceDialogBackdrop">
          <section className="workspaceDialog" role="dialog" aria-modal="true" aria-label={t(language, 'editor.workspaceList')}>
            <div className="workspaceDialogHeader">
              <div>
                <h2>{t(language, 'editor.workspaceList')}</h2>
                <p>{t(language, 'editor.workspaceCount', { count: workspaceSummaries.length })}</p>
              </div>
              <Button size="sm" variant="outline" type="button" onClick={() => setIsLibraryOpen(false)}>
                {t(language, 'editor.closeWorkspaceList')}
              </Button>
            </div>

            <Button className="workspaceSaveButton" type="button" onClick={onSaveWorkspace}>
              <Save size={16} />
              {t(language, 'editor.saveWorkspace')}
            </Button>

            <div className="workspaceList">
              {workspaceSummaries.length ? workspaceSummaries.map((workspace) => {
                const isExpanded = expandedWorkspaceIds.has(workspace.id)
                const renameLabel = t(language, 'editor.renameWorkspace', { name: workspace.name })
                const loadLabel = t(language, 'editor.loadWorkspace', { name: workspace.name })
                const deleteLabel = t(language, 'editor.deleteWorkspace', { name: workspace.name })
                const saveNameLabel = t(language, 'editor.saveWorkspaceName', { name: workspace.name })
                const toggleLabel = t(
                  language,
                  isExpanded ? 'editor.collapseWorkspace' : 'editor.expandWorkspace',
                  { name: workspace.name },
                )

                return (
                  <article
                    className={[
                      'workspaceItem',
                      workspace.id === currentWorkspaceId ? 'active' : '',
                      isExpanded ? 'expanded' : '',
                    ].filter(Boolean).join(' ')}
                    key={workspace.id}
                  >
                    <div className="workspaceItemHeader">
                      <div className="workspaceItemMain">
                        <strong>{workspace.name}</strong>
                        <span>
                          {t(language, 'editor.workspaceMeta', {
                            tables: workspace.tableCount,
                            relations: workspace.relationCount,
                          })}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="outline"
                        type="button"
                        aria-label={toggleLabel}
                        title={toggleLabel}
                        aria-expanded={isExpanded}
                        onClick={() => {
                          setExpandedWorkspaceIds((current) => {
                            const next = new Set(current)
                            if (next.has(workspace.id)) {
                              next.delete(workspace.id)
                            } else {
                              next.add(workspace.id)
                            }
                            return next
                          })
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </Button>
                    </div>
                    {isExpanded ? (
                      <>
                        <div className="workspaceRename">
                          <Input
                            aria-label={renameLabel}
                            value={renameDrafts[workspace.id] ?? workspace.name}
                            onChange={(event) => {
                              setRenameDrafts((current) => ({
                                ...current,
                                [workspace.id]: event.target.value,
                              }))
                            }}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            type="button"
                            aria-label={saveNameLabel}
                            title={saveNameLabel}
                            onClick={() => onRenameWorkspace(workspace.id, renameDrafts[workspace.id] ?? workspace.name)}
                          >
                            <Check size={16} />
                          </Button>
                        </div>
                        <div className="workspaceActions">
                          <Button
                            size="sm"
                            variant="outline"
                            type="button"
                            aria-label={loadLabel}
                            onClick={() => {
                              onLoadWorkspace(workspace.id)
                              setIsLibraryOpen(false)
                            }}
                          >
                            {t(language, 'editor.loadWorkspaceAction')}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            type="button"
                            aria-label={deleteLabel}
                            title={deleteLabel}
                            onClick={() => onDeleteWorkspace(workspace.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </article>
                )
              }) : (
                <p className="workspaceEmpty">{t(language, 'editor.noSavedWorkspaces')}</p>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

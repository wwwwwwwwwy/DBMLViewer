import { Clipboard, Database, GitBranch, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { defaultLanguage, t, type Language } from '../../i18n'
import type { RelationModel, SchemaModel, TableModel } from '../dbml/dbmlTypes'
import {
  findRelationPath,
  findTableByQuery,
  suggestTables,
  type RelationPathResult,
  type RelationPathStep,
} from './relationPath'

type InspectorPanelProps = {
  model?: SchemaModel
  selectedTableId?: string
  selectedRelationId?: string
  language?: Language
  onCopyModel: () => Promise<void>
  onSelectTable?: (tableId: string) => void
  onSelectRelation?: (relationId: string) => void
}

export function InspectorPanel({
  model,
  selectedTableId,
  selectedRelationId,
  language = defaultLanguage,
  onCopyModel,
  onSelectTable,
  onSelectRelation,
}: InspectorPanelProps) {
  const table = model?.tables.find((item) => item.id === selectedTableId)
  const relation = model?.relations.find((item) => item.id === selectedRelationId)

  return (
    <aside className="inspectorPanel">
      <div className="panelHeader">
        <div>
          <h2>{t(language, 'inspector.title')}</h2>
          <Badge className="mt-1" variant="secondary">
            {model
              ? t(language, 'inspector.tableCount', { count: model.tables.length })
              : t(language, 'inspector.noDiagram')}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="outline"
          type="button"
          title={t(language, 'inspector.copyJson')}
          onClick={() => void onCopyModel()}
        >
          <Clipboard size={18} />
        </Button>
      </div>

      {table ? (
        <TableDetails
          table={table}
          relations={model?.relations ?? []}
          language={language}
          onSelectRelation={onSelectRelation}
        />
      ) : null}
      {!table && relation ? (
        <RelationDetails
          relation={relation}
          model={model}
          language={language}
          onSelectTable={onSelectTable}
        />
      ) : null}
      {!table && !relation ? <Overview model={model} language={language} onSelectTable={onSelectTable} /> : null}
    </aside>
  )
}

function Overview({
  model,
  language,
  onSelectTable,
}: {
  model?: SchemaModel
  language: Language
  onSelectTable?: (tableId: string) => void
}) {
  const [tableListQuery, setTableListQuery] = useState('')
  const filteredTables = useMemo(
    () => filterTablesForList(model?.tables ?? [], tableListQuery),
    [model?.tables, tableListQuery],
  )

  if (!model) {
    return <div className="emptyState">{t(language, 'inspector.empty')}</div>
  }

  return (
    <div className="summaryGrid">
      <Metric icon={<Database size={18} />} label={t(language, 'inspector.project')} value={model.project?.name || t(language, 'inspector.untitled')} />
      <Metric icon={<Table2 size={18} />} label={t(language, 'inspector.tables')} value={String(model.tables.length)} />
      <Metric icon={<GitBranch size={18} />} label={t(language, 'inspector.relations')} value={String(model.relations.length)} />
      <Metric icon={<Database size={18} />} label={t(language, 'inspector.enums')} value={String(model.enums.length)} />
      <RelationLookup model={model} language={language} />
      <section className="tableListSection">
        <h3>{t(language, 'inspector.tableList')}</h3>
        <Input
          aria-label={t(language, 'inspector.tableListSearch')}
          className="tableListSearch"
          value={tableListQuery}
          placeholder={t(language, 'inspector.tableListSearch')}
          onChange={(event) => setTableListQuery(event.target.value)}
        />
        <div className="tableList">
          {filteredTables.map((table) => (
            <button
              aria-label={`${table.name} ${table.note || t(language, 'inspector.noNote')}`}
              className="tableListItem"
              key={table.id}
              type="button"
              onClick={() => onSelectTable?.(table.id)}
            >
              <strong>{table.name}</strong>
              <p>{table.note || t(language, 'inspector.noNote')}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function RelationLookup({
  model,
  language,
}: {
  model: SchemaModel
  language: Language
}) {
  const [fromQuery, setFromQuery] = useState('')
  const [toQuery, setToQuery] = useState('')
  const [fromTableId, setFromTableId] = useState<string | undefined>()
  const [toTableId, setToTableId] = useState<string | undefined>()
  const [activeInput, setActiveInput] = useState<'from' | 'to' | undefined>()

  const fromSuggestions = useMemo(
    () => suggestTables(model, fromQuery),
    [model, fromQuery],
  )
  const toSuggestions = useMemo(
    () => suggestTables(model, toQuery),
    [model, toQuery],
  )
  const relationPath = useMemo(
    () => fromTableId && toTableId ? findRelationPath(model, fromTableId, toTableId) : undefined,
    [fromTableId, model, toTableId],
  )

  const handleQueryChange = (
    query: string,
    side: 'from' | 'to',
  ) => {
    const table = findTableByQuery(model, query)

    if (side === 'from') {
      setFromQuery(query)
      setFromTableId(table?.id)
    } else {
      setToQuery(query)
      setToTableId(table?.id)
    }
  }

  const handleSelectTable = (table: TableModel, side: 'from' | 'to') => {
    if (side === 'from') {
      setFromQuery(table.name)
      setFromTableId(table.id)
    } else {
      setToQuery(table.name)
      setToTableId(table.id)
    }

    setActiveInput(undefined)
  }

  return (
    <section className="relationLookup">
      <h3>{t(language, 'inspector.relationLookup')}</h3>
      <div className="relationLookupFields">
        <TableCombobox
          id="relationLookupFrom"
          label={t(language, 'inspector.relationLookupFrom')}
          language={language}
          value={fromQuery}
          suggestions={fromSuggestions}
          isOpen={activeInput === 'from'}
          onChange={(query) => handleQueryChange(query, 'from')}
          onFocus={() => setActiveInput('from')}
          onSelect={(table) => handleSelectTable(table, 'from')}
        />
        <TableCombobox
          id="relationLookupTo"
          label={t(language, 'inspector.relationLookupTo')}
          language={language}
          value={toQuery}
          suggestions={toSuggestions}
          isOpen={activeInput === 'to'}
          onChange={(query) => handleQueryChange(query, 'to')}
          onFocus={() => setActiveInput('to')}
          onSelect={(table) => handleSelectTable(table, 'to')}
        />
      </div>
      {fromTableId && toTableId ? (
        <RelationLookupResult
          fromTableId={fromTableId}
          language={language}
          result={relationPath ?? null}
          toTableId={toTableId}
        />
      ) : null}
    </section>
  )
}

function TableCombobox({
  id,
  label,
  language,
  value,
  suggestions,
  isOpen,
  onChange,
  onFocus,
  onSelect,
}: {
  id: string
  label: string
  language: Language
  value: string
  suggestions: TableModel[]
  isOpen: boolean
  onChange: (query: string) => void
  onFocus: () => void
  onSelect: (table: TableModel) => void
}) {
  const listId = `${id}Suggestions`

  return (
    <div className="tableCombobox">
      <label htmlFor={id}>{label}</label>
      <Input
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen}
        aria-label={label}
        id={id}
        role="combobox"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
      />
      {isOpen && suggestions.length ? (
        <div className="tableSuggestionList" id={listId} role="listbox">
          {suggestions.map((table) => (
            <button
              aria-label={`${table.name} ${table.note || t(language, 'inspector.noNote')}`}
              className="tableSuggestion"
              key={table.id}
              role="option"
              type="button"
              onClick={() => onSelect(table)}
            >
              <strong>{table.name}</strong>
              <span>{table.note || t(language, 'inspector.noNote')}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RelationLookupResult({
  fromTableId,
  toTableId,
  result,
  language,
}: {
  fromTableId: string
  toTableId: string
  result: RelationPathResult | null
  language: Language
}) {
  if (!result) {
    return (
      <div className="relationLookupResult relationLookupResultMuted">
        {t(language, 'inspector.unrelated')}
      </div>
    )
  }

  const intermediateTables = result.steps
    .map((step) => step.toTableId)
    .filter((tableId) => tableId !== fromTableId && tableId !== toTableId)

  return (
    <div className="relationLookupResult">
      <strong>
        {result.kind === 'direct'
          ? t(language, 'inspector.directRelation')
          : t(language, 'inspector.indirectRelation')}
      </strong>
      {intermediateTables.length ? (
        <p>{t(language, 'inspector.intermediateTables', { tables: intermediateTables.join(' → ') })}</p>
      ) : null}
      <div className="relationPathSteps">
        {result.steps.map((step) => (
          <div className="relationPathStep" key={`${step.relationId}-${step.fromTableId}-${step.toTableId}`}>
            {formatRelationStep(step)}
          </div>
        ))}
      </div>
    </div>
  )
}

function TableDetails({
  table,
  relations,
  language,
  onSelectRelation,
}: {
  table: TableModel
  relations: RelationModel[]
  language: Language
  onSelectRelation?: (relationId: string) => void
}) {
  const related = relations.filter(
    (relation) => relation.fromTableId === table.id || relation.toTableId === table.id,
  )

  return (
    <div className="detailStack">
      <section>
        <h3>{table.name}</h3>
        {table.note ? <p>{table.note}</p> : null}
      </section>
      <section>
        <h4>{t(language, 'inspector.columns')}</h4>
        {table.columns.map((column) => (
          <div className="detailItem" key={column.id}>
            <div className="detailRow">
              <span>{column.name}</span>
              <code>{column.type}</code>
            </div>
            {column.note ? <p className="detailNote">{column.note}</p> : null}
          </div>
        ))}
      </section>
      <section>
        <h4>{t(language, 'inspector.indexes')}</h4>
        {table.indexes.length ? (
          table.indexes.map((index) => (
            <div className="detailRow" key={index.id}>
              <span>{index.name || index.columns.join(', ')}</span>
              <code>{index.isUnique ? 'unique' : index.type || 'index'}</code>
            </div>
          ))
        ) : (
          <p>{t(language, 'inspector.noIndexes')}</p>
        )}
      </section>
      <section>
        <h4>{t(language, 'inspector.relations')}</h4>
        {related.map((relation) => (
          <button
            className="relationPill"
            key={relation.id}
            type="button"
            onClick={() => onSelectRelation?.(relation.id)}
          >
            {relation.fromTableId} → {relation.toTableId}
          </button>
        ))}
      </section>
    </div>
  )
}

function RelationDetails({
  relation,
  model,
  language,
  onSelectTable,
}: {
  relation: RelationModel
  model?: SchemaModel
  language: Language
  onSelectTable?: (tableId: string) => void
}) {
  const from = model?.tables.find((table) => table.id === relation.fromTableId)
  const to = model?.tables.find((table) => table.id === relation.toTableId)

  return (
    <div className="detailStack">
      <section>
        <h3>{relation.name || relation.id}</h3>
        <p>{relation.cardinality}</p>
      </section>
      <section>
        <h4>{t(language, 'inspector.endpoints')}</h4>
        <button
          className="detailRow detailRowButton"
          type="button"
          onClick={() => onSelectTable?.(relation.fromTableId)}
        >
          <span>{from?.name || relation.fromTableId}</span>
          <code>{relation.fromColumnIds.map(lastSegment).join(', ')}</code>
        </button>
        <button
          className="detailRow detailRowButton"
          type="button"
          onClick={() => onSelectTable?.(relation.toTableId)}
        >
          <span>{to?.name || relation.toTableId}</span>
          <code>{relation.toColumnIds.map(lastSegment).join(', ')}</code>
        </button>
      </section>
      <section>
        <h4>{t(language, 'inspector.actions')}</h4>
        <div className="detailRow">
          <span>{t(language, 'inspector.delete')}</span>
          <code>{relation.onDelete || t(language, 'inspector.notSet')}</code>
        </div>
        <div className="detailRow">
          <span>{t(language, 'inspector.update')}</span>
          <code>{relation.onUpdate || t(language, 'inspector.notSet')}</code>
        </div>
      </section>
    </div>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <Card className="metric">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <strong>{value}</strong>
      </CardContent>
    </Card>
  )
}

function lastSegment(value: string): string {
  const parts = value.split('.')
  return parts[parts.length - 1] || value
}

function formatRelationStep(step: RelationPathStep): string {
  return `${step.fromColumnIds.join(', ')} → ${step.toColumnIds.join(', ')}`
}

function filterTablesForList(tables: TableModel[], query: string): TableModel[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return tables

  return tables.filter((table) => {
    const tableNameMatches = table.name.toLowerCase().includes(normalizedQuery)
    const columnNoteMatches = table.columns.some((column) =>
      column.note?.toLowerCase().includes(normalizedQuery),
    )

    return tableNameMatches || columnNoteMatches
  })
}

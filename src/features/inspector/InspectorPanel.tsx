import { Clipboard, Database, GitBranch, Table2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { defaultLanguage, t, type Language } from '../../i18n'
import type { RelationModel, SchemaModel, TableModel } from '../dbml/dbmlTypes'

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

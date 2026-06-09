import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type AriaLabelConfig,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Download, LayoutDashboard, Search, ScanSearch } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toPng, toSvg } from 'html-to-image'
import { layoutGraph } from './layoutGraph'
import { RelationEdge } from './RelationEdge'
import { TableNode } from './TableNode'
import { filterModelByConnectedTables, filterModelBySelectedRelations } from './diagramFilter'
import { findMatchingTableId } from './diagramSearch'
import {
  buildFlowElements,
  type DbmlRelationEdge,
  type DbmlTableNode,
} from './flowMapper'
import { applyDiagramNodeChanges } from './nodeChanges'
import type { SavedNodePositions, SchemaModel } from '../dbml/dbmlTypes'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { defaultLanguage, t, type Language } from '../../i18n'

const nodeTypes = { table: TableNode }
const edgeTypes = { relation: RelationEdge }

type DiagramCanvasProps = {
  model?: SchemaModel
  positions: SavedNodePositions
  query: string
  language?: Language
  highlightedColumnIds: string[]
  selectedTableId?: string
  selectedRelationId?: string
  onQueryChange: (query: string) => void
  onNodePositionChange: (tableId: string, position: { x: number; y: number }) => void
  onSelectTable: (tableId?: string) => void
  onSelectRelation: (relationId?: string) => void
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

function DiagramCanvasInner({
  model,
  positions,
  query,
  language = defaultLanguage,
  highlightedColumnIds,
  selectedTableId,
  selectedRelationId,
  onQueryChange,
  onNodePositionChange,
  onSelectTable,
  onSelectRelation,
}: DiagramCanvasProps) {
  const reactFlow = useReactFlow<DbmlTableNode, DbmlRelationEdge>()
  const [nodes, setNodes] = useState<DbmlTableNode[]>([])
  const [edges, setEdges] = useState<DbmlRelationEdge[]>([])
  const [showRelatedOnly, setShowRelatedOnly] = useState(false)
  const [showConnectedOnly, setShowConnectedOnly] = useState(false)
  const [showObjectNotes, setShowObjectNotes] = useState(false)
  const ariaLabelConfig = useMemo<Partial<AriaLabelConfig>>(() => ({
    'controls.ariaLabel': t(language, 'diagram.controls'),
    'controls.zoomIn.ariaLabel': t(language, 'diagram.zoomIn'),
    'controls.zoomOut.ariaLabel': t(language, 'diagram.zoomOut'),
    'controls.fitView.ariaLabel': t(language, 'diagram.fit'),
    'controls.interactive.ariaLabel': t(language, 'diagram.toggleInteractivity'),
    'minimap.ariaLabel': t(language, 'diagram.miniMap'),
    'handle.ariaLabel': t(language, 'diagram.handle'),
  }), [language])
  const visibleModel = useMemo(() => {
    if (!model) return undefined
    const relatedModel = filterModelBySelectedRelations(model, showRelatedOnly, selectedTableId)
    return filterModelByConnectedTables(relatedModel, showConnectedOnly)
  }, [model, selectedTableId, showConnectedOnly, showRelatedOnly])

  useEffect(() => {
    if (!visibleModel) {
      setNodes([])
      setEdges([])
      return
    }

    const elements = buildFlowElements(
      visibleModel,
      positions,
      highlightedColumnIds,
      selectedTableId,
      language,
      showObjectNotes,
      selectedRelationId,
    )
    setNodes(elements.nodes)
    setEdges(elements.edges)
  }, [highlightedColumnIds, language, positions, selectedRelationId, selectedTableId, showObjectNotes, visibleModel])

  const matchedTableId = useMemo(() => {
    if (!visibleModel) return undefined
    return findMatchingTableId(visibleModel, query)
  }, [query, visibleModel])

  useEffect(() => {
    if (!matchedTableId) return

    const matchedNode = reactFlow.getNode(matchedTableId)
    if (matchedNode) {
      void reactFlow.setCenter(
        matchedNode.position.x + 150,
        matchedNode.position.y + 100,
        { duration: 400, zoom: 1.05 },
      )
    }
  }, [matchedTableId, reactFlow])

  useEffect(() => {
    if (!selectedTableId) return

    const selectedNode = nodes.find((node) => node.id === selectedTableId)
    if (!selectedNode) return

    void reactFlow.setCenter(
      selectedNode.position.x + 150,
      selectedNode.position.y + 100,
      { duration: 400, zoom: 1.05 },
    )
  }, [nodes, reactFlow, selectedTableId])

  const applyLayout = useCallback(async () => {
    const layouted = await layoutGraph(nodes, edges)
    setNodes(layouted)
    layouted.forEach((node) => onNodePositionChange(node.id, node.position))
    window.setTimeout(() => reactFlow.fitView({ padding: 0.2, duration: 300 }), 50)
  }, [edges, nodes, onNodePositionChange, reactFlow])

  function handleNodesChange(changes: NodeChange<DbmlTableNode>[]) {
    setNodes((currentNodes) => applyDiagramNodeChanges(changes, currentNodes))

    changes.forEach((change) => {
      if (change.type === 'position' && change.position && change.dragging === false) {
        onNodePositionChange(change.id, change.position)
      }
    })
  }

  async function exportImage(kind: 'png' | 'svg') {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!viewport) return

    const dataUrl = kind === 'png' ? await toPng(viewport) : await toSvg(viewport)
    const link = document.createElement('a')
    link.download = `dbml-diagram.${kind}`
    link.href = dataUrl
    link.click()
  }

  return (
    <section className="canvasPanel">
      <div className="canvasToolbar">
        <div className="searchBox">
          <Search size={17} />
          <Input
            className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            aria-label={t(language, 'diagram.search')}
            value={query}
            placeholder={t(language, 'diagram.search')}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <label className="toolbarCheckbox">
          <input
            type="checkbox"
            checked={showRelatedOnly}
            onChange={(event) => setShowRelatedOnly(event.target.checked)}
          />
          <span>{t(language, 'diagram.showRelatedOnly')}</span>
        </label>
        <label className="toolbarCheckbox">
          <input
            type="checkbox"
            checked={showConnectedOnly}
            onChange={(event) => setShowConnectedOnly(event.target.checked)}
          />
          <span>{t(language, 'diagram.hideIsolatedTables')}</span>
        </label>
        <label className="toolbarCheckbox">
          <input
            type="checkbox"
            checked={showObjectNotes}
            onChange={(event) => setShowObjectNotes(event.target.checked)}
          />
          <span>{t(language, 'diagram.showObjectNotes')}</span>
        </label>
        <Button size="sm" variant="outline" type="button" onClick={applyLayout}>
          <LayoutDashboard size={17} />
          {t(language, 'diagram.layout')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => reactFlow.fitView({ padding: 0.2, duration: 300 })}
        >
          <ScanSearch size={17} />
          {t(language, 'diagram.fit')}
        </Button>
        <Button size="icon" variant="outline" type="button" onClick={() => void exportImage('png')} title={t(language, 'diagram.exportPng')}>
          <Download size={17} />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => void exportImage('svg')} title={t(language, 'diagram.exportSvg')}>
          SVG
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        ariaLabelConfig={ariaLabelConfig}
        fitView
        onNodesChange={handleNodesChange}
        onNodeClick={(_, node) => onSelectTable(node.id)}
        onEdgeClick={(_, edge) => onSelectRelation(edge.id)}
        onPaneClick={() => {
          onSelectTable(undefined)
          onSelectRelation(undefined)
        }}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </section>
  )
}

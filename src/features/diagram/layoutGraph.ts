import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs/lib/elk.bundled.js'
import type { Edge, Node } from '@xyflow/react'

const elk = new ELK()

export async function layoutGraph<
  TNode extends Node<Record<string, unknown>>,
  TEdge extends Edge<Record<string, unknown>>,
>(
  nodes: TNode[],
  edges: TEdge[],
): Promise<typeof nodes> {
  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '80',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: Number(node.measured?.width) || 300,
      height: Number(node.measured?.height) || 220,
    })),
    edges: edges.map(
      (edge): ElkExtendedEdge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      }),
    ),
  }

  const layoutedGraph = await elk.layout(graph)
  const positions = new Map(
    (layoutedGraph.children ?? []).map((child) => [
      child.id,
      {
        x: child.x ?? 0,
        y: child.y ?? 0,
      },
    ]),
  )

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  })) as typeof nodes
}

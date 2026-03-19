import { Node, Edge } from '@xyflow/react';
import { ParsedNode, ParsedEdge, FlowNodeData } from '@/types/flow';
import { applyDagreLayout } from './layout';

export function buildFlowGraph(
  parsedNodes: ParsedNode[],
  parsedEdges: ParsedEdge[]
): { nodes: Node<FlowNodeData>[]; edges: Edge[] } {
  const nodes: Node<FlowNodeData>[] = parsedNodes.map(n => ({
    id: n.id,
    type: 'flowNode',
    position: { x: 0, y: 0 },
    data: { label: n.label, nodeType: n.nodeType },
  }));

  const edges: Edge[] = parsedEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    labelStyle: { fill: '#1e293b', fontWeight: 600, fontSize: 12 },
    labelBgStyle: { fill: '#f8fafc', fillOpacity: 0.9 },
    labelBgPadding: [4, 6] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: {
      type: 'arrowclosed' as const,
      color: '#94a3b8',
    },
  }));

  const laid = applyDagreLayout(nodes, edges);
  return { nodes: laid, edges };
}

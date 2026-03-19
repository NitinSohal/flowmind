import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;
const DECISION_SIZE = 80;

export function applyDagreLayout(
  nodes: Node<FlowNodeData>[],
  edges: Edge[]
): Node<FlowNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'TB',
    nodesep: 60,
    ranksep: 80,
    marginx: 40,
    marginy: 40,
    acyclicer: 'greedy',
    ranker: 'network-simplex',
  });

  for (const node of nodes) {
    const isDecision = node.data.nodeType === 'decision';
    g.setNode(node.id, {
      width: isDecision ? DECISION_SIZE * 1.6 : NODE_WIDTH,
      height: isDecision ? DECISION_SIZE : NODE_HEIGHT,
    });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map(node => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;
    const isDecision = node.data.nodeType === 'decision';
    const w = isDecision ? DECISION_SIZE * 1.6 : NODE_WIDTH;
    const h = isDecision ? DECISION_SIZE : NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: dagreNode.x - w / 2,
        y: dagreNode.y - h / 2,
      },
    };
  });
}

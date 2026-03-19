export type NodeType = 'start' | 'end' | 'process' | 'decision' | 'io';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  nodeType: NodeType;
  onLabelChange?: (id: string, label: string) => void;
}

export interface FlowGraphData {
  nodes: Array<{
    id: string;
    type?: string;
    data: FlowNodeData;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
    type?: string;
    animated?: boolean;
  }>;
}

export interface ParsedNode {
  id: string;
  nodeType: NodeType;
  label: string;
}

export interface ParsedEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

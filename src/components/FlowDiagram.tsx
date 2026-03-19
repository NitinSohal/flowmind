'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  NodeChange,
  EdgeChange,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  useReactFlow,
  BackgroundVariant,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { FlowNodeData, NodeType } from '@/types/flow';
import { ProcessNode, DecisionNode, StartEndNode, IONode } from './FlowNodes';
import { serializeDSL } from '@/lib/dslParser';

type FlowNode = Node<FlowNodeData>;

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: Edge[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onDslChange: (dsl: string) => void;
  onDropNode?: (nodeType: NodeType, label: string, position: { x: number; y: number }) => void;
}

function FlowNodeRouter(props: NodeProps<FlowNode>) {
  const nt = props.data.nodeType;
  if (nt === 'start' || nt === 'end') return <StartEndNode {...props} />;
  if (nt === 'decision') return <DecisionNode {...props} />;
  if (nt === 'io') return <IONode {...props} />;
  return <ProcessNode {...props} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = { flowNode: FlowNodeRouter };

function edgesToSerializable(edges: Edge[]) {
  return edges.map(e => ({
    source: e.source,
    target: e.target,
    label: typeof e.label === 'string' ? e.label : undefined,
  }));
}

function nodesToSerializable(nodes: FlowNode[]) {
  return nodes.map(n => ({
    id: n.id,
    data: { label: n.data.label, nodeType: n.data.nodeType },
  }));
}

function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onDslChange, onDropNode }: FlowDiagramProps) {
  const { fitView, screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (nodes.length > 0) {
      const t = setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 50);
      return () => clearTimeout(t);
    }
  }, [nodes.length, fitView]);

  const handleNodeLabelChange = useCallback(
    (id: string, newLabel: string) => {
      const updated = nodes.map(n =>
        n.id === id ? { ...n, data: { ...n.data, label: newLabel } } : n
      );
      onNodesChange(updated);
      onDslChange(serializeDSL(nodesToSerializable(updated), edgesToSerializable(edges)));
    },
    [nodes, edges, onNodesChange, onDslChange]
  );

  const nodesWithCallbacks = useMemo(
    () =>
      nodes.map(n => ({
        ...n,
        data: { ...n.data, onLabelChange: handleNodeLabelChange },
      })),
    [nodes, handleNodeLabelChange]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      const updated = applyNodeChanges(changes, nodesWithCallbacks) as FlowNode[];
      onNodesChange(updated);
      const hasDragEnd = changes.some(c => c.type === 'position' && !c.dragging);
      if (hasDragEnd) {
        onDslChange(serializeDSL(nodesToSerializable(updated), edgesToSerializable(edges)));
      }
    },
    [nodesWithCallbacks, edges, onNodesChange, onDslChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, edges);
      onEdgesChange(updated);
      onDslChange(serializeDSL(nodesToSerializable(nodes), edgesToSerializable(updated)));
    },
    [nodes, edges, onEdgesChange, onDslChange]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        id: `e_${connection.source}_${connection.target}_${Date.now()}`,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
        markerEnd: { type: 'arrowclosed' as const, color: '#94a3b8' },
      };
      const updated = addEdge(newEdge, edges);
      onEdgesChange(updated);
      onDslChange(serializeDSL(nodesToSerializable(nodes), edgesToSerializable(updated)));
    },
    [nodes, edges, onEdgesChange, onDslChange]
  );

  const handleEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const current = typeof edge.label === 'string' ? edge.label : '';
      const newLabel = window.prompt('Edge label:', current);
      if (newLabel === null) return; // cancelled
      const updated = edges.map(e =>
        e.id === edge.id ? { ...e, label: newLabel || undefined } : e
      );
      onEdgesChange(updated);
      onDslChange(serializeDSL(nodesToSerializable(nodes), edgesToSerializable(updated)));
    },
    [nodes, edges, onEdgesChange, onDslChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/flowmind-node-type') as NodeType;
      const label = e.dataTransfer.getData('application/flowmind-label');
      if (!nodeType || !label) return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      onDropNode?.(nodeType, label, position);
    },
    [screenToFlowPosition, onDropNode]
  );

  return (
    <ReactFlow
      nodes={nodesWithCallbacks}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onEdgeDoubleClick={handleEdgeDoubleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.2}
      maxZoom={2}
      className="bg-slate-50"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
      <Controls />
      <MiniMap
        nodeColor={n => {
          const nt = (n.data as FlowNodeData)?.nodeType;
          if (nt === 'start') return '#10b981';
          if (nt === 'end') return '#334155';
          if (nt === 'decision') return '#f59e0b';
          if (nt === 'io') return '#a855f7';
          return '#94a3b8';
        }}
        maskColor="rgba(248,250,252,0.7)"
        className="!border-slate-200 !rounded-lg"
      />
    </ReactFlow>
  );
}

export default function FlowDiagram(props: FlowDiagramProps) {
  return <FlowCanvas {...props} />;
}

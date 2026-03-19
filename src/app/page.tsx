'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Node, Edge, ReactFlowProvider } from '@xyflow/react';
import { FlowNodeData, NodeType } from '@/types/flow';
import { parseDSL, serializeDSL } from '@/lib/dslParser';
import { buildFlowGraph } from '@/lib/graphBuilder';
import { generateNodeId } from '@/lib/idGenerator';

const FlowDiagram = dynamic(() => import('@/components/FlowDiagram'), { ssr: false });
const SyntaxEditor = dynamic(() => import('@/components/SyntaxEditor'), { ssr: false });
const DnDSidebar = dynamic(() => import('@/components/DnDSidebar'), { ssr: false });
const ExportMenu = dynamic(() => import('@/components/ExportMenu'), { ssr: false });

const EXAMPLE_DSL = `[Start]
>Enter User Text<
{Text Provided?}
Analyze with AI
Generate Flowchart
Show Error
[End]

[Start] --> >Enter User Text<
>Enter User Text< --> {Text Provided?}
{Text Provided?} --Yes--> Analyze with AI
{Text Provided?} --No--> Show Error
Analyze with AI --> Generate Flowchart
Generate Flowchart --> [End]
Show Error --> [End]`;

function buildGraph(dsl: string) {
  const { nodes: pNodes, edges: pEdges } = parseDSL(dsl);
  return buildFlowGraph(pNodes, pEdges);
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [dsl, setDsl] = useState(EXAMPLE_DSL);
  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [leftPanel, setLeftPanel] = useState<'input' | 'syntax'>('input');
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial render from example DSL
  useEffect(() => {
    const { nodes: n, edges: e } = buildGraph(EXAMPLE_DSL);
    setNodes(n);
    setEdges(e);
  }, []);

  const handleDslChange = useCallback((newDsl: string) => {
    setDsl(newDsl);
    if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
    updateTimerRef.current = setTimeout(() => {
      const { nodes: n, edges: e } = buildGraph(newDsl);
      setNodes(n);
      setEdges(e);
    }, 400);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) return;
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      handleDslChange(data.dsl);
      setLeftPanel('syntax');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, handleDslChange]);

  const handleNodesChange = useCallback((updated: Node<FlowNodeData>[]) => {
    setNodes(updated);
  }, []);

  const handleEdgesChange = useCallback((updated: Edge[]) => {
    setEdges(updated);
  }, []);

  const handleDslFromDiagram = useCallback((newDsl: string) => {
    setDsl(newDsl);
  }, []);

  const handleDropNode = useCallback(
    (nodeType: NodeType, label: string, position: { x: number; y: number }) => {
      const newNode: Node<FlowNodeData> = {
        id: generateNodeId(),
        type: 'flowNode',
        position,
        data: { label, nodeType },
      };
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);

      const serNodes = updatedNodes.map(n => ({
        id: n.id,
        data: { label: n.data.label, nodeType: n.data.nodeType },
      }));
      const serEdges = edges.map(e => ({
        source: e.source,
        target: e.target,
        label: typeof e.label === 'string' ? e.label : undefined,
      }));
      setDsl(serializeDSL(serNodes, serEdges));
    },
    [nodes, edges]
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4 4 4m6 0v12m0 0 4-4m-4 4-4-4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">FlowMind</h1>
          <span className="text-xs text-slate-400 font-medium">AI-powered flowcharts</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Double-click any node to edit label</span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden gap-2 p-2">
        {/* Left Panel */}
        <div className="flex flex-col w-[380px] flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setLeftPanel('input')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                leftPanel === 'input'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              AI Input
            </button>
            <button
              onClick={() => setLeftPanel('syntax')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                leftPanel === 'syntax'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              DSL Syntax
            </button>
          </div>

          {/* AI Input panel */}
          {leftPanel === 'input' && (
            <div className="flex flex-col flex-1 p-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Describe your process
                </label>
                <textarea
                  className="w-full h-52 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-400"
                  placeholder="e.g. A customer submits an order. Check if items are in stock. If yes, process payment and confirm order. If not, notify customer and offer alternatives. If payment fails, ask to retry or cancel."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
                  }}
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !inputText.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Flowchart
                    <span className="text-xs opacity-70 ml-1">⌘↵</span>
                  </>
                )}
              </button>

              {/* Legend */}
              <div className="mt-auto pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Node types</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <code className="text-slate-500">[Start]</code>
                    <span>Start/End</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-300 flex-shrink-0" />
                    <code className="text-slate-500">text</code>
                    <span>Process</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rotate-45 bg-amber-400 flex-shrink-0" />
                    <code className="text-slate-500">{'{text}'}</code>
                    <span>Decision</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-purple-300 flex-shrink-0" />
                    <code className="text-slate-500">&gt;text&lt;</code>
                    <span>I/O</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Syntax editor panel */}
          {leftPanel === 'syntax' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Live DSL — edits update diagram instantly</span>
                <button
                  onClick={() => {
                    handleDslChange(EXAMPLE_DSL);
                    setInputText('');
                  }}
                  className="text-xs text-blue-500 hover:text-blue-700 transition"
                >
                  Reset
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SyntaxEditor value={dsl} onChange={handleDslChange} />
              </div>
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <code className="bg-slate-200 px-1 rounded">--&gt;</code> edge &nbsp;
                  <code className="bg-slate-200 px-1 rounded">--Label--&gt;</code> labeled &nbsp;
                  <code className="bg-slate-200 px-1 rounded">#</code> comment
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Diagram panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
          <ReactFlowProvider>
            <FlowDiagram
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onDslChange={handleDslFromDiagram}
              onDropNode={handleDropNode}
            />
            <DnDSidebar />

            {nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 pointer-events-none">
                <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4 4 4m6 0v12m0 0 4-4m-4 4-4-4" />
                </svg>
                <p className="text-sm font-medium">Enter text and click Generate, edit DSL, or drag nodes from the sidebar</p>
              </div>
            )}

            {/* Stats overlay */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm text-xs text-slate-500 space-y-0.5">
                <div><span className="text-slate-700 font-medium">{nodes.length}</span> nodes</div>
                <div><span className="text-slate-700 font-medium">{edges.length}</span> edges</div>
              </div>
              <ExportMenu />
              {nodes.length > 0 && (
                <button
                  onClick={() => { setNodes([]); setEdges([]); setDsl(''); }}
                  title="Clear workspace"
                  className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-sm text-slate-400 hover:text-red-500 hover:border-red-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

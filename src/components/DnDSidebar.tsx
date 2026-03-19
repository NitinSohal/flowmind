'use client';

import { DragEvent } from 'react';
import { NodeType } from '@/types/flow';

interface DragItem {
  nodeType: NodeType;
  label: string;
  shape: React.ReactNode;
}

const items: DragItem[] = [
  {
    nodeType: 'start',
    label: 'Start',
    shape: <span className="w-6 h-3.5 rounded-full bg-emerald-500 inline-block" />,
  },
  {
    nodeType: 'end',
    label: 'End',
    shape: <span className="w-6 h-3.5 rounded-full bg-slate-700 inline-block" />,
  },
  {
    nodeType: 'process',
    label: 'Process',
    shape: <span className="w-6 h-4 rounded-sm bg-slate-400 inline-block" />,
  },
  {
    nodeType: 'decision',
    label: 'Decision',
    shape: <span className="w-4 h-4 rotate-45 bg-amber-400 inline-block" />,
  },
  {
    nodeType: 'io',
    label: 'I/O',
    shape: (
      <span
        className="w-6 h-4 bg-purple-400 inline-block"
        style={{ transform: 'skewX(-12deg)', borderRadius: 2 }}
      />
    ),
  },
];

function onDragStart(e: DragEvent, item: DragItem) {
  e.dataTransfer.setData('application/flowmind-node-type', item.nodeType);
  e.dataTransfer.setData('application/flowmind-label', item.label);
  e.dataTransfer.effectAllowed = 'move';
}

export default function DnDSidebar() {
  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-sm">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
        Drag to add
      </span>
      {items.map((item) => (
        <div
          key={item.nodeType}
          draggable
          onDragStart={(e) => onDragStart(e, item)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab hover:bg-slate-100 active:cursor-grabbing transition-colors select-none"
        >
          {item.shape}
          <span className="text-xs text-slate-600 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

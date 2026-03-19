'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';

type FlowNodeProps = NodeProps<Node<FlowNodeData>>;

const EditableLabel = ({
  label,
  onSave,
  className,
}: {
  label: string;
  onSave: (v: string) => void;
  className?: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(label); }, [label]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (value.trim() && value.trim() !== label) {
      onSave(value.trim());
    } else {
      setValue(label);
    }
  }, [value, label, onSave]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setValue(label); setEditing(false); }
        }}
        className={`bg-transparent border-b-2 border-blue-400 outline-none text-center w-full ${className}`}
        onClick={e => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={`cursor-text select-none ${className}`}
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
      title="Double-click to edit"
    >
      {label}
    </span>
  );
};

export const ProcessNode = memo(({ data, id }: FlowNodeProps) => (
  <div className="relative group">
    <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
    <div className="bg-white border-2 border-slate-300 rounded-lg px-4 py-2 shadow-sm hover:border-blue-400 hover:shadow-md transition-all min-w-[140px] max-w-[200px]">
      <EditableLabel
        label={data.label}
        onSave={v => data.onLabelChange?.(id, v)}
        className="text-sm font-medium text-slate-700 block text-center leading-tight"
      />
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
  </div>
));
ProcessNode.displayName = 'ProcessNode';

export const DecisionNode = memo(({ data, id }: FlowNodeProps) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} className="!bg-amber-400 !w-2 !h-2" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-amber-400 !w-2 !h-2" />
    <Handle type="source" position={Position.Left} id="left" className="!bg-amber-400 !w-2 !h-2" />
    <Handle type="source" position={Position.Right} id="right" className="!bg-amber-400 !w-2 !h-2" />
    <div
      className="flex items-center justify-center bg-amber-50 border-2 border-amber-400 hover:border-amber-500 hover:shadow-md transition-all"
      style={{ width: 140, height: 70, transform: 'rotate(45deg)' }}
    >
      <div style={{ transform: 'rotate(-45deg)', width: 120, textAlign: 'center' }}>
        <EditableLabel
          label={data.label}
          onSave={v => data.onLabelChange?.(id, v)}
          className="text-xs font-semibold text-amber-800 leading-tight"
        />
      </div>
    </div>
  </div>
));
DecisionNode.displayName = 'DecisionNode';

export const StartEndNode = memo(({ data, id }: FlowNodeProps) => {
  const isEnd = data.nodeType === 'end';
  return (
    <div className="relative">
      {isEnd && <Handle type="target" position={Position.Top} className="!bg-slate-500 !w-2 !h-2" />}
      <div
        className={`flex items-center justify-center px-5 py-2 shadow-sm hover:shadow-md transition-all rounded-full ${
          isEnd ? 'bg-slate-700 border-2 border-slate-800' : 'bg-emerald-500 border-2 border-emerald-600'
        }`}
        style={{ minWidth: 100 }}
      >
        <EditableLabel
          label={data.label}
          onSave={v => data.onLabelChange?.(id, v)}
          className="text-sm font-bold text-white"
        />
      </div>
      {!isEnd && <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-2 !h-2" />}
    </div>
  );
});
StartEndNode.displayName = 'StartEndNode';

export const IONode = memo(({ data, id }: FlowNodeProps) => (
  <div className="relative">
    <Handle type="target" position={Position.Top} className="!bg-purple-400 !w-2 !h-2" />
    <div
      className="bg-purple-50 border-2 border-purple-300 hover:border-purple-500 hover:shadow-md transition-all flex items-center justify-center px-5 py-2"
      style={{ minWidth: 140, clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)' }}
    >
      <EditableLabel
        label={data.label}
        onSave={v => data.onLabelChange?.(id, v)}
        className="text-sm font-medium text-purple-800 text-center"
      />
    </div>
    <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-2 !h-2" />
  </div>
));
IONode.displayName = 'IONode';

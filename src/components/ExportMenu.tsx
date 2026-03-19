'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useReactFlow, useStore } from '@xyflow/react';
import { exportToPng, exportToSvg, exportToPdf, exportToVsdx } from '@/lib/exportUtils';

type ExportFormat = 'png' | 'svg' | 'pdf' | 'vsdx';

const FORMAT_OPTIONS: { key: ExportFormat; label: string }[] = [
  { key: 'png', label: 'PNG Image' },
  { key: 'svg', label: 'SVG Vector' },
  { key: 'pdf', label: 'PDF Document' },
  { key: 'vsdx', label: 'Visio (VSDX)' },
];

const exportFns: Record<ExportFormat, typeof exportToPng> = {
  png: exportToPng,
  svg: exportToSvg,
  pdf: exportToPdf,
  vsdx: exportToVsdx,
};

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<ExportFormat>>(new Set(['png']));
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getNodes } = useReactFlow();
  const domNode = useStore((s) => s.domNode);

  const nodes = getNodes();
  const hasNodes = nodes.length > 0;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleFormat = useCallback((fmt: ExportFormat) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fmt)) {
        next.delete(fmt);
      } else {
        next.add(fmt);
      }
      return next;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (!domNode || selected.size === 0) return;
    const viewport = domNode.querySelector('.react-flow__viewport') as HTMLElement | null;
    if (!viewport) return;

    const currentNodes = getNodes();
    if (currentNodes.length === 0) return;

    setExporting(true);
    try {
      for (const fmt of selected) {
        await exportFns[fmt]({ viewportElement: viewport, nodes: currentNodes });
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
      setOpen(false);
    }
  }, [domNode, selected, getNodes]);

  if (!hasNodes) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Download flowchart"
        className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-2 shadow-sm text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export format</span>
          </div>
          <div className="py-1">
            {FORMAT_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggleFormat(key)}
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-slate-100">
            <button
              onClick={handleExport}
              disabled={selected.size === 0 || exporting}
              className="w-full py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : `Download (${selected.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

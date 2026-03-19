'use client';

import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface SyntaxEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const DSL_LANGUAGE_ID = 'flowmind';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerFlowMindLanguage(monaco: any) {
  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === DSL_LANGUAGE_ID)) return;

  monaco.languages.register({ id: DSL_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(DSL_LANGUAGE_ID, {
    tokenizer: {
      root: [
        [/#.*$/, 'comment'],
        [/\[.*?\]/, 'keyword'],
        [/\{.*?\}/, 'type'],
        [/>.*?</, 'string'],
        [/--[^-]*-->/, 'delimiter'],
        [/-->/, 'delimiter'],
      ],
    },
  });

  monaco.editor.defineTheme('flowmind-theme', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
      { token: 'keyword', foreground: '059669', fontStyle: 'bold' },
      { token: 'type', foreground: 'd97706', fontStyle: 'bold' },
      { token: 'string', foreground: '7c3aed' },
      { token: 'delimiter', foreground: '3b82f6', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#f8fafc',
      'editor.foreground': '#1e293b',
      'editor.lineHighlightBackground': '#e2e8f020',
      'editorLineNumber.foreground': '#94a3b8',
      'editorCursor.foreground': '#3b82f6',
    },
  });
}

export default function SyntaxEditor({ value, onChange }: SyntaxEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    registerFlowMindLanguage(monaco);
    monaco.editor.setTheme('flowmind-theme');
  };

  // Keep editor in sync when value changes externally (e.g. from diagram edit)
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(value);
        if (position) editorRef.current.setPosition(position);
      }
    }
  }, [value]);

  return (
    <MonacoEditor
      height="100%"
      language={DSL_LANGUAGE_ID}
      value={value}
      onChange={v => onChange(v ?? '')}
      onMount={handleMount}
      options={{
        fontSize: 13,
        lineHeight: 22,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: false,
        renderLineHighlight: 'line',
        padding: { top: 12, bottom: 12 },
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: {
          verticalScrollbarSize: 6,
          horizontalScrollbarSize: 6,
        },
      }}
    />
  );
}

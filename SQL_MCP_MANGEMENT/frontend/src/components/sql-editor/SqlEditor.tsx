import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react';
import { Skeleton } from '@/components/ui/Skeleton';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
}

const THEME = 'studio-night';

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword.sql', foreground: '9DABFF' },
      { token: 'operator.sql', foreground: 'C4CBE8' },
      { token: 'string.sql', foreground: '8FE0B4' },
      { token: 'number.sql', foreground: 'F2BE7A' },
      { token: 'comment.sql', foreground: '6F7BA6' },
      { token: 'predefined.sql', foreground: 'E7A8D8' },
    ],
    colors: {
      'editor.background': '#0C1329',
      'editor.lineHighlightBackground': '#131C3A',
      'editorLineNumber.foreground': '#4A5784',
      'editorLineNumber.activeForeground': '#9DABFF',
      'editor.selectionBackground': '#2B3A6B',
      'editorCursor.foreground': '#9DABFF',
    },
  });
};

export function SqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  const handleMount: OnMount = (editor, monaco) => {
    // Ctrl/Cmd + Enter runs the query.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-navy-700 bg-navy-900 shadow-card">
      <Editor
        height="240px"
        language="sql"
        theme={THEME}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        beforeMount={defineTheme}
        onMount={handleMount}
        loading={<Skeleton className="m-4 h-[200px] bg-navy-800" />}
        options={{
          ariaLabel: 'SQL query editor',
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          lineHeight: 22,
          padding: { top: 14, bottom: 14 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          renderLineHighlight: 'line',
          wordWrap: 'on',
          tabSize: 2,
        }}
      />
    </div>
  );
}

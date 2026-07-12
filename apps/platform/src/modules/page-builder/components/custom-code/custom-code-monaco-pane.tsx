"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center bg-slate-50 text-sm text-slate-500">
      Loading editor…
    </div>
  ),
});

export type CustomCodeEditorLanguage = "html" | "css" | "javascript";

type CustomCodeMonacoPaneProps = {
  language: CustomCodeEditorLanguage;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CustomCodeMonacoPane({
  language,
  value,
  onChange,
  className,
}: CustomCodeMonacoPaneProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200", className)}>
      <MonacoEditor
        language={language}
        value={value}
        theme="vs"
        onChange={(next) => onChange(next ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
        }}
      />
    </div>
  );
}

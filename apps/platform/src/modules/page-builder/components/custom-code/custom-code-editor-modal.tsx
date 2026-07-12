"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEditor } from "@craftjs/core";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { buildCustomCodeSrcdoc } from "@/modules/page-builder/lib/custom-code-srcdoc";
import { CustomCodeMonacoPane } from "@/modules/page-builder/components/custom-code/custom-code-monaco-pane";
import { CustomCodePreviewFrame } from "@/modules/page-builder/components/custom-code/custom-code-preview-frame";

type CustomCodeDraft = {
  html: string;
  css: string;
  js: string;
};

type CustomCodeProps = CustomCodeDraft & {
  autoOpenEditor?: boolean;
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function CustomCodeEditorModal() {
  const nodeId = useBuilderStore((s) => s.customCodeEditorNodeId);
  const closeCustomCodeEditor = useBuilderStore((s) => s.closeCustomCodeEditor);
  const { actions, query } = useEditor();

  const [draft, setDraft] = useState<CustomCodeDraft>({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "javascript">("html");
  const [previewRevision, setPreviewRevision] = useState(0);

  const open = Boolean(nodeId);

  useEffect(() => {
    if (!nodeId) return;
    try {
      const node = query.node(nodeId).get();
      const props = node.data.props as CustomCodeProps;
      setDraft({
        html: props.html ?? "",
        css: props.css ?? "",
        js: props.js ?? "",
      });
      setActiveTab("html");
      setPreviewRevision((n) => n + 1);
    } catch {
      closeCustomCodeEditor();
    }
  }, [nodeId, query, closeCustomCodeEditor]);

  const debouncedDraft = useDebouncedValue(draft, 300);
  const previewSrcDoc = useMemo(
    () => buildCustomCodeSrcdoc(debouncedDraft.html, debouncedDraft.css, debouncedDraft.js),
    [debouncedDraft],
  );

  useEffect(() => {
    setPreviewRevision((n) => n + 1);
  }, [previewSrcDoc]);

  const handleSave = useCallback(() => {
    if (!nodeId) return;
    actions.setProp(nodeId, (props: CustomCodeProps) => {
      props.html = draft.html;
      props.css = draft.css;
      props.js = draft.js;
      props.autoOpenEditor = false;
    });
    closeCustomCodeEditor();
  }, [nodeId, actions, draft, closeCustomCodeEditor]);

  const handleCancel = useCallback(() => {
    closeCustomCodeEditor();
  }, [closeCustomCodeEditor]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleCancel()}>
      <DialogContent
        showCloseButton
        className="flex h-[min(90vh,900px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 pr-12">
          <DialogTitle className="text-slate-900">Custom Code</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Edit HTML, CSS, and JavaScript. Code runs in an isolated sandbox on the page.
          </p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex min-h-0 flex-1 flex-col border-b border-slate-200 md:border-r md:border-b-0">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <TabsList className="mx-4 mt-3 mb-0 w-auto shrink-0 self-start">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="html" className="mt-0 flex min-h-0 flex-1 flex-col p-4 pt-3">
                <CustomCodeMonacoPane
                  language="html"
                  value={draft.html}
                  onChange={(html) => setDraft((d) => ({ ...d, html }))}
                  className="min-h-[240px]"
                />
              </TabsContent>
              <TabsContent value="css" className="mt-0 flex min-h-0 flex-1 flex-col p-4 pt-3">
                <CustomCodeMonacoPane
                  language="css"
                  value={draft.css}
                  onChange={(css) => setDraft((d) => ({ ...d, css }))}
                  className="min-h-[240px]"
                />
              </TabsContent>
              <TabsContent value="javascript" className="mt-0 flex min-h-0 flex-1 flex-col p-4 pt-3">
                <CustomCodeMonacoPane
                  language="javascript"
                  value={draft.js}
                  onChange={(js) => setDraft((d) => ({ ...d, js }))}
                  className="min-h-[240px]"
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex min-h-[240px] flex-1 flex-col md:min-h-0">
            <div className="shrink-0 border-b border-slate-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              Live preview
            </div>
            <div className="min-h-0 flex-1 p-4">
              <CustomCodePreviewFrame
                srcDoc={previewSrcDoc}
                previewKey={previewRevision}
                className="rounded-md border border-slate-200"
                minHeight="100%"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-slate-50/80 px-5 py-4">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

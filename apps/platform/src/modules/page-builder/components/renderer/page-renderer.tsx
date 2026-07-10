"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Editor, Frame } from "@craftjs/core";
import { craftResolver } from "@/modules/page-builder/blocks";
import { publishedPageCssVars } from "@/modules/page-builder/lib/theme";
import { PublishedPageProvider } from "@/modules/page-builder/lib/published-page-context";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";

type PageRendererProps = {
  craftState: CraftSerializedState;
  theme?: ThemeJson;
  landingPageSlug?: string;
  formJson?: FormJson | null;
  onLeadSubmit?: (data: Record<string, string>) => Promise<void>;
  /** When true, fill a parent flex column (e.g. preview banner + page). */
  fillParent?: boolean;
};

function craftHasLeadForm(craft: CraftSerializedState): boolean {
  return Object.values(craft).some((node) => node?.type?.resolvedName === "LeadForm");
}

export function PageRenderer({
  craftState,
  theme = DEFAULT_THEME,
  landingPageSlug,
  formJson,
  onLeadSubmit,
  fillParent = false,
}: PageRendererProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const needsImplicitForm = !!onLeadSubmit && !craftHasLeadForm(craftState);

  async function handleImplicitSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onLeadSubmit || loading) return;

    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key !== "honeypot") data[key] = String(value);
    });

    try {
      await onLeadSubmit(data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const page = (
    <div
      id="pb-page"
      className={
        fillParent
          ? "pb-published-page flex min-h-[var(--pb-viewport-fill,100dvh)] w-full flex-1 flex-col"
          : "pb-published-page flex min-h-screen w-full flex-col"
      }
      style={{
        ...publishedPageCssVars(theme, { includeBackground: !fillParent }),
        ...(fillParent ? {} : { ["--pb-viewport-fill" as string]: "100dvh" }),
        fontFamily: theme.fontFamily,
        color: "var(--pb-page-text)",
      }}
    >
      {error && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        </div>
      )}
      {submitted && !error ? (
        <div className="flex min-h-[40vh] items-center justify-center px-4 text-sm text-slate-600">
          Submitting…
        </div>
      ) : (
        <Editor resolver={craftResolver} enabled={false}>
          <Frame data={craftState as never} />
        </Editor>
      )}
      {needsImplicitForm && loading && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
          <span className="rounded-full bg-slate-900/90 px-3 py-1.5 text-xs text-white">
            Submitting…
          </span>
        </div>
      )}
    </div>
  );

  return (
    <PublishedPageProvider value={{ landingPageSlug, onLeadSubmit, formJson }}>
      {needsImplicitForm ? (
        <form
          id="pb-optin-form"
          className={fillParent ? "flex min-h-[var(--pb-viewport-fill,100dvh)] flex-1 flex-col" : undefined}
          onSubmit={handleImplicitSubmit}
          noValidate
        >
          <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
          {page}
        </form>
      ) : (
        page
      )}
    </PublishedPageProvider>
  );
}

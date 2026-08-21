"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UtmFields = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
};

function nonEmpty(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function AdvertiserUtmCell({ source, medium, campaign, content, term }: UtmFields) {
  const parts = [
    nonEmpty(source),
    nonEmpty(medium),
    nonEmpty(campaign),
  ].filter(Boolean) as string[];

  const hasAny = Boolean(
    parts.length || nonEmpty(content) || nonEmpty(term),
  );

  if (!hasAny) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const summary =
    parts.length > 0
      ? parts.join(" · ")
      : [nonEmpty(content), nonEmpty(term)].filter(Boolean).join(" · ");

  const detailLines = [
    `source: ${nonEmpty(source) ?? "—"}`,
    `medium: ${nonEmpty(medium) ?? "—"}`,
    `campaign: ${nonEmpty(campaign) ?? "—"}`,
    `content: ${nonEmpty(content) ?? "—"}`,
    `term: ${nonEmpty(term) ?? "—"}`,
  ];

  return (
    <TooltipProvider delay={150}>
      <Tooltip>
        <TooltipTrigger
          type="button"
          className="max-w-[10rem] cursor-default truncate text-left text-sm text-slate-600 underline decoration-slate-300 decoration-dotted underline-offset-2"
          title={detailLines.join("\n")}
        >
          {summary}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="start"
          className="max-w-xs flex-col items-start gap-0.5 bg-slate-900 py-2 text-left text-xs text-white"
        >
          {detailLines.map((line) => (
            <p key={line} className="whitespace-nowrap font-normal">
              {line}
            </p>
          ))}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

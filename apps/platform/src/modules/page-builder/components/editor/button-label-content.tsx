"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { resolveButtonIcon } from "@/modules/page-builder/lib/button-icons";
import { RichTextField } from "@/modules/page-builder/components/editor/rich-text-field";

type ButtonLabelProps = {
  text: string;
  editable: boolean;
  onChange: (html: string) => void;
  icon?: string;
  iconPosition?: "left" | "right";
  iconSize?: number;
};

export function ButtonLabelContent({
  text,
  editable,
  onChange,
  icon,
  iconPosition = "left",
  iconSize = 16,
}: ButtonLabelProps) {
  const Icon = resolveButtonIcon(icon);
  const iconEl = Icon ? <Icon size={iconSize} className="shrink-0" aria-hidden /> : null;

  const label = (
    <RichTextField value={text} editable={editable} onChange={onChange} className="inline" />
  );

  if (!iconEl) return label;

  return (
    <span className={cn("inline-flex items-center gap-2")}>
      {iconPosition === "left" ? iconEl : null}
      {label}
      {iconPosition === "right" ? iconEl : null}
    </span>
  );
}

export function renderButtonLabel(text: string, icon?: string, iconPosition?: "left" | "right"): ReactNode {
  const Icon = resolveButtonIcon(icon);
  const label = <RichTextField value={text} editable={false} onChange={() => {}} />;
  if (!Icon) return label;
  return (
    <span className="inline-flex items-center gap-2">
      {iconPosition !== "right" ? <Icon size={16} className="shrink-0" aria-hidden /> : null}
      {label}
      {iconPosition === "right" ? <Icon size={16} className="shrink-0" aria-hidden /> : null}
    </span>
  );
}

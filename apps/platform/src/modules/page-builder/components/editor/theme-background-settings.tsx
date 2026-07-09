"use client";

import { useActivePageTheme } from "@/modules/page-builder/hooks/use-active-page-theme";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { BuilderImageUpload } from "@/modules/page-builder/components/editor/builder-image-upload";
import { cn } from "@/lib/utils";

type ThemeBackgroundSettingsProps = {
  compact?: boolean;
  labelClass?: string;
};

export function ThemeBackgroundSettings({ compact, labelClass }: ThemeBackgroundSettingsProps) {
  const { theme, setTheme } = useActivePageTheme();

  function patchTheme(patch: Partial<ThemeJson>) {
    setTheme({ ...theme, ...patch });
  }

  return (
    <div className={cn("space-y-3", compact ? "p-1" : "")}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-[11px] font-medium text-slate-600", labelClass)}>Page background color</span>
        <input
          type="color"
          value={theme.backgroundColor}
          onChange={(e) => patchTheme({ backgroundColor: e.target.value })}
          className="h-7 w-7 cursor-pointer rounded border border-slate-200"
        />
      </div>

      <div className="space-y-1.5">
        <span className={cn("text-[11px] font-medium text-slate-600", labelClass)}>Page background image</span>
        <BuilderImageUpload
          value={theme.backgroundImage ?? ""}
          onChange={(url) => patchTheme({ backgroundImage: url })}
          onClear={() => patchTheme({ backgroundImage: "" })}
        />
        {theme.backgroundImage ? (
          <select
            value={theme.backgroundSize ?? "cover"}
            onChange={(e) => patchTheme({ backgroundSize: e.target.value as ThemeJson["backgroundSize"] })}
            className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
          </select>
        ) : null}
      </div>
    </div>
  );
}

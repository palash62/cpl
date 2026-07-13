"use client";

import { useActivePageTheme } from "@/modules/page-builder/hooks/use-active-page-theme";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import { BuilderImageUpload } from "@/modules/page-builder/components/editor/builder-image-upload";
import { ColorField } from "@/modules/page-builder/components/settings/ghl/controls";
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

  const pageBg = theme.backgroundColor ?? "";
  const isDefaultBg =
    pageBg.trim().toLowerCase() === DEFAULT_THEME.backgroundColor.toLowerCase();

  return (
    <div className={cn("space-y-3", compact ? "p-1" : "")}>
      <div className={cn(labelClass && "[&_label]:text-inherit")}>
        <ColorField
          label="Page background color"
          value={pageBg}
          onChange={(v) => patchTheme({ backgroundColor: v || DEFAULT_THEME.backgroundColor })}
          onClear={() => patchTheme({ backgroundColor: DEFAULT_THEME.backgroundColor })}
          placeholder={DEFAULT_THEME.backgroundColor}
          fallbackHex={DEFAULT_THEME.backgroundColor}
          clearLabel="Remove color"
          showClear={!isDefaultBg && Boolean(pageBg.trim())}
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

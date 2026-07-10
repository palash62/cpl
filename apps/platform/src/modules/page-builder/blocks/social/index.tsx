"use client";

import { useNode, useEditor } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings, FieldLabel, FieldInput } from "@/modules/page-builder/components/settings/shared/block-settings";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

const SOCIAL_ICONS: Record<string, string> = {
  SocialFacebook: "Facebook",
  SocialInstagram: "Instagram",
  SocialWhatsApp: "WhatsApp",
  SocialYouTube: "YouTube",
};

type SocialProps = BlockProps & { url?: string; platform?: string };

function SocialSettings() {
  const { url, actions: { setProp } } = useNode((node) => ({ url: node.data.props.url as string }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Profile URL</FieldLabel>
        <FieldInput value={url ?? ""} onChange={(e) => setProp((p: SocialProps) => { p.url = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

function createSocialBlock(platform: string, defaultUrl: string) {
  function SocialLink({ url = defaultUrl, ...props }: SocialProps) {
    const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
    return (
      <BlockWrapper {...props} layout={{ display: "inline-block", ...props.layout }}>
        {enabled ? (
          <span className="inline-flex cursor-default items-center gap-2 rounded-lg border px-4 py-2 no-underline">
            {platform}
          </span>
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 no-underline hover:bg-muted">
            {platform}
          </a>
        )}
      </BlockWrapper>
    );
  }
  SocialLink.craft = {
    displayName: platform,
    props: { url: defaultUrl, platform },
    related: { settings: SocialSettings },
  };
  return SocialLink;
}

export const SocialFacebook = createSocialBlock("Facebook", "https://facebook.com");
export const SocialInstagram = createSocialBlock("Instagram", "https://instagram.com");
export const SocialWhatsApp = createSocialBlock("WhatsApp", "https://wa.me");
export const SocialYouTube = createSocialBlock("YouTube", "https://youtube.com");

type SocialIconsGroupProps = BlockProps & {
  iconSet?: "square" | "brand" | "dark" | "roundedDark" | "lightGray";
  iconSize?: number;
};

function socialIconClass(iconSet: NonNullable<SocialIconsGroupProps["iconSet"]>) {
  switch (iconSet) {
    case "brand":
      return "bg-blue-600 text-white";
    case "dark":
      return "bg-slate-700 text-white";
    case "roundedDark":
      return "rounded-full bg-slate-700 text-white";
    case "lightGray":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-white text-slate-700 border";
  }
}

function SocialIconsGroupSettings() {
  const {
    iconSet,
    iconSize,
    actions: { setProp },
  } = useNode((node) => ({
    iconSet: node.data.props.iconSet as SocialIconsGroupProps["iconSet"],
    iconSize: node.data.props.iconSize as number,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Style preset</FieldLabel>
        <select
          className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm"
          value={iconSet ?? "square"}
          onChange={(e) => setProp((p: SocialIconsGroupProps) => { p.iconSet = e.target.value as SocialIconsGroupProps["iconSet"]; })}
        >
          <option value="square">Square</option>
          <option value="brand">Brand</option>
          <option value="dark">Dark</option>
          <option value="roundedDark">Rounded dark</option>
          <option value="lightGray">Light gray</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Icon size (px)</FieldLabel>
        <FieldInput
          type="number"
          min={24}
          max={56}
          value={iconSize ?? 36}
          onChange={(e) => setProp((p: SocialIconsGroupProps) => { p.iconSize = Math.max(24, Math.min(56, Number(e.target.value) || 36)); })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function SocialIconsGroup({
  iconSet = "square",
  iconSize = 36,
  ...props
}: SocialIconsGroupProps) {
  const items = [
    { label: "f", href: "https://facebook.com" },
    { label: "ig", href: "https://instagram.com" },
    { label: "x", href: "https://x.com" },
    { label: "in", href: "https://linkedin.com" },
    { label: "yt", href: "https://youtube.com" },
    { label: "tt", href: "https://tiktok.com" },
  ];

  return (
    <BlockWrapper {...props} layout={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", ...props.layout }}>
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center rounded-md uppercase ${socialIconClass(iconSet)}`}
          style={{ width: iconSize, height: iconSize, fontSize: "0.75em", fontWeight: 600 }}
        >
          {item.label}
        </a>
      ))}
    </BlockWrapper>
  );
}

SocialIconsGroup.craft = {
  displayName: "Social Icons",
  props: { iconSet: "square", iconSize: 36 },
  related: { settings: SocialIconsGroupSettings },
};

export { SOCIAL_ICONS };

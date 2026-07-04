"use client";

import { useNode } from "@craftjs/core";
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
    return (
      <BlockWrapper {...props} layout={{ display: "inline-block", ...props.layout }}>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium no-underline hover:bg-muted">
          {platform}
        </a>
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

export { SOCIAL_ICONS };

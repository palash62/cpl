"use client";

import { useNode } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings, FieldLabel, FieldInput } from "@/modules/page-builder/components/settings/shared/block-settings";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";

type ImageProps = BlockProps & { src?: string; alt?: string };

function ImageSettings() {
  const { src, alt, actions: { setProp } } = useNode((node) => ({
    src: node.data.props.src as string,
    alt: node.data.props.alt as string,
  }));
  const setAssetPickerOpen = useBuilderStore((s) => s.setAssetPickerOpen);
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Image URL</FieldLabel>
        <div className="flex gap-2">
          <FieldInput value={src ?? ""} onChange={(e) => setProp((p: ImageProps) => { p.src = e.target.value; })} />
          <button
            type="button"
            className="shrink-0 rounded-md border border-slate-200 px-2 text-xs text-slate-600 hover:bg-slate-50"
            onClick={() => setAssetPickerOpen(true)}
          >
            Browse
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Alt text</FieldLabel>
        <FieldInput value={alt ?? ""} onChange={(e) => setProp((p: ImageProps) => { p.alt = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

export function ImageBlock({ src = "/placeholder.svg", alt = "Image", ...props }: ImageProps) {
  return (
    <BlockWrapper {...props} layout={{ width: "100%", ...props.layout }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} style={{ width: "100%", height: "auto", borderRadius: props.style?.borderRadius }} />
    </BlockWrapper>
  );
}

ImageBlock.craft = {
  displayName: "Image",
  props: { src: "https://placehold.co/800x400/e2e8f0/64748b?text=Image", alt: "Image", style: { borderRadius: "8px" } },
  related: { settings: ImageSettings },
};

type VideoProps = BlockProps & { url?: string };

function VideoSettings() {
  const { url, actions: { setProp } } = useNode((node) => ({ url: node.data.props.url as string }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Video URL (YouTube/Vimeo embed)</FieldLabel>
        <FieldInput value={url ?? ""} onChange={(e) => setProp((p: VideoProps) => { p.url = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

export function VideoBlock({ url = "", ...props }: VideoProps) {
  return (
    <BlockWrapper {...props} layout={{ width: "100%", aspectRatio: "16/9", ...props.layout }}>
      {url ? (
        <iframe src={url} title="Video" allowFullScreen className="h-full w-full rounded-lg" style={{ minHeight: 240 }} />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">Add video embed URL</div>
      )}
    </BlockWrapper>
  );
}

VideoBlock.craft = {
  displayName: "Video",
  props: { url: "" },
  related: { settings: VideoSettings },
};

type IconProps = BlockProps & { icon?: string; size?: string };

function IconSettings() {
  const { icon, size, actions: { setProp } } = useNode((node) => ({
    icon: node.data.props.icon as string,
    size: node.data.props.size as string,
  }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Icon character</FieldLabel>
        <FieldInput value={icon ?? "★"} onChange={(e) => setProp((p: IconProps) => { p.icon = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Size</FieldLabel>
        <FieldInput value={size ?? "2rem"} onChange={(e) => setProp((p: IconProps) => { p.size = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

export function IconBlock({ icon = "★", size = "2rem", ...props }: IconProps) {
  return (
    <BlockWrapper {...props} typography={{ fontSize: size, textAlign: "center", ...props.typography }}>
      {icon}
    </BlockWrapper>
  );
}

IconBlock.craft = {
  displayName: "Icon",
  props: { icon: "★", size: "2rem", typography: { textAlign: "center" } },
  related: { settings: IconSettings },
};

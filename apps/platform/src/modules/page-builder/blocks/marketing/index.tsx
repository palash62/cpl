"use client";

import { useEffect, useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings, FieldLabel, FieldInput } from "@/modules/page-builder/components/settings/shared/block-settings";
import { ButtonAppearancePanel } from "@/modules/page-builder/components/settings/ghl/button-appearance-panel";
import { ButtonLabelContent } from "@/modules/page-builder/components/editor/button-label-content";
import { hoverEffectClass, resolveButtonStyle } from "@/modules/page-builder/lib/button-appearance";
import { stripHtmlToPlain } from "@/modules/page-builder/lib/rich-text";
import { ListItemEditor } from "@/modules/page-builder/components/settings/shared/list-editor";
import { usePageTheme } from "@/modules/page-builder/hooks/use-page-theme";
import { usePublishedPage } from "@/modules/page-builder/lib/published-page-context";
import type { BlockProps, ButtonAppearanceProps } from "@/modules/page-builder/types/block-props";
import { List } from "@/modules/page-builder/blocks/typography";

type CtaProps = BlockProps & {
  text?: string;
  href?: string;
  openInNewTab?: boolean;
  fullWidth?: boolean;
  buttonAppearance?: ButtonAppearanceProps;
  /** @deprecated Prefer typography.fontSize + fullWidth; kept for older craft JSON. */
  buttonSize?: "small" | "medium" | "large" | "full";
};

function parseCtaFontSizePx(value: string | undefined, legacySize?: CtaProps["buttonSize"]): number {
  if (value) {
    const trimmed = value.trim();
    if (trimmed.endsWith("rem")) {
      const n = parseFloat(trimmed);
      if (Number.isFinite(n)) return Math.min(48, Math.max(12, Math.round(n * 16)));
    }
    const n = parseFloat(trimmed);
    if (Number.isFinite(n)) return Math.min(48, Math.max(12, Math.round(n)));
  }
  if (legacySize === "small") return 14;
  if (legacySize === "large") return 20;
  return 16;
}

function CtaSettings() {
  const { text, href, openInNewTab, fullWidth, typography, buttonSize, actions: { setProp } } = useNode((node) => ({
    text: node.data.props.text as string,
    href: node.data.props.href as string,
    openInNewTab: Boolean(node.data.props.openInNewTab),
    fullWidth:
      Boolean(node.data.props.fullWidth) ||
      node.data.props.buttonSize === "full",
    typography: node.data.props.typography as BlockProps["typography"],
    buttonSize: node.data.props.buttonSize as CtaProps["buttonSize"],
  }));
  const fontSizePx = parseCtaFontSizePx(typography?.fontSize, buttonSize);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Button text</FieldLabel>
        <FieldInput value={stripHtmlToPlain(text ?? "")} onChange={(e) => setProp((p: CtaProps) => { p.text = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>External link URL</FieldLabel>
        <FieldInput
          value={href ?? ""}
          placeholder="https://example.com"
          onChange={(e) => setProp((p: CtaProps) => { p.href = e.target.value; })}
        />
        <p className="text-[11px] text-slate-500">
          Use a full URL for external links. Use `#form` only when this button should submit the optin form.
        </p>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="accent-blue-600"
          checked={openInNewTab}
          onChange={(e) => setProp((p: CtaProps) => { p.openInNewTab = e.target.checked; })}
        />
        Open link in new tab
      </label>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Button size</FieldLabel>
          <span className="text-[11px] text-slate-500">{fontSizePx}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={48}
          step={1}
          value={fontSizePx}
          onChange={(e) =>
            setProp((p: CtaProps) => {
              p.typography = { ...(p.typography ?? {}), fontSize: `${e.target.value}px` };
              if (p.buttonSize && p.buttonSize !== "full") p.buttonSize = undefined;
            })
          }
          className="h-1.5 w-full accent-blue-600"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="accent-blue-600"
          checked={fullWidth}
          onChange={(e) =>
            setProp((p: CtaProps) => {
              p.fullWidth = e.target.checked;
              if (p.buttonSize === "full") p.buttonSize = undefined;
            })
          }
        />
        Full width
      </label>
      <ButtonAppearancePanel />
      <StandardSettings />
    </div>
  );
}

export function CtaButton({
  text = "Get Started",
  href = "#",
  openInNewTab = false,
  fullWidth = false,
  buttonSize,
  buttonAppearance,
  ...props
}: CtaProps) {
  const theme = usePageTheme();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { actions: { setProp } } = useNode();
  const published = usePublishedPage();
  const normalizedHref = (href ?? "").trim();
  const isFullWidth = fullWidth || buttonSize === "full";
  const fontSizePx = parseCtaFontSizePx(props.typography?.fontSize, buttonSize);
  const padY = Math.max(8, Math.round(fontSizePx * 0.55));
  const padX = Math.max(12, Math.round(fontSizePx * 1.35));
  const isExternalHttp =
    /^https?:\/\//i.test(normalizedHref) || normalizedHref.startsWith("//");
  const actsAsOptinSubmit =
    !enabled &&
    !!published.onLeadSubmit &&
    !isExternalHttp &&
    (!normalizedHref ||
      normalizedHref === "#" ||
      normalizedHref === "#form" ||
      normalizedHref === "#pb-optin-form");

  const hoverClass = hoverEffectClass(buttonAppearance?.hoverEffect);
  const buttonStyle = {
    ...resolveButtonStyle(theme, buttonAppearance, props.typography?.color),
    fontSize: `${fontSizePx}px`,
    lineHeight: 1.25,
    padding: `${padY}px ${padX}px`,
    display: isFullWidth ? "flex" : "inline-flex",
    width: isFullWidth ? "100%" : "auto",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box" as const,
    textDecoration: "none",
    cursor: enabled ? "default" : undefined,
  };

  const label = (
    <ButtonLabelContent
      text={text ?? ""}
      editable={enabled}
      onChange={(html) => setProp((p: CtaProps) => { p.text = html; })}
      icon={buttonAppearance?.icon}
      iconPosition={buttonAppearance?.iconPosition}
      iconSize={Math.max(14, Math.round(fontSizePx * 0.95))}
    />
  );

  return (
    <BlockWrapper
      {...props}
      typography={{ ...props.typography, fontSize: `${fontSizePx}px` }}
      layout={{ textAlign: "center", ...props.layout }}
    >
      {enabled ? (
        <button type="button" style={buttonStyle} className={hoverClass}>
          {label}
        </button>
      ) : actsAsOptinSubmit ? (
        <button type="submit" form="pb-optin-form" style={buttonStyle} className={hoverClass}>
          {label}
        </button>
      ) : (
        <a
          href={href || "#"}
          target={openInNewTab || isExternalHttp ? "_blank" : undefined}
          rel={openInNewTab || isExternalHttp ? "noopener noreferrer" : undefined}
          style={buttonStyle}
          className={hoverClass}
        >
          {label}
        </a>
      )}
    </BlockWrapper>
  );
}

CtaButton.craft = {
  displayName: "CTA Button",
  props: {
    text: "Get Started",
    href: "#form",
    openInNewTab: false,
    fullWidth: false,
    typography: { fontSize: "16px" },
  },
  related: { settings: CtaSettings },
};

type CountdownProps = BlockProps & { targetDate?: string };

function CountdownSettings() {
  const { targetDate, actions: { setProp } } = useNode((node) => ({
    targetDate: node.data.props.targetDate as string,
  }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Target date</FieldLabel>
        <FieldInput
          type="datetime-local"
          value={targetDate ? targetDate.slice(0, 16) : ""}
          onChange={(e) => setProp((p: CountdownProps) => { p.targetDate = new Date(e.target.value).toISOString(); })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function Countdown({ targetDate = "", ...props }: CountdownProps) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const target = targetDate ? new Date(targetDate).getTime() : Date.now() + 86400000;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <BlockWrapper {...props} typography={{ fontSize: "1.5rem", fontWeight: "700", textAlign: "center", ...props.typography }}>
      {remaining || "24h 0m 0s"}
    </BlockWrapper>
  );
}

Countdown.craft = {
  displayName: "Countdown",
  props: { targetDate: new Date(Date.now() + 86400000).toISOString() },
  related: { settings: StandardSettings },
};

Countdown.craft = {
  displayName: "Countdown",
  props: { targetDate: new Date(Date.now() + 86400000).toISOString() },
  related: { settings: CountdownSettings },
};

type TestimonialItem = { quote: string; author: string; role?: string };

type TestimonialsProps = BlockProps & { items?: TestimonialItem[] };

function TestimonialsSettings() {
  const { items, actions: { setProp } } = useNode((node) => ({
    items: node.data.props.items as TestimonialItem[],
  }));
  return (
    <div className="space-y-3">
      <ListItemEditor
        items={items ?? []}
        fields={[
          { key: "quote", label: "Quote", multiline: true },
          { key: "author", label: "Author" },
          { key: "role", label: "Role" },
        ]}
        onChange={(next) => setProp((p: TestimonialsProps) => { p.items = next; })}
        createItem={() => ({ quote: "Great product!", author: "Customer", role: "" })}
      />
      <StandardSettings />
    </div>
  );
}

export function Testimonials({
  items = [{ quote: "Amazing results!", author: "Jane D.", role: "Marketer" }],
  ...props
}: TestimonialsProps) {
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", ...props.layout }}>
      {items.map((item, i) => (
        <blockquote key={i} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="italic">&ldquo;{item.quote}&rdquo;</p>
          <footer className="mt-2 opacity-80">
            {item.author}
            {item.role && <span> — {item.role}</span>}
          </footer>
        </blockquote>
      ))}
    </BlockWrapper>
  );
}

Testimonials.craft = {
  displayName: "Testimonials",
  props: { items: [{ quote: "Doubled our leads in 30 days.", author: "Alex R.", role: "Agency Owner" }] },
  related: { settings: StandardSettings },
};

Testimonials.craft = {
  displayName: "Testimonials",
  props: { items: [{ quote: "Doubled our leads in 30 days.", author: "Alex R.", role: "Agency Owner" }] },
  related: { settings: TestimonialsSettings },
};

type FaqItem = { question: string; answer: string };

function FaqSettings() {
  const { items, actions: { setProp } } = useNode((node) => ({
    items: node.data.props.items as FaqItem[],
  }));
  return (
    <div className="space-y-3">
      <ListItemEditor
        items={items ?? []}
        fields={[
          { key: "question", label: "Question" },
          { key: "answer", label: "Answer", multiline: true },
        ]}
        onChange={(next) => setProp((p: BlockProps & { items?: FaqItem[] }) => { p.items = next; })}
        createItem={() => ({ question: "Question?", answer: "Answer." })}
      />
      <StandardSettings />
    </div>
  );
}

export function Faq({ items = [{ question: "How does it work?", answer: "Simply sign up and start capturing leads." }], ...props }: BlockProps & { items?: FaqItem[] }) {
  return (
    <BlockWrapper {...props}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details key={i} className="rounded-lg border p-3">
            <summary className="cursor-pointer">{item.question}</summary>
            <p className="mt-2 opacity-80">{item.answer}</p>
          </details>
        ))}
      </div>
    </BlockWrapper>
  );
}

Faq.craft = {
  displayName: "FAQ",
  props: { items: [{ question: "Is it free?", answer: "Start with our free plan today." }] },
  related: { settings: FaqSettings },
};

type PricingPlan = { name: string; price: string; features: string[] };

function PricingTableSettings() {
  const { plans, actions: { setProp } } = useNode((node) => ({
    plans: node.data.props.plans as PricingPlan[],
  }));
  const list = (plans ?? []).map((p) => ({ ...p, features: p.features.join(", ") }));
  return (
    <div className="space-y-3">
      <ListItemEditor
        items={list}
        fields={[
          { key: "name", label: "Plan name" },
          { key: "price", label: "Price" },
          { key: "features", label: "Features (comma-separated)" },
        ]}
        onChange={(next) =>
          setProp((p: BlockProps & { plans?: PricingPlan[] }) => {
            p.plans = next.map((item) => ({
              name: item.name,
              price: item.price,
              features: item.features.split(",").map((f) => f.trim()).filter(Boolean),
            }));
          })
        }
        createItem={() => ({ name: "Plan", price: "$0", features: "Feature 1" })}
      />
      <StandardSettings />
    </div>
  );
}

export function PricingTable({ plans = [{ name: "Basic", price: "$29/mo", features: ["100 leads", "Email support"] }], ...props }: BlockProps & { plans?: PricingPlan[] }) {
  const theme = usePageTheme();
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", ...props.layout }}>
      {plans.map((plan) => (
        <div key={plan.name} className="rounded-lg border p-4 text-center">
          <h4>{plan.name}</h4>
          <p className="my-2" style={{ color: theme.primaryColor, fontSize: "1.5em", fontWeight: 700 }}>{plan.price}</p>
          <ul className="space-y-1 text-left">
            {plan.features.map((f) => <li key={f}>✓ {f}</li>)}
          </ul>
        </div>
      ))}
    </BlockWrapper>
  );
}

PricingTable.craft = {
  displayName: "Pricing Table",
  props: { plans: [{ name: "Pro", price: "$49/mo", features: ["Unlimited leads", "Priority support", "Analytics"] }] },
  related: { settings: PricingTableSettings },
};

type Feature = { title: string; description: string };

export function FeatureCards({ features = [{ title: "Fast Setup", description: "Launch in minutes." }], ...props }: BlockProps & { features?: Feature[] }) {
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", ...props.layout }}>
      {features.map((f) => (
        <div key={f.title} className="rounded-lg border p-4">
          <h4>{f.title}</h4>
          <p className="mt-1 opacity-80">{f.description}</p>
        </div>
      ))}
    </BlockWrapper>
  );
}

FeatureCards.craft = {
  displayName: "Feature Cards",
  props: { features: [{ title: "High Converting", description: "Templates optimized for CPL." }] },
  related: { settings: StandardSettings },
};

export function TrustBadges({ badges = ["SSL Secured", "GDPR Compliant", "24/7 Support"], ...props }: BlockProps & { badges?: string[] }) {
  return (
    <BlockWrapper {...props} layout={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", ...props.layout }}>
      {badges.map((b) => (
        <span key={b} className="rounded-full border bg-muted px-3 py-1">{b}</span>
      ))}
    </BlockWrapper>
  );
}

TrustBadges.craft = {
  displayName: "Trust Badges",
  props: { badges: ["SSL Secured", "GDPR Compliant"] },
  related: { settings: StandardSettings },
};

type ProgressBarProps = BlockProps & {
  label?: string;
  value?: number;
  max?: number;
  showValue?: boolean;
};

function ProgressBarSettings() {
  const {
    label,
    value,
    max,
    showValue,
    actions: { setProp },
  } = useNode((node) => ({
    label: node.data.props.label as string,
    value: node.data.props.value as number,
    max: node.data.props.max as number,
    showValue: node.data.props.showValue as boolean,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Label</FieldLabel>
        <FieldInput value={label ?? ""} onChange={(e) => setProp((p: ProgressBarProps) => { p.label = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Value</FieldLabel>
        <FieldInput
          type="number"
          min={0}
          value={value ?? 0}
          onChange={(e) => setProp((p: ProgressBarProps) => { p.value = Number(e.target.value) || 0; })}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Max</FieldLabel>
        <FieldInput
          type="number"
          min={1}
          value={max ?? 100}
          onChange={(e) => setProp((p: ProgressBarProps) => { p.max = Math.max(1, Number(e.target.value) || 100); })}
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={showValue !== false}
          onChange={(e) => setProp((p: ProgressBarProps) => { p.showValue = e.target.checked; })}
        />
        Show value text
      </label>
      <StandardSettings />
    </div>
  );
}

export function ProgressBar({
  label = "Goal progress",
  value = 65,
  max = 100,
  showValue = true,
  ...props
}: ProgressBarProps) {
  const theme = usePageTheme();
  const safeMax = Math.max(1, max);
  const safeValue = Math.min(Math.max(0, value), safeMax);
  const percent = Math.round((safeValue / safeMax) * 100);

  return (
    <BlockWrapper {...props} layout={{ ...props.layout }}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span>{label}</span>
          {showValue && <span style={{ fontWeight: 600 }}>{percent}%</span>}
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percent}%`, backgroundColor: theme.primaryColor }}
          />
        </div>
      </div>
    </BlockWrapper>
  );
}

ProgressBar.craft = {
  displayName: "Progress Bar",
  props: { label: "Goal progress", value: 65, max: 100, showValue: true },
  related: { settings: ProgressBarSettings },
};

type MapBlockProps = BlockProps & { location?: string; height?: number };

function MapBlockSettings() {
  const {
    location,
    height,
    actions: { setProp },
  } = useNode((node) => ({
    location: node.data.props.location as string,
    height: node.data.props.height as number,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Location query</FieldLabel>
        <FieldInput value={location ?? ""} onChange={(e) => setProp((p: MapBlockProps) => { p.location = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Height (px)</FieldLabel>
        <FieldInput
          type="number"
          min={180}
          value={height ?? 320}
          onChange={(e) => setProp((p: MapBlockProps) => { p.height = Math.max(180, Number(e.target.value) || 320); })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function MapBlock({ location = "New York, USA", height = 320, ...props }: MapBlockProps) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
  return (
    <BlockWrapper {...props}>
      <iframe
        title={`Map ${location}`}
        src={src}
        className="w-full rounded-lg border"
        style={{ height }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </BlockWrapper>
  );
}

MapBlock.craft = {
  displayName: "Map",
  props: { location: "New York, USA", height: 320 },
  related: { settings: MapBlockSettings },
};

type CalendarBlockProps = BlockProps & { embedUrl?: string; height?: number };

function CalendarBlockSettings() {
  const {
    embedUrl,
    height,
    actions: { setProp },
  } = useNode((node) => ({
    embedUrl: node.data.props.embedUrl as string,
    height: node.data.props.height as number,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Embed URL</FieldLabel>
        <FieldInput
          value={embedUrl ?? ""}
          placeholder="https://calendar.google.com/calendar/embed?..."
          onChange={(e) => setProp((p: CalendarBlockProps) => { p.embedUrl = e.target.value; })}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Height (px)</FieldLabel>
        <FieldInput
          type="number"
          min={240}
          value={height ?? 540}
          onChange={(e) => setProp((p: CalendarBlockProps) => { p.height = Math.max(240, Number(e.target.value) || 540); })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function CalendarBlock({
  embedUrl = "https://calendar.google.com/calendar/embed?src=en.indian%23holiday%40group.v.calendar.google.com&ctz=Asia%2FKolkata",
  height = 540,
  ...props
}: CalendarBlockProps) {
  return (
    <BlockWrapper {...props}>
      <iframe
        title="Calendar"
        src={embedUrl}
        className="w-full rounded-lg border"
        style={{ height }}
        loading="lazy"
      />
    </BlockWrapper>
  );
}

CalendarBlock.craft = {
  displayName: "Calendar",
  props: {
    embedUrl:
      "https://calendar.google.com/calendar/embed?src=en.indian%23holiday%40group.v.calendar.google.com&ctz=Asia%2FKolkata",
    height: 540,
  },
  related: { settings: CalendarBlockSettings },
};

export function BlogPosts(props: BlockProps) {
  return (
    <FeatureCards
      {...props}
      features={[
        { title: "How to scale leads", description: "A practical guide to improving CPL funnel performance." },
        { title: "Top converting headlines", description: "Examples you can apply in your next campaign." },
      ]}
    />
  );
}
BlogPosts.craft = {
  displayName: "Blog Posts",
  related: { settings: StandardSettings },
};

export function CategoryNavigation(props: BlockProps) {
  return (
    <List
      {...props}
      items={["Marketing", "Sales", "Automation", "Tracking"]}
      ordered={false}
    />
  );
}
CategoryNavigation.craft = {
  displayName: "Category Navigation",
  related: { settings: StandardSettings },
};

export function SocialShare(props: BlockProps) {
  return <TrustBadges {...props} badges={["Share on Facebook", "Share on X", "Share on LinkedIn"]} />;
}
SocialShare.craft = {
  displayName: "Social Share",
  related: { settings: StandardSettings },
};

export function SubscribeToMailingList(props: BlockProps) {
  return (
    <CtaButton
      {...props}
      text="Subscribe to Mailing List"
      href="#"
    />
  );
}
SubscribeToMailingList.craft = {
  displayName: "Subscribe to Mailing List",
  related: { settings: StandardSettings },
};

export function ImageSlider(props: BlockProps) {
  return (
    <BlockWrapper {...props}>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-md bg-slate-200" />
        ))}
      </div>
    </BlockWrapper>
  );
}
ImageSlider.craft = {
  displayName: "Image Slider",
  related: { settings: StandardSettings },
};

export function PhotoGallery(props: BlockProps) {
  return (
    <BlockWrapper {...props}>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 rounded-md bg-slate-200" />
        ))}
      </div>
    </BlockWrapper>
  );
}
PhotoGallery.craft = {
  displayName: "Photo Gallery",
  related: { settings: StandardSettings },
};

export function LogoShowcase(props: BlockProps) {
  return <TrustBadges {...props} badges={["Stripe", "HubSpot", "Meta", "Google"]} />;
}
LogoShowcase.craft = {
  displayName: "Logo Showcase",
  related: { settings: StandardSettings },
};

export function Survey(props: BlockProps) {
  return (
    <BlockWrapper {...props}>
      <div className="space-y-2 rounded-lg border p-4">
        <p>Quick survey</p>
        <p className="opacity-70">What is your biggest challenge right now?</p>
      </div>
    </BlockWrapper>
  );
}
Survey.craft = {
  displayName: "Survey",
  related: { settings: StandardSettings },
};

export function Reviews(props: BlockProps) {
  return (
    <Testimonials
      {...props}
      items={[
        { quote: "Excellent quality leads and smooth setup.", author: "Priya M.", role: "Advertiser" },
        { quote: "Our best CPL campaign this quarter.", author: "Arjun K.", role: "Growth Lead" },
      ]}
    />
  );
}
Reviews.craft = {
  displayName: "Reviews",
  related: { settings: StandardSettings },
};

export function MinuteTimer(props: BlockProps) {
  const date = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  return <Countdown {...props} targetDate={date} />;
}
MinuteTimer.craft = {
  displayName: "Minute Timer",
  related: { settings: StandardSettings },
};

export function DayTimer(props: BlockProps) {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return <Countdown {...props} targetDate={date} />;
}
DayTimer.craft = {
  displayName: "Day Timer",
  related: { settings: StandardSettings },
};

export function NavigationMenu(props: BlockProps) {
  return (
    <BlockWrapper {...props}>
      <div className="flex flex-wrap gap-4">
        {["Home", "Features", "Pricing", "Contact"].map((item) => (
          <a key={item} href="#" className="hover:underline">
            {item}
          </a>
        ))}
      </div>
    </BlockWrapper>
  );
}
NavigationMenu.craft = {
  displayName: "Navigation Menu",
  related: { settings: StandardSettings },
};

export function ImageFeature(props: BlockProps) {
  return (
    <BlockWrapper {...props}>
      <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-[96px,1fr]">
        <div className="h-24 rounded-md bg-slate-200" />
        <div>
          <p>Feature headline</p>
          <p className="mt-1 opacity-70">Highlight your strongest benefit with supporting text.</p>
        </div>
      </div>
    </BlockWrapper>
  );
}
ImageFeature.craft = {
  displayName: "Image Feature",
  related: { settings: StandardSettings },
};

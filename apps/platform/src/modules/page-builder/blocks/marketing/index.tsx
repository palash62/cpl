"use client";

import { useEffect, useState } from "react";
import { useNode } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings, FieldLabel, FieldInput } from "@/modules/page-builder/components/settings/shared/block-settings";
import { buttonStyleFromTheme } from "@/modules/page-builder/lib/theme";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type CtaProps = BlockProps & { text?: string; href?: string };

function CtaSettings() {
  const { text, href, actions: { setProp } } = useNode((node) => ({
    text: node.data.props.text as string,
    href: node.data.props.href as string,
  }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Button text</FieldLabel>
        <FieldInput value={text ?? ""} onChange={(e) => setProp((p: CtaProps) => { p.text = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Link URL</FieldLabel>
        <FieldInput value={href ?? ""} onChange={(e) => setProp((p: CtaProps) => { p.href = e.target.value; })} />
      </div>
      <StandardSettings />
    </div>
  );
}

export function CtaButton({ text = "Get Started", href = "#", ...props }: CtaProps) {
  const theme = useBuilderStore((s) => s.theme);
  return (
    <BlockWrapper {...props} layout={{ textAlign: "center", ...props.layout }}>
      <a href={href} style={buttonStyleFromTheme(theme)} className="inline-block px-6 py-3 font-medium no-underline">
        {text}
      </a>
    </BlockWrapper>
  );
}

CtaButton.craft = {
  displayName: "CTA Button",
  props: { text: "Get Started", href: "#form" },
  related: { settings: CtaSettings },
};

type CountdownProps = BlockProps & { targetDate?: string };

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

type TestimonialItem = { quote: string; author: string; role?: string };

type TestimonialsProps = BlockProps & { items?: TestimonialItem[] };

export function Testimonials({
  items = [{ quote: "Amazing results!", author: "Jane D.", role: "Marketer" }],
  ...props
}: TestimonialsProps) {
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", ...props.layout }}>
      {items.map((item, i) => (
        <blockquote key={i} className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm italic">&ldquo;{item.quote}&rdquo;</p>
          <footer className="mt-2 text-xs font-medium">{item.author}{item.role && <span className="text-muted-foreground"> — {item.role}</span>}</footer>
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

type FaqItem = { question: string; answer: string };

export function Faq({ items = [{ question: "How does it work?", answer: "Simply sign up and start capturing leads." }], ...props }: BlockProps & { items?: FaqItem[] }) {
  return (
    <BlockWrapper {...props}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <details key={i} className="rounded-lg border p-3">
            <summary className="cursor-pointer font-medium">{item.question}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </BlockWrapper>
  );
}

Faq.craft = {
  displayName: "FAQ",
  props: { items: [{ question: "Is it free?", answer: "Start with our free plan today." }] },
  related: { settings: StandardSettings },
};

type PricingPlan = { name: string; price: string; features: string[] };

export function PricingTable({ plans = [{ name: "Basic", price: "$29/mo", features: ["100 leads", "Email support"] }], ...props }: BlockProps & { plans?: PricingPlan[] }) {
  const theme = useBuilderStore((s) => s.theme);
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", ...props.layout }}>
      {plans.map((plan) => (
        <div key={plan.name} className="rounded-lg border p-4 text-center">
          <h4 className="font-semibold">{plan.name}</h4>
          <p className="my-2 text-2xl font-bold" style={{ color: theme.primaryColor }}>{plan.price}</p>
          <ul className="space-y-1 text-sm text-left">
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
  related: { settings: StandardSettings },
};

type Feature = { title: string; description: string };

export function FeatureCards({ features = [{ title: "Fast Setup", description: "Launch in minutes." }], ...props }: BlockProps & { features?: Feature[] }) {
  return (
    <BlockWrapper {...props} layout={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", ...props.layout }}>
      {features.map((f) => (
        <div key={f.title} className="rounded-lg border p-4">
          <h4 className="font-semibold">{f.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
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
        <span key={b} className="rounded-full border bg-muted px-3 py-1 text-xs font-medium">{b}</span>
      ))}
    </BlockWrapper>
  );
}

TrustBadges.craft = {
  displayName: "Trust Badges",
  props: { badges: ["SSL Secured", "GDPR Compliant"] },
  related: { settings: StandardSettings },
};

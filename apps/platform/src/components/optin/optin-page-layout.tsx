"use client";

import {
  ArrowRight,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { PublicOptinPage } from "@/lib/optin-page";
import type { OptinTemplateId } from "@/lib/optin-templates";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Field = PublicOptinPage["fields"][number];

type LayoutProps = {
  page: PublicOptinPage;
  thumbnail?: boolean;
  data: Record<string, string>;
  setData: (value: Record<string, string>) => void;
  honeypot: string;
  setHoneypot: (value: string) => void;
  error: string;
  status: "idle" | "loading" | "success" | "error";
  onSubmit: (e: React.FormEvent) => void;
};

function BackgroundOrbs({
  primary,
  accent,
  thumbnail,
}: {
  primary: string;
  accent: string;
  thumbnail?: boolean;
}) {
  if (thumbnail) return null;

  return (
    <>
      <div
        className="optin-float pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: `${primary}55` }}
      />
      <div
        className="optin-float-reverse pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${accent}44` }}
      />
      <div
        className="optin-float pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `${accent}22`, animationDelay: "1.5s" }}
      />
    </>
  );
}

function GridPattern({ inverted }: { inverted?: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.035]"
      style={{
        backgroundImage: inverted
          ? "radial-gradient(circle at 1px 1px, white 1px, transparent 0)"
          : "radial-gradient(circle at 1px 1px, #0f172a 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

function SocialProofStrip({
  primary,
  inverted,
  thumbnail,
}: {
  primary: string;
  inverted?: boolean;
  thumbnail?: boolean;
}) {
  const avatars = ["A", "M", "S", "J", "K"];

  return (
    <div className={cn("flex items-center gap-3", thumbnail ? "mt-2" : "mt-8")}>
      <div className="flex -space-x-2">
        {avatars.slice(0, thumbnail ? 3 : 5).map((initial, i) => (
          <div
            key={initial}
            className={cn(
              "flex items-center justify-center rounded-full border-2 font-bold",
              thumbnail ? "h-5 w-5 text-[7px]" : "h-9 w-9 text-xs",
              inverted ? "border-slate-900 bg-white/20 text-white" : "border-white bg-slate-100 text-slate-700",
            )}
            style={{
              background: i % 2 === 0 ? `${primary}33` : undefined,
            }}
          >
            {initial}
          </div>
        ))}
      </div>
      <div className={cn(inverted ? "text-slate-300" : "text-slate-600")}>
        <p className={cn("font-bold", thumbnail ? "text-[9px]" : "text-sm", inverted && "text-white")}>
          <span style={{ color: primary }}>12,000+</span> joined this week
        </p>
        {!thumbnail && (
          <p className={cn("flex items-center gap-1 text-xs", inverted ? "text-slate-400" : "text-slate-500")}>
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            4.9/5 average rating
          </p>
        )}
      </div>
    </div>
  );
}

function TrustFooter({ inverted, thumbnail }: { inverted?: boolean; thumbnail?: boolean }) {
  if (thumbnail) return null;

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs",
        inverted ? "text-slate-400" : "text-slate-500",
      )}
    >
      <span className="flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Secure & encrypted
      </span>
      <span className="flex items-center gap-1">
        <ShieldCheck className="h-3 w-3" />
        No spam, ever
      </span>
      <span className="flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Unsubscribe anytime
      </span>
    </div>
  );
}

function MarketingBadge({
  page,
  inverted,
  thumbnail,
}: {
  page: PublicOptinPage;
  inverted?: boolean;
  thumbnail?: boolean;
}) {
  if (!page.badgeText) return null;

  return (
    <div
      className={cn(
        "optin-badge-pulse mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold uppercase tracking-wide",
        thumbnail ? "text-[8px]" : "text-xs",
        inverted
          ? "border-white/20 bg-white/10 text-white backdrop-blur-sm"
          : "border-slate-200/80 bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm",
      )}
      style={
        {
          "--optin-accent": page.accentColor,
          color: inverted ? page.accentColor : page.primaryColor,
        } as React.CSSProperties
      }
    >
      <Sparkles className={cn(thumbnail ? "h-2 w-2" : "h-3.5 w-3.5")} />
      {page.badgeText}
    </div>
  );
}

function GradientHeadline({
  page,
  thumbnail,
  inverted,
  className,
}: {
  page: PublicOptinPage;
  thumbnail?: boolean;
  inverted?: boolean;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-extrabold leading-[1.08] tracking-tight",
        thumbnail ? "text-xl" : "text-4xl sm:text-5xl lg:text-[3.4rem]",
        className,
      )}
    >
      {inverted ? (
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, #fff 0%, ${page.accentColor} 50%, #fff 100%)`,
          }}
        >
          {page.headline}
        </span>
      ) : (
        <span
          className="optin-shimmer-text bg-clip-text text-transparent"
          style={{
            backgroundImage: `linear-gradient(135deg, ${page.primaryColor}, ${page.accentColor}, ${page.primaryColor})`,
          }}
        >
          {page.headline}
        </span>
      )}
    </h1>
  );
}

function HeroCopy({
  page,
  thumbnail,
  inverted = true,
  centered = false,
}: {
  page: PublicOptinPage;
  thumbnail?: boolean;
  inverted?: boolean;
  centered?: boolean;
}) {
  return (
    <div className={cn(inverted ? "text-white" : "text-slate-900", centered && "text-center")}>
      <MarketingBadge page={page} inverted={inverted} thumbnail={thumbnail} />
      <GradientHeadline page={page} thumbnail={thumbnail} inverted={inverted} />
      <p
        className={cn(
          "mt-4 font-medium leading-relaxed",
          thumbnail ? "text-xs" : "text-lg sm:text-xl",
          inverted ? "text-slate-300" : "text-slate-600",
          centered && "mx-auto max-w-2xl",
        )}
      >
        {page.subheadline}
      </p>
      {!thumbnail && page.description && (
        <p
          className={cn(
            "mt-4 max-w-xl text-base leading-relaxed",
            inverted ? "text-slate-400" : "text-slate-500",
            centered && "mx-auto",
          )}
        >
          {page.description}
        </p>
      )}
      {!thumbnail && (
        <ul className={cn("mt-8 space-y-3", centered && "mx-auto max-w-md text-left")}>
          {page.bulletPoints.map((point) => (
            <li
              key={point}
              className={cn(
                "flex items-start gap-3 text-sm sm:text-base",
                inverted ? "text-slate-200" : "text-slate-700",
              )}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${page.primaryColor}, ${page.accentColor})`,
                }}
              >
                <Zap className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="font-medium">{point}</span>
            </li>
          ))}
        </ul>
      )}
      <SocialProofStrip primary={page.primaryColor} inverted={inverted} thumbnail={thumbnail} />
    </div>
  );
}

function OptinFormPanel({
  page,
  thumbnail,
  data,
  setData,
  honeypot,
  setHoneypot,
  error,
  status,
  onSubmit,
  className,
  dark = false,
  glow = false,
}: LayoutProps & { className?: string; dark?: boolean; glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 text-slate-900 shadow-2xl sm:p-7",
        dark
          ? "border-white/15 bg-slate-950/80 text-white backdrop-blur-xl"
          : "border-white/60 bg-white/95 backdrop-blur-xl",
        glow && "shadow-[0_0_60px_-12px]",
        className,
      )}
      style={
        glow
          ? {
              boxShadow: `0 25px 50px -12px ${page.primaryColor}44, 0 0 60px -12px ${page.accentColor}33`,
            }
          : undefined
      }
    >
      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${page.primaryColor}, ${page.accentColor}, ${page.primaryColor})` }}
      />

      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div
              className={cn(
                "mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                dark ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700",
              )}
            >
              <TrendingUp className="h-3 w-3" />
              Free access
            </div>
            <h2 className={cn("text-xl font-bold", dark ? "text-white" : "text-slate-900")}>
              {page.displayTitle}
            </h2>
            <p className={cn("mt-1 text-sm", dark ? "text-slate-400" : "text-slate-500")}>
              Join thousands — takes 30 seconds
            </p>
          </div>
          {!thumbnail && (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${page.primaryColor}, ${page.accentColor})`,
              }}
            >
              <Users className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && !thumbnail && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!thumbnail && (
            <input
              type="text"
              name="website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
          )}
          {page.fields.slice(0, thumbnail ? 2 : undefined).map((field: Field) => (
            <div key={field.fieldName} className="space-y-1.5">
              <Label
                htmlFor={thumbnail ? undefined : field.fieldName}
                className={cn("text-xs font-semibold", dark ? "text-slate-300" : "text-slate-700")}
              >
                {field.label}
              </Label>
              <Input
                id={thumbnail ? undefined : field.fieldName}
                readOnly={thumbnail}
                tabIndex={thumbnail ? -1 : undefined}
                type={
                  field.fieldType === "email"
                    ? "email"
                    : field.fieldType === "phone"
                      ? "tel"
                      : "text"
                }
                required={!thumbnail && field.required}
                value={thumbnail ? "" : (data[field.fieldName] ?? "")}
                onChange={(e) => setData({ ...data, [field.fieldName]: e.target.value })}
                placeholder={
                  thumbnail
                    ? undefined
                    : field.fieldType === "email"
                      ? "you@company.com"
                      : field.fieldType === "phone"
                        ? "+1 (555) 000-0000"
                        : "Your name"
                }
                className={cn(
                  "h-11 rounded-xl text-sm transition-shadow focus-visible:ring-2",
                  dark
                    ? "border-white/15 bg-white/10 text-white placeholder:text-slate-500 focus-visible:ring-white/20"
                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-[color-mix(in_srgb,var(--optin-primary)_30%,transparent)]",
                )}
                style={
                  {
                    "--optin-primary": page.primaryColor,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}

          <button
            type={thumbnail ? "button" : "submit"}
            disabled={status === "loading" || page.previewMode || thumbnail}
            className={cn(
              "group optin-cta-glow flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all",
              "hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100",
            )}
            style={{
              background: `linear-gradient(135deg, ${page.primaryColor}, ${page.accentColor})`,
              boxShadow: `0 10px 30px -8px ${page.primaryColor}88`,
            }}
          >
            {status === "loading" ? (
              "Submitting..."
            ) : (
              <>
                {page.ctaText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <TrustFooter inverted={dark} thumbnail={thumbnail} />
      </div>
    </div>
  );
}

function AuroraLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div className="relative min-h-full overflow-hidden bg-slate-950 text-white">
      <GridPattern inverted />
      <BackgroundOrbs primary={page.primaryColor} accent={page.accentColor} thumbnail={thumbnail} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 10% 20%, ${page.primaryColor}33, transparent 50%), radial-gradient(ellipse 60% 50% at 90% 10%, ${page.accentColor}28, transparent 45%)`,
        }}
      />
      <div
        className={cn(
          "relative flex",
          thumbnail ? "flex-col gap-3 p-3" : "min-h-screen flex-col lg:flex-row lg:items-center",
        )}
      >
        <section
          className={cn(
            "flex flex-1 flex-col justify-center",
            thumbnail ? "p-2" : "px-6 py-16 lg:px-14 lg:py-20",
          )}
        >
          <HeroCopy page={page} thumbnail={thumbnail} />
        </section>
        <section
          className={cn(
            "flex flex-1 items-center",
            thumbnail ? "p-2" : "px-6 py-12 lg:px-14",
          )}
        >
          <OptinFormPanel {...props} glow className="w-full lg:max-w-md lg:ml-auto" />
        </section>
      </div>
    </div>
  );
}

function SunriseLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div
      className={cn("relative min-h-full overflow-hidden", thumbnail ? "p-3" : "min-h-screen")}
      style={{
        background: `linear-gradient(165deg, ${page.primaryColor}18 0%, ${page.accentColor}28 35%, #fff7ed 70%, #ffffff 100%)`,
      }}
    >
      <GridPattern />
      {!thumbnail && (
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full blur-3xl"
          style={{ background: `${page.accentColor}55` }}
        />
      )}
      <div
        className={cn(
          "relative mx-auto flex max-w-lg flex-col gap-6",
          !thumbnail && "min-h-screen justify-center px-4 py-16",
        )}
      >
        <HeroCopy page={page} thumbnail={thumbnail} inverted={false} centered />
        <OptinFormPanel {...props} glow className="shadow-[0_30px_60px_-20px_rgba(249,115,22,0.35)]" />
      </div>
    </div>
  );
}

function OceanLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div
      className={cn("relative min-h-full overflow-hidden text-white", thumbnail ? "p-3" : "min-h-screen")}
      style={{
        background: `linear-gradient(160deg, #0c4a6e 0%, ${page.primaryColor} 40%, ${page.accentColor} 100%)`,
      }}
    >
      <GridPattern inverted />
      {!thumbnail && (
        <>
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
          <div
            className="optin-float pointer-events-none absolute -left-16 top-1/4 h-72 w-72 rounded-full blur-3xl"
            style={{ background: `${page.accentColor}44` }}
          />
        </>
      )}
      <div
        className={cn(
          "relative mx-auto flex max-w-lg flex-col gap-6",
          !thumbnail && "min-h-screen justify-center px-4 py-16",
        )}
      >
        <HeroCopy page={page} thumbnail={thumbnail} centered />
        <OptinFormPanel {...props} glow className="border-white/20" />
      </div>
    </div>
  );
}

function MinimalLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div className={cn("relative min-h-full bg-gradient-to-b from-slate-50 to-white", thumbnail ? "p-3" : "min-h-screen")}>
      <GridPattern />
      {!thumbnail && (
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-30"
          style={{
            background: `linear-gradient(135deg, transparent, ${page.accentColor}11)`,
          }}
        />
      )}
      <div
        className={cn(
          "relative mx-auto flex max-w-6xl",
          thumbnail ? "flex-col gap-3" : "min-h-screen flex-col lg:flex-row lg:items-center",
        )}
      >
        <section
          className={cn(
            "flex flex-1 flex-col justify-center",
            thumbnail ? "p-2" : "px-8 py-16 lg:px-14",
          )}
        >
          <HeroCopy page={page} thumbnail={thumbnail} inverted={false} />
        </section>
        <section
          className={cn(
            "flex flex-1 items-center",
            thumbnail ? "p-2" : "px-8 py-12 lg:px-14",
          )}
        >
          <OptinFormPanel
            {...props}
            glow
            className="w-full border-slate-200/80 shadow-[0_25px_50px_-12px_rgba(15,23,42,0.12)]"
          />
        </section>
      </div>
    </div>
  );
}

function BoldLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div
      className={cn("relative min-h-full overflow-hidden text-white", thumbnail ? "p-3" : "min-h-screen")}
      style={{
        background: `linear-gradient(135deg, ${page.primaryColor} 0%, ${page.accentColor} 50%, ${page.primaryColor}dd 100%)`,
      }}
    >
      <GridPattern inverted />
      {!thumbnail && (
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wOCkiLz48L3N2Zz4=')] opacity-60" />
      )}
      <div className={cn("relative", thumbnail ? "space-y-3" : "px-4 pb-20 pt-16 sm:pt-20")}>
        <div className="mx-auto max-w-4xl text-center">
          <HeroCopy page={page} thumbnail={thumbnail} centered />
        </div>
        <div className={cn("mx-auto max-w-md", thumbnail ? "mt-2" : "-mt-4 sm:-mt-8")}>
          <OptinFormPanel
            {...props}
            glow
            className="border-white/30 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>
    </div>
  );
}

function NeonLayout(props: LayoutProps) {
  const { page, thumbnail } = props;

  return (
    <div className={cn("relative min-h-full overflow-hidden bg-[#030712] text-white", thumbnail ? "p-3" : "min-h-screen")}>
      <GridPattern inverted />
      <BackgroundOrbs primary={page.primaryColor} accent={page.accentColor} thumbnail={thumbnail} />
      {!thumbnail && (
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${page.primaryColor}11 2px, ${page.primaryColor}11 4px)`,
          }}
        />
      )}
      <div
        className={cn(
          "relative flex",
          thumbnail ? "flex-col gap-3" : "min-h-screen flex-col-reverse lg:flex-row lg:items-center",
        )}
      >
        <section
          className={cn(
            "flex flex-1 flex-col justify-center",
            thumbnail ? "p-2" : "px-8 py-14 lg:px-14",
          )}
        >
          <HeroCopy page={page} thumbnail={thumbnail} />
          {!thumbnail && (
            <p className="mt-6 flex items-center gap-2 text-sm text-cyan-300/80">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Enterprise-grade security · GDPR friendly
            </p>
          )}
        </section>
        <section
          className={cn(
            "flex flex-1 items-center",
            thumbnail ? "p-2" : "px-8 py-14 lg:px-14",
          )}
        >
          <OptinFormPanel
            {...props}
            dark
            glow
            className="w-full border-cyan-400/25 shadow-[0_0_80px_rgba(34,211,238,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]"
          />
        </section>
      </div>
    </div>
  );
}

const LAYOUTS: Record<OptinTemplateId, (props: LayoutProps) => React.ReactElement> = {
  aurora: AuroraLayout,
  sunrise: SunriseLayout,
  ocean: OceanLayout,
  minimal: MinimalLayout,
  bold: BoldLayout,
  neon: NeonLayout,
};

export function OptinPageLayout({
  page,
  thumbnail,
  data,
  setData,
  honeypot,
  setHoneypot,
  error,
  status,
  onSubmit,
}: LayoutProps) {
  const Layout = LAYOUTS[page.templateId] ?? LAYOUTS.aurora;

  return (
    <Layout
      page={page}
      thumbnail={thumbnail}
      data={data}
      setData={setData}
      honeypot={honeypot}
      setHoneypot={setHoneypot}
      error={error}
      status={status}
      onSubmit={onSubmit}
    />
  );
}

export function OptinSuccessScreen({
  page,
  redirectNote,
}: {
  page: PublicOptinPage;
  redirectNote?: string;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        background: `linear-gradient(160deg, #0f172a 0%, ${page.primaryColor}44 50%, ${page.accentColor}33 100%)`,
      }}
    >
      <BackgroundOrbs primary={page.primaryColor} accent={page.accentColor} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-10 text-center backdrop-blur-2xl"
        style={{ boxShadow: `0 0 100px ${page.primaryColor}44, 0 25px 50px -12px rgba(0,0,0,0.5)` }}
      >
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(135deg, ${page.primaryColor}, ${page.accentColor})`,
            boxShadow: `0 0 40px ${page.accentColor}66`,
          }}
        >
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold tracking-tight text-white">{page.successTitle}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-300">{page.successMessage}</p>
        {redirectNote ? (
          <p className="mt-4 text-sm text-amber-200/90">{redirectNote}</p>
        ) : (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-300">
            <Sparkles className="h-4 w-4" style={{ color: page.accentColor }} />
            You&apos;re all set — check your inbox
          </div>
        )}
      </div>
    </div>
  );
}
